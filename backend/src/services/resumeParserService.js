const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
// const pdfParse = require('pdf-parse');
const { PDFParse } = require("pdf-parse");
const mammoth = require('mammoth');
const AuditLog = require('./auditService');
const grokService = require('../ai/grokService');
const ResumeParseLog = require('../models/ResumeParseLog');
const Referral = require('../models/Referral');
const { validateResumeFile, validateParsedData } = require('../validators/resumeParserValidator');
const ApiError = require('../utils/apiError');

const computeTextHash = (text) => {
  return crypto.createHash('sha256').update(text || '').digest('hex');
};



const normalizePhone = (value) => {
  if (!value) return null;
  const digits = String(value).replace(/[^0-9]/g, '');
  return digits.length >= 8 ? digits : null;
};

const normalizeEmail = (value) => {
  if (!value) return null;
  return String(value).trim().toLowerCase();
};

const normalizeSkills = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((skill) => typeof skill === 'string').map((skill) => skill.trim()).filter(Boolean);
  return String(value)
    .split(/[,;\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean);
};

const extractResumeText = async (filePath, extension) => {
  if (extension === '.pdf') {
    const buffer = await fs.readFile(filePath);
    // const data = await pdfParse(buffer);
    const parser = new PDFParse({
  data: buffer,
});

const data = await parser.getText();
    return data.text || '';
  }

  if (extension === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  }

  throw new ApiError(400, 'Unsupported resume format');
};

const buildField = (field) => {
  if (typeof field === 'string') {
    return { value: field.trim(), confidence: 0.8 };
  }

  if (typeof field === 'object' && field !== null) {
    const value = field.value != null ? field.value : field.text;
    const confidence = Number.isFinite(field.confidence) ? field.confidence : 0.8;
    return { value: typeof value === 'string' ? String(value).trim() : value, confidence };
  }

  return { value: null, confidence: 0 };
};

const buildStructuredResume = (grokResult) => {
  const raw = grokResult || {};
  const fullName = buildField(raw.fullName || raw.name || raw['full_name']);
  const email = buildField(raw.email || raw.emailAddress || raw['email_address']);
  const phone = buildField(raw.phone || raw.phoneNumber || raw['phone_number']);
  const skillsValue = raw.skills || raw.skillSet || raw['skill_set'];
  const educationValue = raw.education || raw.educationHistory || raw['education_history'];
  const experienceValue = raw.experience || raw.workExperience || raw['work_experience'];

  const skills = normalizeSkills(skillsValue);
  const experience = typeof experienceValue === 'string' ? experienceValue.trim() : experienceValue;
  const education = typeof educationValue === 'string' ? educationValue.trim() : educationValue;

  const confidences = [fullName.confidence, email.confidence, phone.confidence];
  const averageConfidence = Number((confidences.filter(Number.isFinite).reduce((sum, item) => sum + item, 0) / Math.max(confidences.length, 1)).toFixed(2));

  return {
    fullName,
    email,
    phone,
    skills: { value: skills, confidence: skills.length ? 0.75 : 0 },
    education: { value: education, confidence: education ? 0.7 : 0 },
    experience: { value: experience, confidence: experience ? 0.7 : 0 },
    confidence: {
      fullName: fullName.confidence,
      email: email.confidence,
      phone: phone.confidence,
      skills: skills.length ? 0.75 : 0,
      education: education ? 0.7 : 0,
      experience: experience ? 0.7 : 0,
      overall: averageConfidence,
    },
  };
};

const detectDuplicate = async ({ email, phone, textHash }) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  if (normalizedEmail) {
    const referral = await Referral.findOne({ candidateEmail: normalizedEmail });
    if (referral) {
      return { duplicate: true, duplicateReason: 'REFERRAL_EMAIL_MATCH', existingReferralId: referral._id };
    }
  }

  if (normalizedPhone) {
    const referral = await Referral.findOne({ candidatePhone: normalizedPhone });
    if (referral) {
      return { duplicate: true, duplicateReason: 'REFERRAL_PHONE_MATCH', existingReferralId: referral._id };
    }
  }

  if (textHash) {
    const existingLog = await ResumeParseLog.findOne({ textHash });
    if (existingLog) {
      return { duplicate: true, duplicateReason: 'TEXT_HASH_MATCH', existingParseId: existingLog._id };
    }
  }

  return { duplicate: false };
};

const logParseEvent = async (logData) => {
  const record = new ResumeParseLog(logData);
  return record.save();
};

const parseResume = async ({ file, user }) => {
  const validationErrors = validateResumeFile(file);
  if (validationErrors.length) {
    throw new ApiError(400, 'Invalid resume upload', validationErrors);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const sourceType = ext === '.pdf' ? 'PDF' : 'DOCX';
  const filePath = file.path;

  let extractedText = '';
  let grokResponse = null;
  let parsedData = null;
  let duplicateResult = { duplicate: false };
  let parseErrors = [];
  let parseWarnings = [];

  try {
    extractedText = await extractResumeText(filePath, ext);
    const textHash = computeTextHash(extractedText);

    duplicateResult = await detectDuplicate({
      email: null,
      phone: null,
      textHash,
    });

    grokResponse = await grokService.parseResumeText(extractedText);
    parsedData = buildStructuredResume(grokResponse);
    parseWarnings = validateParsedData(parsedData);

    duplicateResult = await detectDuplicate({
      email: parsedData.email.value,
      phone: parsedData.phone.value,
      textHash,
    });
  } catch (error) {
    parseErrors.push(error.message || 'Resume parsing failed');
    await logParseEvent({
      user: user?.id,
      fileName: file.originalname,
      filePath,
      sourceType,
      textHash: extractedText ? computeTextHash(extractedText) : null,
      status: 'FAILED',
      parsedData: parsedData || {},
      confidence: parsedData?.confidence || {},
      duplicate: duplicateResult.duplicate,
      duplicateReason: duplicateResult.duplicateReason,
      errors: parseErrors,
      warnings: parseWarnings,
      requestPayload: { textLength: extractedText.length, sourceType },
      responsePayload: grokResponse,
    });

    throw error;
  }

  const logEntry = await logParseEvent({
    user: user?.id,
    fileName: file.originalname,
    filePath,
    sourceType,
    textHash: computeTextHash(extractedText),
    status: 'SUCCESS',
    parsedData,
    confidence: parsedData.confidence,
    duplicate: duplicateResult.duplicate,
    duplicateReason: duplicateResult.duplicateReason,
    errors: parseErrors,
    warnings: parseWarnings,
    requestPayload: { sourceType, textLength: extractedText.length },
    responsePayload: grokResponse,
  });

  await AuditLog.createAuditLog({
    action: 'PARSE',
    resourceType: 'ResumeParse',
    resourceId: logEntry._id,
    performedBy: user?.name || user?.email || 'System',
    performedById: user?.id,
    details: {
      fileName: file.originalname,
      sourceType,
      duplicate: duplicateResult.duplicate,
      duplicateReason: duplicateResult.duplicateReason,
    },
  });

  return {
    parsedData,
    confidence: parsedData.confidence,
    validation: {
      warnings: parseWarnings,
    },
    duplicate: duplicateResult,
  };
};

module.exports = {
  parseResume,
};

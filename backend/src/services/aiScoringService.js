const grokService = require('../ai/grokService');
const ApiError = require('../utils/apiError');

const sanitizeJsonResponse = (rawContent) => {
  if (!rawContent || typeof rawContent !== 'string') {
    return null;
  }

  // Remove markdown code blocks
  let cleaned = rawContent.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/, '');
  cleaned = cleaned.replace(/\s*```$/, '');
  cleaned = cleaned.trim();

  // Remove leading/trailing non-JSON characters
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  return cleaned;
};

const parseJsonSafely = (content) => {
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('JSON parse error:', e.message);
    console.error('Failed content:', content);
    return null;
  }
};

const scoreCandidate = async (resumeText, candidateSkills = []) => {
  if (!resumeText || !resumeText.trim()) {
    throw new ApiError(400, 'Resume text is required for AI scoring');
  }

  try {
    const scoringPrompt = `You are an enterprise candidate evaluation AI system.

Analyze the following resume and provide a comprehensive evaluation for an internship position.

Resume Text:
${resumeText.substring(0, 3000)}

Candidate Skills Listed: ${candidateSkills.join(', ') || 'None provided'}

CRITICAL: Return ONLY valid JSON. No explanations. No markdown. No code blocks. Just raw JSON.

Required JSON structure:
{
  "score": 85,
  "recommendation": "STRONG_FIT",
  "summary": "Brief 2-3 sentence summary of candidate profile",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "skillsExtracted": ["skill1", "skill2", "skill3"],
  "keyHighlights": ["highlight 1", "highlight 2"]
}

Rules:
- score: 0-100 integer representing overall candidate quality
- recommendation: MUST BE one of: STRONG_FIT, GOOD_FIT, MODERATE_FIT, WEAK_FIT, NOT_RECOMMENDED
  - STRONG_FIT: 80-100, excellent candidate
  - GOOD_FIT: 65-79, solid candidate
  - MODERATE_FIT: 50-64, acceptable with reservations
  - WEAK_FIT: 35-49, borderline candidate
  - NOT_RECOMMENDED: 0-34, insufficient qualifications
- summary: 2-3 sentences summarizing candidate profile
- strengths: array of 3-5 key strengths
- weaknesses: array of 1-3 areas for improvement
- skillsExtracted: array of technical/professional skills found
- keyHighlights: array of 2-3 notable achievements

Return ONLY the JSON object. Start with { and end with }.`;

    console.log('[AI Scoring] Calling Groq API...');
    const rawResult = await grokService.parseResumeText(scoringPrompt);

    console.log('[AI Scoring] Raw AI response received');
    console.log('[AI Scoring] Response type:', typeof rawResult);

    let parsedResult = rawResult;

    // If result is a string, it needs parsing
    if (typeof rawResult === 'string') {
      console.log('[AI Scoring] Response is string, sanitizing...');
      const sanitized = sanitizeJsonResponse(rawResult);
      console.log('[AI Scoring] Sanitized response:', sanitized?.substring(0, 200));

      parsedResult = parseJsonSafely(sanitized);

      if (!parsedResult) {
        console.error('[AI Scoring] Failed to parse JSON response');
        throw new Error('AI returned invalid JSON format');
      }
    }

    console.log('[AI Scoring] Parsed result:', JSON.stringify(parsedResult, null, 2));

    // Normalize and validate the response
    const normalized = {
      score: typeof parsedResult.score === 'number'
        ? Math.min(100, Math.max(0, Math.round(parsedResult.score)))
        : 50,
      recommendation: ['STRONG_FIT', 'GOOD_FIT', 'MODERATE_FIT', 'WEAK_FIT', 'NOT_RECOMMENDED'].includes(parsedResult.recommendation)
        ? parsedResult.recommendation
        : 'MODERATE_FIT',
      summary: typeof parsedResult.summary === 'string' && parsedResult.summary.trim()
        ? parsedResult.summary.trim()
        : 'Candidate evaluation completed',
      strengths: Array.isArray(parsedResult.strengths)
        ? parsedResult.strengths.filter(s => typeof s === 'string' && s.trim()).slice(0, 5)
        : ['Technical skills present'],
      weaknesses: Array.isArray(parsedResult.weaknesses)
        ? parsedResult.weaknesses.filter(w => typeof w === 'string' && w.trim()).slice(0, 3)
        : ['Further evaluation needed'],
      skillsExtracted: Array.isArray(parsedResult.skillsExtracted)
        ? parsedResult.skillsExtracted.filter(s => typeof s === 'string' && s.trim()).slice(0, 20)
        : candidateSkills,
      keyHighlights: Array.isArray(parsedResult.keyHighlights)
        ? parsedResult.keyHighlights.filter(h => typeof h === 'string' && h.trim()).slice(0, 3)
        : [],
    };

    console.log('[AI Scoring] Normalized result:', JSON.stringify(normalized, null, 2));

    return normalized;
  } catch (error) {
    console.error('[AI Scoring] Error:', error.message || error);
    console.error('[AI Scoring] Error stack:', error.stack);
    throw new ApiError(502, `AI scoring failed: ${error.message || 'Unknown error'}`);
  }
};

module.exports = {
  scoreCandidate,
};

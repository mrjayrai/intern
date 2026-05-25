const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const certificateFolder = path.join(__dirname, '..', 'uploads', 'certificates');

const ensureCertificateFolder = () => {
  if (!fs.existsSync(certificateFolder)) {
    fs.mkdirSync(certificateFolder, { recursive: true });
  }
};

const formatDate = (date) => {
  const value = new Date(date);
  return value.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const createCertificatePdf = async ({ candidate, mentor, internshipDuration, completionDate, issuedByName, verificationId, department, role }) => {
  ensureCertificateFolder();

  const filename = `${verificationId}-${Date.now()}.pdf`;
  const filePath = path.join(certificateFolder, filename);
  const relativePdfPath = path.join('uploads', 'certificates', filename);

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });

    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const centerX = pageWidth / 2;

    // Decorative border
    doc.lineWidth(8);
    doc.strokeColor('#1e3a5f');
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60).stroke();

    doc.lineWidth(2);
    doc.strokeColor('#3b82f6');
    doc.rect(40, 40, pageWidth - 80, pageHeight - 80).stroke();

    // Company branding header
    doc.fontSize(32).font('Times-Bold').fillColor('#1e3a5f');
    doc.text('Intern Flow', centerX - 100, 80, { width: 200, align: 'center' });

    doc.fontSize(10).font('Times-Roman').fillColor('#64748b');
    doc.text('Enterprise Internship Management Platform', centerX - 150, 118, { width: 300, align: 'center' });

    // Decorative line
    doc.moveTo(centerX - 200, 145).lineTo(centerX + 200, 145).lineWidth(1).strokeColor('#cbd5e1').stroke();

    // Main title
    doc.fontSize(40).font('Times-Bold').fillColor('#1e3a5f');
    doc.text('Certificate of Completion', centerX - 300, 170, { width: 600, align: 'center' });

    // Subtitle
    doc.fontSize(14).font('Times-Roman').fillColor('#475569');
    doc.text('This certificate is proudly presented to', centerX - 200, 230, { width: 400, align: 'center' });

    // Candidate name - featured prominently
    doc.fontSize(36).font('Times-Bold').fillColor('#0f172a');
    doc.text(candidate, centerX - 300, 265, { width: 600, align: 'center' });

    // Decorative underline
    doc.moveTo(centerX - 150, 310).lineTo(centerX + 150, 310).lineWidth(2).strokeColor('#3b82f6').stroke();

    // Achievement text
    doc.fontSize(13).font('Times-Roman').fillColor('#475569');
    doc.text('for successfully completing an internship program', centerX - 250, 335, { width: 500, align: 'center' });

    // Details box
    const detailsY = 370;
    doc.fontSize(12).font('Times-Roman').fillColor('#0f172a');

    if (role) {
      doc.text(`Role: `, centerX - 180, detailsY, { continued: true });
      doc.font('Times-Bold').text(role);
    }

    if (department) {
      doc.font('Times-Roman').text(`Department: `, centerX - 180, detailsY + 20, { continued: true });
      doc.font('Times-Bold').text(department);
    }

    doc.font('Times-Roman').text('Under the mentorship of ', centerX - 180, detailsY + 40, { continued: true });
    doc.font('Times-Bold').text(mentor);

    doc.font('Times-Roman').text('Duration: ', centerX - 180, detailsY + 60, { continued: true });
    doc.font('Times-Bold').text(internshipDuration);

    doc.font('Times-Roman').text('Completion Date: ', centerX - 180, detailsY + 80, { continued: true });
    doc.font('Times-Bold').text(formatDate(completionDate));

    // Signature section
    const signatureY = pageHeight - 160;

    // Left signature
    doc.moveTo(120, signatureY).lineTo(280, signatureY).lineWidth(1).strokeColor('#cbd5e1').stroke();
    doc.fontSize(11).font('Times-Bold').fillColor('#0f172a');
    doc.text(issuedByName || 'HR Manager', 120, signatureY + 10, { width: 160, align: 'center' });
    doc.fontSize(9).font('Times-Roman').fillColor('#64748b');
    doc.text('Human Resources', 120, signatureY + 28, { width: 160, align: 'center' });

    // Right signature
    doc.moveTo(pageWidth - 280, signatureY).lineTo(pageWidth - 120, signatureY).lineWidth(1).strokeColor('#cbd5e1').stroke();
    doc.fontSize(11).font('Times-Bold').fillColor('#0f172a');
    doc.text('Authorized Signatory', pageWidth - 280, signatureY + 10, { width: 160, align: 'center' });
    doc.fontSize(9).font('Times-Roman').fillColor('#64748b');
    doc.text('Intern Flow Platform', pageWidth - 280, signatureY + 28, { width: 160, align: 'center' });

    // Issue date and verification
    doc.fontSize(9).font('Times-Roman').fillColor('#64748b');
    doc.text(`Issued on ${formatDate(new Date())}`, centerX - 150, pageHeight - 75, { width: 300, align: 'center' });

    doc.fontSize(8).fillColor('#94a3b8');
    doc.text(`Verification ID: ${verificationId}`, centerX - 200, pageHeight - 55, { width: 400, align: 'center' });
    doc.text('Verify at www.internflow.io/verify', centerX - 200, pageHeight - 40, { width: 400, align: 'center' });

    doc.end();

    stream.on('finish', () => {
      resolve(relativePdfPath.replace(/\\/g, '/'));
    });
    stream.on('error', reject);
  });
};

const createOfferLetterPdf = async ({
  candidateName,
  candidateEmail,
  role,
  department,
  mentor,
  mentorEmail,
  duration,
  joiningDate,
  stipend,
  location,
  referenceId,
  issuedByName,
}) => {
  ensureCertificateFolder();

  const filename = `offer-letter-${referenceId}-${Date.now()}.pdf`;
  const filePath = path.join(certificateFolder, filename);
  const relativePdfPath = path.join('uploads', 'certificates', filename);

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    const doc = new PDFDocument({ size: 'A4', margin: 60 });

    doc.pipe(stream);

    // Header - Company Branding
    doc.fontSize(24).font('Times-Bold').text('Intern Flow', { align: 'center' });
    doc.fontSize(10).font('Times-Roman').text('Enterprise Internship Management Platform', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(8).text('www.internflow.io | support@internflow.io', { align: 'center', color: '#666666' });
    doc.moveDown(2);

    // Reference ID and Date
    doc.fontSize(9).text(`Reference ID: ${referenceId}`, { align: 'right' });
    doc.text(`Date: ${formatDate(new Date())}`, { align: 'right' });
    doc.moveDown(2);

    // Title
    doc.fontSize(18).font('Times-Bold').fillColor('#1e3a5f').text('Internship Offer Letter', { align: 'center' });
    doc.fillColor('#000000');
    doc.moveDown(2);

    // Salutation
    doc.fontSize(12).font('Times-Roman').text(`Dear ${candidateName},`, { align: 'left' });
    doc.moveDown(1);

    // Body paragraphs
    doc.fontSize(11).text(
      `We are pleased to offer you an internship position with Intern Flow. After reviewing your qualifications and experience, we believe you would be a valuable addition to our team.`,
      { align: 'justify', lineGap: 4 }
    );
    doc.moveDown(1);

    doc.text(
      `The details of your internship offer are as follows:`,
      { align: 'justify', lineGap: 4 }
    );
    doc.moveDown(1.5);

    // Offer details box
    const detailsX = 80;
    const detailsY = doc.y;
    doc.rect(detailsX - 10, detailsY - 10, doc.page.width - 140, 180).stroke('#cccccc');

    doc.fontSize(10).font('Times-Bold');
    doc.text('Position:', detailsX, detailsY);
    doc.font('Times-Roman').text(role || 'Intern', detailsX + 120, detailsY);
    doc.moveDown(0.7);

    doc.font('Times-Bold').text('Department:', detailsX);
    doc.font('Times-Roman').text(department || 'General', detailsX + 120, doc.y - 12);
    doc.moveDown(0.7);

    doc.font('Times-Bold').text('Mentor:', detailsX);
    doc.font('Times-Roman').text(mentor || 'TBD', detailsX + 120, doc.y - 12);
    doc.moveDown(0.7);

    doc.font('Times-Bold').text('Duration:', detailsX);
    doc.font('Times-Roman').text(duration || 'TBD', detailsX + 120, doc.y - 12);
    doc.moveDown(0.7);

    doc.font('Times-Bold').text('Joining Date:', detailsX);
    doc.font('Times-Roman').text(joiningDate ? formatDate(joiningDate) : 'TBD', detailsX + 120, doc.y - 12);
    doc.moveDown(0.7);

    if (stipend) {
      doc.font('Times-Bold').text('Stipend:', detailsX);
      doc.font('Times-Roman').text(stipend, detailsX + 120, doc.y - 12);
      doc.moveDown(0.7);
    }

    doc.font('Times-Bold').text('Location:', detailsX);
    doc.font('Times-Roman').text(location || 'Remote', detailsX + 120, doc.y - 12);
    doc.moveDown(2);

    // Additional paragraphs
    doc.fontSize(11).font('Times-Roman').text(
      `Your mentor, ${mentor || 'who will be assigned shortly'}, will guide you throughout your internship. You will receive further onboarding instructions via email.`,
      { align: 'justify', lineGap: 4 }
    );
    doc.moveDown(1);

    doc.text(
      `Please complete all required onboarding documentation through the Intern Flow portal before your joining date. If you have any questions, please contact our HR team at support@internflow.io.`,
      { align: 'justify', lineGap: 4 }
    );
    doc.moveDown(1.5);

    doc.text(
      `We look forward to welcoming you to our team!`,
      { align: 'justify', lineGap: 4 }
    );
    doc.moveDown(2);

    // Signature block
    doc.fontSize(11).font('Times-Roman').text('Sincerely,');
    doc.moveDown(0.5);
    doc.fontSize(12).font('Times-Bold').text(issuedByName || 'Intern Flow HR Team');
    doc.fontSize(10).font('Times-Roman').text('Human Resources Department');
    doc.text('Intern Flow Platform');
    doc.moveDown(3);

    // Footer
    doc.fontSize(8).fillColor('#666666').text(
      'This is an official offer letter generated by Intern Flow. Please retain this document for your records.',
      { align: 'center' }
    );
    doc.text(`Generated on ${formatDate(new Date())} | Reference: ${referenceId}`, { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      resolve(relativePdfPath.replace(/\\/g, '/'));
    });
    stream.on('error', reject);
  });
};

module.exports = {
  createCertificatePdf,
  createOfferLetterPdf,
};

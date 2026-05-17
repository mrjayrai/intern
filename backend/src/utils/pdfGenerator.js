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

const createCertificatePdf = async ({ candidate, mentor, internshipDuration, completionDate, issuedByName, verificationId }) => {
  ensureCertificateFolder();

  const filename = `${verificationId}-${Date.now()}.pdf`;
  const filePath = path.join(certificateFolder, filename);
  const relativePdfPath = path.join('uploads', 'certificates', filename);

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    doc.pipe(stream);

    doc.fontSize(26).text('Certificate of Completion', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(14).text('This certificate is proudly presented to', { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(28).font('Times-Bold').text(candidate, { align: 'center' });
    doc.font('Times-Roman');
    doc.moveDown(1);

    doc.fontSize(14).text('for successfully completing an internship under the mentorship of', { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(18).font('Times-Bold').text(mentor, { align: 'center' });
    doc.font('Times-Roman');
    doc.moveDown(1.5);

    doc.fontSize(12).text(`Internship Duration: ${internshipDuration}`, { align: 'center' });
    doc.moveDown(0.25);
    doc.text(`Completion Date: ${formatDate(completionDate)}`, { align: 'center' });
    doc.moveDown(0.25);
    doc.text(`Verified By: ${issuedByName}`, { align: 'center' });
    doc.moveDown(1);
    doc.text(`Verification ID: ${verificationId}`, { align: 'center' });

    doc.moveDown(2);
    doc.fontSize(10).text('This certificate is generated and stored securely by Intern Flow.', { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      resolve(relativePdfPath.replace(/\\/g, '/'));
    });
    stream.on('error', reject);
  });
};

module.exports = {
  createCertificatePdf,
};

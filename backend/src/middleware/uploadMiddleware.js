const multer = require('multer');
const path = require('path');
const fs = require('fs');

const resumeFolder = path.join(__dirname, '..', 'uploads', 'resumes');
const ndaFolder = path.join(__dirname, '..', 'uploads', 'ndas');
if (!fs.existsSync(resumeFolder)) fs.mkdirSync(resumeFolder, { recursive: true });
if (!fs.existsSync(ndaFolder)) fs.mkdirSync(ndaFolder, { recursive: true });

const storageResume = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, resumeFolder);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const storageNda = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, ndaFolder);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const resumeFileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedTypes.includes(ext)) return cb(new Error('Only PDF and DOCX files are allowed'));
  cb(null, true);
};

const ndaFileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedTypes.includes(ext)) return cb(new Error('Only PDF files are allowed for NDAs'));
  cb(null, true);
};

const uploadResume = multer({ storage: storageResume, fileFilter: resumeFileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadNda = multer({ storage: storageNda, fileFilter: ndaFileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = {
  uploadResume: uploadResume.single('resume'),
  uploadNda: uploadNda.single('nda'),
};

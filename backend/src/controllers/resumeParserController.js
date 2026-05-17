const asyncHandler = require('../utils/asyncHandler');
const resumeParserService = require('../services/resumeParserService');
const ApiError = require('../utils/apiError');

exports.parseResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Resume file is required');
  }

  const result = await resumeParserService.parseResume({ file: req.file, user: req.user });
  res.status(200).json({ success: true, data: result });
});

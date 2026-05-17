const Referral = require('../models/Referral');

exports.createReferral = async (data) => {
  const referral = new Referral(data);
  return referral.save();
};

exports.getAllReferrals = async () => {
  return Referral.find().sort({ createdAt: -1 });
};

exports.getReferralById = async (id) => {
  return Referral.findById(id);
};

exports.updateReferral = async (id, data) => {
  return Referral.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

exports.deleteReferral = async (id) => {
  return Referral.findByIdAndDelete(id);
};

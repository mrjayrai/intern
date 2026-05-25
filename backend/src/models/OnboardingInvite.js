const mongoose = require('mongoose');

const onboardingInviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    referralId: {
      type: mongoose.Types.ObjectId,
      ref: 'Referral',
      required: true,
      index: true,
    },
    onboardingId: {
      type: mongoose.Types.ObjectId,
      ref: 'JoiningForm',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      default: 'CANDIDATE',
      enum: ['CANDIDATE', 'EMPLOYEE'],
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    accepted: {
      type: Boolean,
      default: false,
      index: true,
    },
    acceptedAt: {
      type: Date,
    },
    acceptedBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for token lookups
onboardingInviteSchema.index({ token: 1, accepted: 1 });

// Index for email lookups to prevent duplicates
onboardingInviteSchema.index({ email: 1, accepted: 1 });

// Automatically expire invites
onboardingInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance method to check if invite is valid
onboardingInviteSchema.methods.isValid = function () {
  return !this.accepted && new Date() < this.expiresAt;
};

// Instance method to mark as accepted
onboardingInviteSchema.methods.markAccepted = async function (userId) {
  this.accepted = true;
  this.acceptedAt = new Date();
  this.acceptedBy = userId;
  return this.save();
};

module.exports = mongoose.model('OnboardingInvite', onboardingInviteSchema);

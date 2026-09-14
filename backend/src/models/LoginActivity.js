const mongoose = require('mongoose');

const loginActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true
    },
    event: {
      type: String,
      required: true,
      index: true
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    },
    device: {
      type: String,
      default: 'Desktop'
    },
    browser: {
      type: String,
      default: 'Unknown'
    },
    operatingSystem: {
      type: String,
      default: 'Unknown'
    },
    location: {
      type: String,
      default: 'Local'
    },
    success: {
      type: Boolean,
      default: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

loginActivitySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('LoginActivity', loginActivitySchema);

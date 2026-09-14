const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: 120
    },
    slug: {
      type: String,
      required: [true, 'Organization slug is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    logo: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    settings: {
      allowMemberInvites: {
        type: Boolean,
        default: true
      },
      requireManagerApproval: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);

organizationSchema.index({ ownerId: 1 });

module.exports = mongoose.model('Organization', organizationSchema);

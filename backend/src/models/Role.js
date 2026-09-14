const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    permissions: [
      {
        type: String,
        trim: true
      }
    ],
    scope: {
      type: String,
      enum: ['organization', 'department', 'personal'],
      default: 'organization'
    },
    isSystemRole: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: role name is unique per organization
roleSchema.index({ organizationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Role', roleSchema);

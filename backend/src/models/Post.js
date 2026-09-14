const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: [true, 'Post content/description is required'],
      trim: true
    },
    visibility: {
      type: String,
      enum: ['organization', 'department', 'personal'],
      default: 'organization',
      index: true
    }
  },
  {
    timestamps: true
  }
);

postSchema.index({ organizationId: 1, visibility: 1 });
postSchema.index({ organizationId: 1, departmentId: 1 });
postSchema.index({ organizationId: 1, authorId: 1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);

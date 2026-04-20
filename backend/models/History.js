const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
    },
  },
  { timestamps: true }
);

// A user has one history record per video, we just update the timestamp when watched again
historySchema.index({ user: 1, video: 1 }, { unique: true });

module.exports = mongoose.model('History', historySchema);

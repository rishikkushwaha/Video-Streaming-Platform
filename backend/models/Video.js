const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    filename: {
      type: String,
      required: true,
    },
    thumbnailFilename: {
      type: String,
      default: '',
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    category: {
      type: String,
      default: 'Uncategorized',
      enum: [
        'Uncategorized',
        'Music',
        'Gaming',
        'Education',
        'Entertainment',
        'Sports',
        'News',
        'Technology',
        'Travel',
        'Comedy',
        'Car',
        'Adventure',
        'Superhero',
        'Nature',
        'Urban',
        'Cosmic',
        'Forest',
      ],
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Video', videoSchema);

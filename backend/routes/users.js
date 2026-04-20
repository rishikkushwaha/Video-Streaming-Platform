const express = require('express');
const User = require('../models/User');
const Video = require('../models/Video');
const Subscription = require('../models/Subscription');
const Bookmark = require('../models/Bookmark');
const History = require('../models/History');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:id/channel - Get channel profile and videos
router.get('/:id/channel', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email -verificationCode -verificationExpires');
    if (!user) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const subscriberCount = await Subscription.countDocuments({ channel: req.params.id });
    const videos = await Video.find({ uploader: req.params.id }).sort({ createdAt: -1 });

    res.json({
      channel: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        subscriberCount,
      },
      videos,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/users/:id/subscribe - Toggle subscription
router.post('/:id/subscribe', auth, async (req, res) => {
  try {
    const channelId = req.params.id;
    const subscriberId = req.user.id;

    if (channelId === subscriberId) {
      return res.status(400).json({ message: 'You cannot subscribe to yourself' });
    }

    const existingSub = await Subscription.findOne({ subscriber: subscriberId, channel: channelId });

    if (existingSub) {
      // Unsubscribe
      await Subscription.findByIdAndDelete(existingSub._id);
      return res.json({ subscribed: false, message: 'Unsubscribed successfully' });
    } else {
      // Subscribe
      const newSub = new Subscription({ subscriber: subscriberId, channel: channelId });
      await newSub.save();
      return res.status(201).json({ subscribed: true, message: 'Subscribed successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/users/:id/is-subscribed - Check if logged in user is subscribed
router.get('/:id/is-subscribed', auth, async (req, res) => {
  try {
    const sub = await Subscription.findOne({ subscriber: req.user.id, channel: req.params.id });
    res.json({ subscribed: !!sub });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/users/watch-later - Get all bookmarked videos
router.get('/watch-later/all', auth, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.id })
      .populate({
        path: 'video',
        populate: { path: 'uploader', select: 'username avatar' }
      })
      .sort({ createdAt: -1 });
    
    // Extract just the videos from the bookmarks
    const videos = bookmarks.map(b => b.video).filter(v => v !== null);
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/users/watch-later/:videoId - Toggle Watch Later
router.post('/watch-later/:videoId', auth, async (req, res) => {
  try {
    const existingBookmark = await Bookmark.findOne({ user: req.user.id, video: req.params.videoId });

    if (existingBookmark) {
      await Bookmark.findByIdAndDelete(existingBookmark._id);
      return res.json({ bookmarked: false, message: 'Removed from Watch Later' });
    } else {
      const newBookmark = new Bookmark({ user: req.user.id, video: req.params.videoId });
      await newBookmark.save();
      return res.status(201).json({ bookmarked: true, message: 'Added to Watch Later' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/users/watch-later/:videoId/check - Check if bookmarked
router.get('/watch-later/:videoId/check', auth, async (req, res) => {
  try {
    const bookmark = await Bookmark.findOne({ user: req.user.id, video: req.params.videoId });
    res.json({ bookmarked: !!bookmark });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/users/history - Get watch history
router.get('/history', auth, async (req, res) => {
  try {
    const history = await History.find({ user: req.user.id })
      .populate({
        path: 'video',
        populate: { path: 'uploader', select: 'username avatar' }
      })
      .sort({ updatedAt: -1 })
      .limit(50);
    
    const videos = history.map(h => h.video).filter(v => v !== null);
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/users/history/:videoId - Add to history
router.post('/history/:videoId', auth, async (req, res) => {
  try {
    const existing = await History.findOne({ user: req.user.id, video: req.params.videoId });
    if (existing) {
      existing.updatedAt = new Date();
      await existing.save();
    } else {
      const newHistory = new History({ user: req.user.id, video: req.params.videoId });
      await newHistory.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

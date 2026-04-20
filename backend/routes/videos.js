const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directories exist
const videoDir = path.join(__dirname, '..', 'uploads', 'videos');
const thumbDir = path.join(__dirname, '..', 'uploads', 'thumbnails');
fs.mkdirSync(videoDir, { recursive: true });
fs.mkdirSync(thumbDir, { recursive: true });

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'video') {
      cb(null, videoDir);
    } else if (file.fieldname === 'thumbnail') {
      cb(null, thumbDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      const videoTypes = /mp4|mkv|avi|mov|webm/;
      const ext = videoTypes.test(path.extname(file.originalname).toLowerCase());
      if (ext) return cb(null, true);
      cb(new Error('Only video files are allowed'));
    } else if (file.fieldname === 'thumbnail') {
      const imageTypes = /jpeg|jpg|png|webp|gif/;
      const ext = imageTypes.test(path.extname(file.originalname).toLowerCase());
      if (ext) return cb(null, true);
      cb(new Error('Only image files are allowed for thumbnails'));
    }
  },
});

// POST /api/videos/upload - Upload a new video
router.post(
  '/upload',
  auth,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!req.files || !req.files.video) {
        return res.status(400).json({ message: 'Video file is required' });
      }

      const { title, description, category } = req.body;
      const videoFile = req.files.video[0];
      const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

      const video = new Video({
        title,
        description,
        filename: videoFile.filename,
        thumbnailFilename: thumbnailFile ? thumbnailFile.filename : '',
        uploader: req.user.id,
        category: category || 'Uncategorized',
      });

      await video.save();
      await video.populate('uploader', 'username avatar');

      res.status(201).json(video);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// GET /api/videos - Get all videos
router.get('/', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'views') sortOption = { views: -1 };
    if (sort === 'likes') sortOption = { likes: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    const videos = await Video.find(query)
      .populate('uploader', 'username avatar')
      .sort(sortOption);

    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/videos/:id - Get single video
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate('uploader', 'username avatar');
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/videos/:id/view - Increment view count
router.put('/:id/view', async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/videos/:id/like - Increment like count
router.put('/:id/like', auth, async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/videos/:id/comments - Get comments for a video
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ video: req.params.id })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/videos/:id/comments - Add a comment to a video
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const comment = new Comment({
      text,
      user: req.user.id,
      video: req.params.id,
    });

    await comment.save();
    await comment.populate('user', 'username avatar');

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/videos/:id - Delete a video
router.delete('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Only the uploader can delete
    if (video.uploader.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this video' });
    }

    // Delete files
    const videoPath = path.join(videoDir, video.filename);
    const thumbPath = path.join(thumbDir, video.thumbnailFilename);
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    if (video.thumbnailFilename && fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);

    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/videos/:id - Update video metadata
router.put('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (video.uploader.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this video' });
    }

    const { title, description, category } = req.body;
    
    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    if (category) video.category = category;

    await video.save();
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/videos/stream/:filename - Stream video with partial content
router.get('/stream/:filename', (req, res) => {
  const filePath = path.join(videoDir, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Video file not found' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;

    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// GET /api/videos/user/:userId - Get videos by user
router.get('/user/:userId', async (req, res) => {
  try {
    const videos = await Video.find({ uploader: req.params.userId })
      .populate('uploader', 'username avatar')
      .sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

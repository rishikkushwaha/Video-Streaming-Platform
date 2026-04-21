const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

const router = express.Router();

// Comment Interaction Routes (Placed at top to avoid :id collisions)

// PUT /api/videos/comments/:commentId - Edit a comment
router.put('/comments/:commentId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    comment.text = text;
    await comment.save();
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/videos/comments/:commentId - Delete a comment
router.delete('/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Comment.deleteMany({ parentComment: req.params.commentId });
    await Comment.findByIdAndDelete(req.params.commentId);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/videos/comments/:commentId/reply - Reply to a comment
router.post('/comments/:commentId/reply', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const parentComment = await Comment.findById(req.params.commentId);
    if (!parentComment) return res.status(404).json({ message: 'Parent not found' });
    const reply = new Comment({ text, user: req.user.id, video: parentComment.video, parentComment: parentComment._id });
    await reply.save();
    res.status(201).json(await reply.populate('user', 'username avatar'));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/videos/comments/:commentId/like - Like a comment
router.put('/comments/:commentId/like', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    const isLiked = comment.likedBy.some(id => id.toString() === req.user.id);
    const update = isLiked ? { $pull: { likedBy: req.user.id }, $inc: { likes: -1 } } : { $addToSet: { likedBy: req.user.id }, $inc: { likes: 1 } };
    const updated = await Comment.findByIdAndUpdate(req.params.commentId, update, { new: true });
    res.json({ likes: updated.likes, isLiked: !isLiked });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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

// PUT /api/videos/:id/like - Toggle like count
router.put('/:id/like', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const userId = req.user.id;
    const isLiked = video.likedBy.some(id => id.toString() === userId);

    if (isLiked) {
      // Atomic pull to remove like
      await Video.findByIdAndUpdate(req.params.id, {
        $pull: { likedBy: userId },
        $inc: { likes: -1 }
      });
      res.json({ likes: Math.max(0, video.likes - 1), isLiked: false });
    } else {
      // Atomic addToSet to add like once
      await Video.findByIdAndUpdate(req.params.id, {
        $addToSet: { likedBy: userId },
        $inc: { likes: 1 }
      });
      res.json({ likes: video.likes + 1, isLiked: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/videos/:id/like-status - Check if user liked the video
router.get('/:id/like-status', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    
    const isLiked = video.likedBy.some(id => id.toString() === req.user.id);
    res.json({ isLiked });
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
    
    const populatedComment = await comment.populate('user', 'username avatar');
    res.status(201).json(populatedComment);
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

    if (start >= fileSize) {
      res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
      return;
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const ext = path.extname(req.params.filename).toLowerCase();
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
    };
    const contentType = mimeTypes[ext] || 'video/mp4';

    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    };

    res.writeHead(206, head);
    file.pipe(res);
    
    file.on('error', (err) => {
      console.error('Stream error:', err);
      res.end();
    });
  } else {
    const ext = path.extname(req.params.filename).toLowerCase();
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
    };
    const contentType = mimeTypes[ext] || 'video/mp4';

    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
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

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const User = require('./models/User');
const Video = require('./models/Video');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/streamflix';

// Ensure directories exist
const videoDir = path.join(__dirname, 'uploads', 'videos');
const thumbDir = path.join(__dirname, 'uploads', 'thumbnails');
fs.mkdirSync(videoDir, { recursive: true });
fs.mkdirSync(thumbDir, { recursive: true });

// Helper to download files
const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected');

    console.log('Clearing old data...');
    await User.deleteMany({});
    await Video.deleteMany({});

    console.log('Creating Test User...');
    const testUser = new User({
      username: 'StreamFlixAdmin',
      email: 'admin@streamflix.com',
      password: 'password123', // Will be hashed automatically
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
    });
    await testUser.save();
    console.log('✅ Test User created');

    console.log('Downloading Sample Videos & Thumbnails...');
    
    const sampleData = [
      {
        title: 'Big Buck Bunny (Sample)',
        desc: 'This is a sample video uploaded automatically by the seed script to verify that video playback and uploads are working correctly.',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        thumbUrl: 'https://picsum.photos/id/237/800/450',
        cat: 'Entertainment'
      },
      {
        title: 'Beautiful Nature Waterfall',
        desc: 'A calming waterfall in the middle of a lush green forest.',
        videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        thumbUrl: 'https://picsum.photos/id/1015/800/450',
        cat: 'Travel'
      },
      {
        title: 'Abstract Digital Art',
        desc: 'Satisfying abstract digital motion graphics.',
        videoUrl: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
        thumbUrl: 'https://picsum.photos/id/1025/800/450',
        cat: 'Technology'
      },
      {
        title: 'Ocean Waves',
        desc: 'Relaxing sounds and visuals of ocean waves hitting the beach at sunset.',
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        thumbUrl: 'https://picsum.photos/id/1050/800/450',
        cat: 'Travel'
      },
      {
        title: 'City Traffic Timelapse',
        desc: 'Fast-paced city life and traffic captured in a beautiful timelapse.',
        videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
        thumbUrl: 'https://picsum.photos/id/1069/800/450',
        cat: 'News'
      }
    ];

    for (let i = 0; i < sampleData.length; i++) {
      const data = sampleData[i];
      const videoFilename = `sample_video_${Date.now()}_${i}.mp4`;
      const thumbFilename = `sample_thumb_${Date.now()}_${i}.jpg`;

      console.log(`Downloading video ${i+1}/${sampleData.length}: ${data.title}...`);
      await downloadFile(data.videoUrl, path.join(videoDir, videoFilename));
      await downloadFile(data.thumbUrl, path.join(thumbDir, thumbFilename));

      const video = new Video({
        title: data.title,
        description: data.desc,
        filename: videoFilename,
        thumbnailFilename: thumbFilename,
        uploader: testUser._id,
        category: data.cat,
        views: Math.floor(Math.random() * 500) + 10,
        likes: Math.floor(Math.random() * 100) + 1
      });
      await video.save();
    }
    console.log('✅ All sample videos downloaded and inserted into database');

    console.log('🎉 Seeding Complete! You can now start your frontend and backend.');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedDatabase();

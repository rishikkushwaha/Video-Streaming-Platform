const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
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
const downloadFile = async (url, dest) => {
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const writer = fs.createWriteStream(dest);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (err) {
    console.error(`Failed to download ${url}:`, err.message);
  }
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
        title: 'Project Sentinel: The Superhero Awakening',
        desc: 'A cinematic look at a young hero discovering their destiny. In a world on the brink, one symbol rises to inspire the masses.',
        videoUrl: 'https://videos.pexels.com/video-files/9427863/9427863-uhd_1440_2560_24fps.mp4',
        thumbUrl: 'https://images.pexels.com/photos/804475/pexels-photo-804475.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        cat: 'Superhero'
      },
      {
        title: 'Serene Rhythms: Autumn Nature',
        desc: 'Explore the peaceful beauty of autumn wild grass swaying in the breeze. A cinematic study of nature\'s serene movements.',
        videoUrl: 'https://videos.pexels.com/video-files/35508463/15043219_2560_1440_60fps.mp4',
        thumbUrl: 'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        cat: 'Nature'
      },
      {
        title: 'Vintage Soul: The Classic Yellow Drive',
        desc: 'A nostalgic journey with a classic vintage car. Witness the elegance and timeless engineering of a bygone automotive era.',
        videoUrl: 'https://videos.pexels.com/video-files/31220504/13335328_2560_1440_24fps.mp4',
        thumbUrl: 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        cat: 'Car'
      },
      {
        title: 'The Great Expedition: Alpine Trek',
        desc: 'Join a team of explorers as they navigate the challenging terrain of the snow-capped Alps. A tale of human endurance and alpine beauty.',
        videoUrl: 'https://videos.pexels.com/video-files/7010423/7010423-uhd_2560_1440_25fps.mp4',
        thumbUrl: 'https://images.pexels.com/photos/235922/pexels-photo-235922.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        cat: 'Adventure'
      },
      {
        title: 'Cosmic Genesis: The Nebula Burst',
        desc: 'A mesmerizing visual journey into the heart of a cosmic nebula. Witness the vibrant colors and explosive energy of the deep universe.',
        videoUrl: 'https://videos.pexels.com/video-files/32750117/13961486_1920_1080_30fps.mp4',
        thumbUrl: 'https://images.pexels.com/photos/2034892/pexels-photo-2034892.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        cat: 'Cosmic'
      },
      {
        title: 'Golden Hour: Whispering Forest',
        desc: 'Discover the serene beauty of an ancient forest at sunset. A macro look at the sunlight filtering through the canopy, illuminating the forest sanctuary.',
        videoUrl: 'https://videos.pexels.com/video-files/3881835/3881835-hd_1920_1080_25fps.mp4',
        thumbUrl: 'https://images.pexels.com/photos/1547813/pexels-photo-1547813.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        cat: 'Forest'
      }
    ];

    for (let i = 0; i < sampleData.length; i++) {
      const data = sampleData[i];
      const videoFilename = `sample_video_${i + 1}.mp4`;
      const thumbFilename = `sample_thumb_${i + 1}.jpg`;
      
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
        views: Math.floor(Math.random() * 10000) + 1000,
        likes: Math.floor(Math.random() * 500) + 50,
      });
      await video.save();
    }
    console.log('✅ All sample videos downloaded and inserted into database');

    console.log('🎉 Seeding Complete!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedDatabase();

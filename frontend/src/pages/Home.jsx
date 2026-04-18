import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { videosAPI } from '../api';
import VideoCard from '../components/VideoCard';
import {
  TrendingUp,
  Flame,
  Sparkles,
  Film,
  Play,
  ChevronLeft,
  ChevronRight,
  Zap,
  Globe,
  Shield,
} from 'lucide-react';
import './Home.css';

const CATEGORIES = [
  'All',
  'Music',
  'Gaming',
  'Education',
  'Entertainment',
  'Sports',
  'News',
  'Technology',
  'Travel',
  'Comedy',
];

function VideoRow({ title, icon, videos }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (scrollRef.current) {
      const amount = dir === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  if (videos.length === 0) return null;

  return (
    <div className="video-row">
      <div className="video-row-header">
        <h2 className="video-row-title">
          {icon} {title}
        </h2>
        <div className="video-row-arrows">
          <button className="row-arrow" onClick={() => scroll('left')}>
            <ChevronLeft size={18} />
          </button>
          <button className="row-arrow" onClick={() => scroll('right')}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="video-row-scroll" ref={scrollRef}>
        {videos.map((video) => (
          <div className="video-row-item" key={video._id}>
            <VideoCard video={video} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    fetchVideos();
  }, [activeCategory, searchQuery]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeCategory !== 'All') params.category = activeCategory;
      if (searchQuery) params.search = searchQuery;
      const res = await videosAPI.getAll(params);
      setVideos(res.data);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group videos by category for carousel rows
  const trendingVideos = [...videos].sort((a, b) => b.views - a.views).slice(0, 10);
  const latestVideos = [...videos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
  const topLiked = [...videos].sort((a, b) => b.likes - a.likes).slice(0, 10);

  const showCarousels = !searchQuery && activeCategory === 'All' && videos.length > 0;

  return (
    <div className="page-content">
      {/* Featured Banner */}
      {!searchQuery && (
        <section className="featured-banner" id="featured-banner">
          <div className="container">
            <div className="banner-content fade-in">
              <div className="banner-badge">
                <Sparkles size={13} />
                Premium
              </div>
              <h1 className="banner-title">
                Discover. Share. <span className="banner-gradient">Connect.</span>
              </h1>
              <p className="banner-subtitle">
                Your stage for the world's best content.
              </p>
              <div className="banner-actions">
                <Link to="/register" className="btn btn-primary" id="banner-cta">
                  <Play size={16} />
                  Explore
                </Link>
                <Link to="/upload" className="btn btn-secondary" id="banner-upload">
                  <Film size={16} />
                  Upload
                </Link>
              </div>
            </div>

            <div className="banner-stats">
              <div className="banner-stat">
                <Shield size={18} />
                <div>
                  <span className="stat-num">Ad-Free</span>
                  <span className="stat-lbl">Experience</span>
                </div>
              </div>
              <div className="banner-stat">
                <Zap size={18} />
                <div>
                  <span className="stat-num">4K Ultra</span>
                  <span className="stat-lbl">Resolution</span>
                </div>
              </div>
              <div className="banner-stat">
                <Globe size={18} />
                <div>
                  <span className="stat-num">Creator</span>
                  <span className="stat-lbl">Focused</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="container">
        {/* Search header */}
        {searchQuery && (
          <div className="search-results-header fade-in">
            <h2>Results for "<span className="text-accent">{searchQuery}</span>"</h2>
          </div>
        )}

        {/* Category Pills */}
        <div className="category-bar" id="category-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              id={`cat-${cat.toLowerCase()}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="video-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="video-card-skeleton">
                <div className="skeleton" style={{ aspectRatio: '16/9' }}></div>
                <div style={{ padding: '14px 16px', display: 'flex', gap: '12px' }}>
                  <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 14, marginBottom: 8, borderRadius: 6 }}></div>
                    <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 6 }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="empty-state fade-in">
            <div className="empty-state-icon">
              <Film size={36} />
            </div>
            <h3>Nothing here yet.</h3>
            <p>{searchQuery ? 'Try a different search term' : 'Start the trend.'}</p>
            <Link to="/upload" className="btn btn-primary" style={{ marginTop: 20 }}>
              Upload
            </Link>
          </div>
        ) : showCarousels ? (
          <div className="carousel-section stagger-children">
            <VideoRow
              title="Trending Now"
              icon={<Flame size={20} />}
              videos={trendingVideos}
            />
            <VideoRow
              title="Latest Uploads"
              icon={<Sparkles size={20} />}
              videos={latestVideos}
            />
            <VideoRow
              title="Most Loved"
              icon={<TrendingUp size={20} />}
              videos={topLiked}
            />
          </div>
        ) : (
          <div className="video-grid stagger-children" id="video-grid">
            {videos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        )}
      </div>

      {/* Info Section / Why StreamFlix */}
      {!searchQuery && activeCategory === 'All' && (
        <section className="info-section">
          <div className="container">
            <div className="info-grid">
              <div className="info-card fade-in">
                <div className="info-icon"><Zap size={24} /></div>
                <h3>Lightning Fast</h3>
                <p>Experience buffer-free streaming with our optimized global content delivery network.</p>
              </div>
              <div className="info-card fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="info-icon"><Globe size={24} /></div>
                <h3>Global Community</h3>
                <p>Connect with millions of creators and viewers from all around the world.</p>
              </div>
              <div className="info-card fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="info-icon"><Shield size={24} /></div>
                <h3>Secure & Private</h3>
                <p>Your data and content are protected by enterprise-grade security protocols.</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { videosAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import {
  ThumbsUp,
  Eye,
  Share2,
  Calendar,
  User,
  Tag,
  ArrowLeft,
} from 'lucide-react';
import './Watch.css';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatViews(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export default function Watch() {
  const { id } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const hasViewed = useRef(false);

  useEffect(() => {
    hasViewed.current = false;
    fetchVideo();
  }, [id]);

  const fetchVideo = async () => {
    setLoading(true);
    try {
      const res = await videosAPI.getById(id);
      setVideo(res.data);

      // Increment view once
      if (!hasViewed.current) {
        hasViewed.current = true;
        videosAPI.incrementView(id);
      }

      // Fetch related videos (same category)
      const allRes = await videosAPI.getAll({ category: res.data.category });
      setRelated(allRes.data.filter((v) => v._id !== id).slice(0, 6));
    } catch (err) {
      console.error('Failed to fetch video:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || liked) return;
    try {
      const res = await videosAPI.likeVideo(id);
      setVideo((prev) => ({ ...prev, likes: res.data.likes }));
      setLiked(true);
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="empty-state fade-in">
            <h3>Video not found</h3>
            <p>This video may have been removed.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const streamUrl = videosAPI.getStreamUrl(video.filename);
  const uploaderInitials = video.uploader?.username?.substring(0, 2).toUpperCase() || '??';

  return (
    <div className="page-content watch-page">
      <div className="container">
        <Link to="/" className="back-link" id="back-home">
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <div className="watch-layout">
          {/* Main Video */}
          <div className="watch-main fade-in">
            <div className="video-player-wrapper" id="video-player">
              <video
                src={streamUrl}
                controls
                autoPlay
                className="video-player"
                poster={
                  video.thumbnailFilename
                    ? videosAPI.getThumbnailUrl(video.thumbnailFilename)
                    : undefined
                }
              />
            </div>

            <div className="video-details">
              <div className="video-title-row">
                <h1 className="video-title" id="video-title">{video.title}</h1>
                {video.category && video.category !== 'Uncategorized' && (
                  <span className="badge badge-accent">
                    <Tag size={11} /> {video.category}
                  </span>
                )}
              </div>

              <div className="video-actions">
                <div className="video-stats-row">
                  <span className="stat-item">
                    <Eye size={16} />
                    {formatViews(video.views + 1)} views
                  </span>
                  <span className="stat-item">
                    <Calendar size={16} />
                    {formatDate(video.createdAt)}
                  </span>
                </div>
                <div className="video-action-buttons">
                  <button
                    className={`btn btn-secondary btn-sm ${liked ? 'liked' : ''}`}
                    onClick={handleLike}
                    disabled={!user || liked}
                    id="like-btn"
                  >
                    <ThumbsUp size={16} />
                    {formatViews(video.likes)} {liked ? 'Liked' : 'Like'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleShare} id="share-btn">
                    <Share2 size={16} />
                    Share
                  </button>
                </div>
              </div>

              <div className="video-channel">
                <div className="channel-avatar">{uploaderInitials}</div>
                <div className="channel-info">
                  <h3>{video.uploader?.username || 'Unknown'}</h3>
                  <span>Creator</span>
                </div>
              </div>

              {video.description && (
                <div className="video-description" id="video-description">
                  <p>{video.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Related */}
          <aside className="watch-sidebar">
            <h3 className="sidebar-title">Related Videos</h3>
            {related.length === 0 ? (
              <p className="sidebar-empty">No related videos yet</p>
            ) : (
              <div className="related-list stagger-children">
                {related.map((v) => (
                  <VideoCard key={v._id} video={v} />
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

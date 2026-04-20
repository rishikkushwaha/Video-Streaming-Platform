import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { videosAPI, usersAPI } from '../api';
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
  MessageSquare,
  Send,
  Bookmark,
} from 'lucide-react';
import { Plyr } from 'plyr-react';
import 'plyr-react/plyr.css';
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
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
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
        if (user) {
          usersAPI.addToHistory(id);
        }
      }

      // Fetch related videos (same category)
      const allRes = await videosAPI.getAll({ category: res.data.category });
      setRelated(allRes.data.filter((v) => v._id !== id).slice(0, 6));

      // Fetch comments
      const commentsRes = await videosAPI.getComments(id);
      setComments(commentsRes.data);

      if (user) {
        const bookmarkRes = await usersAPI.checkWatchLater(id);
        setIsBookmarked(bookmarkRes.data.bookmarked);
      }
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

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    setCommenting(true);
    try {
      const res = await videosAPI.addComment(id, newComment);
      setComments([res.data, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Comment failed:', err);
    } finally {
      setCommenting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleBookmark = async () => {
    if (!user) return;
    try {
      const res = await usersAPI.toggleWatchLater(id);
      setIsBookmarked(res.data.bookmarked);
    } catch (err) {
      console.error('Bookmark failed:', err);
    }
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
            <div className="video-player-wrapper" id="video-player" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <Plyr 
                source={{
                  type: 'video',
                  title: video.title,
                  sources: [
                    { src: streamUrl, type: 'video/mp4' }
                  ],
                  poster: video.thumbnailFilename
                    ? videosAPI.getThumbnailUrl(video.thumbnailFilename)
                    : undefined
                }}
                options={{
                  autoplay: true,
                  controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'download', 'fullscreen'],
                  settings: ['captions', 'speed', 'loop'],
                  speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] }
                }}
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
                  <button 
                    className={`btn btn-secondary btn-sm ${isBookmarked ? 'liked' : ''}`} 
                    onClick={handleBookmark} 
                    disabled={!user}
                    title={user ? "Watch Later" : "Login to save videos"}
                  >
                    <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
                    Save
                  </button>
                </div>
              </div>

              <div className="video-channel">
                <Link to={`/channel/${video.uploader?._id}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit' }}>
                  <div className="channel-avatar">{uploaderInitials}</div>
                  <div className="channel-info">
                    <h3>{video.uploader?.username || 'Unknown'}</h3>
                    <span>View Channel</span>
                  </div>
                </Link>
              </div>

              {video.description && (
                <div className="video-description" id="video-description">
                  <p>{video.description}</p>
                </div>
              )}

              {/* Comments Section */}
              <div className="video-comments-section" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <MessageSquare size={20} />
                  <h3 style={{ margin: 0 }}>{comments.length} Comments</h3>
                </div>

                {user ? (
                  <form onSubmit={handleCommentSubmit} className="comment-form" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="channel-avatar" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        required
                        style={{ flex: 1, borderRadius: '20px', padding: '0.75rem 1.25rem' }}
                      />
                      <button type="submit" className="btn btn-primary" disabled={commenting || !newComment.trim()} style={{ borderRadius: '50%', width: '45px', height: '45px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Send size={18} style={{ marginLeft: '-2px' }} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="alert" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Log in</Link> to add a comment
                  </div>
                )}

                <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {comments.map((comment) => (
                    <div key={comment._id} className="comment-item" style={{ display: 'flex', gap: '1rem' }}>
                      <div className="channel-avatar" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                        {comment.user?.username?.substring(0, 2).toUpperCase() || '??'}
                      </div>
                      <div className="comment-content" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{comment.user?.username || 'Unknown'}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>{comment.text}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No comments yet. Be the first to start the conversation!</p>
                  )}
                </div>
              </div>
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

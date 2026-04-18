import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { videosAPI } from '../api';
import { User, Film, Eye, ThumbsUp, Trash2, Upload, Plus } from 'lucide-react';
import './Dashboard.css';

function formatViews(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyVideos();
  }, [user]);

  const fetchMyVideos = async () => {
    try {
      const res = await videosAPI.getUserVideos(user.id);
      setVideos(res.data);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    try {
      await videosAPI.deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const totalViews = videos.reduce((sum, v) => sum + v.views, 0);
  const totalLikes = videos.reduce((sum, v) => sum + v.likes, 0);

  if (!user) return null;

  return (
    <div className="page-content">
      <div className="container">
        <div className="dash-header fade-in">
          <div className="dash-profile">
            <div className="dash-avatar">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1>{user.username}</h1>
              <p>{user.email}</p>
            </div>
          </div>
          <Link to="/upload" className="btn btn-primary" id="dash-upload-btn">
            <Plus size={18} /> New upload
          </Link>
        </div>

        {/* Stats */}
        <div className="dash-stats fade-in" id="dash-stats">
          <div className="dash-stat-card">
            <div className="dash-stat-icon"><Film size={22} /></div>
            <div className="dash-stat-value">{videos.length}</div>
            <div className="dash-stat-label">Videos</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon"><Eye size={22} /></div>
            <div className="dash-stat-value">{formatViews(totalViews)}</div>
            <div className="dash-stat-label">Views</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon"><ThumbsUp size={22} /></div>
            <div className="dash-stat-value">{formatViews(totalLikes)}</div>
            <div className="dash-stat-label">Likes</div>
          </div>
        </div>

        {/* Videos Table */}
        <div className="dash-section fade-in">
          <h2 className="dash-section-title">Your uploads</h2>

          {loading ? (
            <div className="spinner"></div>
          ) : videos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Film size={36} /></div>
              <h3>No videos yet</h3>
              <p>Upload your first video to get started!</p>
              <Link to="/upload" className="btn btn-primary" style={{ marginTop: 20 }}>
                <Upload size={16} /> Upload Video
              </Link>
            </div>
          ) : (
            <div className="dash-video-list">
              {videos.map((video) => (
                <div key={video._id} className="dash-video-item" id={`dash-vid-${video._id}`}>
                  <Link to={`/watch/${video._id}`} className="dash-video-thumb">
                    {video.thumbnailFilename ? (
                      <img
                        src={videosAPI.getThumbnailUrl(video.thumbnailFilename)}
                        alt={video.title}
                      />
                    ) : (
                      <div className="thumb-placeholder"><Film size={20} /></div>
                    )}
                  </Link>
                  <div className="dash-video-info">
                    <Link to={`/watch/${video._id}`} className="dash-video-title">
                      {video.title}
                    </Link>
                    <div className="dash-video-meta">
                      <span><Eye size={13} /> {formatViews(video.views)}</span>
                      <span><ThumbsUp size={13} /> {formatViews(video.likes)}</span>
                      <span className="badge badge-accent">{video.category}</span>
                    </div>
                  </div>
                  <button
                    className="btn-icon dash-delete-btn"
                    onClick={() => handleDelete(video._id)}
                    title="Delete video"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

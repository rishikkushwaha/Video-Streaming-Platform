import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI, videosAPI } from '../api';
import VideoCard from '../components/VideoCard';
import { Bookmark, Film } from 'lucide-react';
import './Dashboard.css'; // Reusing dashboard grid styles

export default function WatchLater() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchLater();
  }, []);

  const fetchWatchLater = async () => {
    try {
      const res = await usersAPI.getWatchLater();
      setVideos(res.data);
    } catch (err) {
      console.error('Failed to fetch watch later videos:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        <div className="dash-header fade-in" style={{ padding: '2rem', marginBottom: '2rem', background: 'var(--bg-secondary)', borderRadius: '1rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="dash-avatar" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Bookmark size={24} />
          </div>
          <div>
            <h1 style={{ margin: '0 0 0.25rem 0' }}>Watch Later</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              {videos.length} {videos.length === 1 ? 'video' : 'videos'} saved
            </p>
          </div>
        </div>

        <div className="dash-section fade-in">
          {videos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Film size={36} /></div>
              <h3>Your Watch Later list is empty</h3>
              <p>Save videos to watch them later by clicking the Bookmark icon on any video.</p>
              <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>
                Explore Videos
              </Link>
            </div>
          ) : (
            <div className="video-grid stagger-children">
              {videos.map(video => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

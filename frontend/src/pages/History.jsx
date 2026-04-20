import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI } from '../api';
import VideoCard from '../components/VideoCard';
import { History as HistoryIcon, Film } from 'lucide-react';
import './Dashboard.css';

export default function History() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await usersAPI.getHistory();
      setVideos(res.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
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
            <HistoryIcon size={24} />
          </div>
          <div>
            <h1 style={{ margin: '0 0 0.25rem 0' }}>Watch History</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Videos you have watched
            </p>
          </div>
        </div>

        <div className="dash-section fade-in">
          {videos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Film size={36} /></div>
              <h3>Your watch history is empty</h3>
              <p>Explore the platform and start watching some videos!</p>
              <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>
                Explore Videos
              </Link>
            </div>
          ) : (
            <div className="video-grid stagger-children">
              {videos.map(video => (
                <VideoCard key={`history-${video._id}`} video={video} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

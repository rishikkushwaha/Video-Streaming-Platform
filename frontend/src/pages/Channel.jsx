import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import { UserCheck, UserPlus, Film } from 'lucide-react';
import './Dashboard.css'; // Reusing some dashboard styles for the layout

export default function Channel() {
  const { id } = useParams();
  const { user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchChannel();
    if (user) {
      checkSubscription();
    }
  }, [id, user]);

  const fetchChannel = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getChannel(id);
      setChannel(res.data.channel);
      setVideos(res.data.videos);
    } catch (err) {
      console.error('Failed to fetch channel:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    if (user.id === id) return; // Can't subscribe to self
    try {
      const res = await usersAPI.isSubscribed(id);
      setIsSubscribed(res.data.subscribed);
    } catch (err) {
      console.error('Failed to check subscription:', err);
    }
  };

  const handleSubscribe = async () => {
    if (!user || user.id === id) return;
    setSubscribing(true);
    try {
      const res = await usersAPI.subscribe(id);
      setIsSubscribed(res.data.subscribed);
      setChannel(prev => ({
        ...prev,
        subscriberCount: prev.subscriberCount + (res.data.subscribed ? 1 : -1)
      }));
    } catch (err) {
      console.error('Subscription failed:', err);
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="page-content container">
        <div className="empty-state">
          <h3>Channel not found</h3>
        </div>
      </div>
    );
  }

  const isOwnChannel = user && user.id === id;

  return (
    <div className="page-content">
      <div className="container">
        {/* Channel Banner & Header */}
        <div className="dash-header fade-in" style={{ padding: '3rem 2rem', marginBottom: '2rem', background: 'var(--bg-secondary)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
          <div className="dash-profile" style={{ gap: '1.5rem' }}>
            <div className="dash-avatar" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
              {channel.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>{channel.username}</h1>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                {channel.subscriberCount} {channel.subscriberCount === 1 ? 'subscriber' : 'subscribers'}
              </p>
            </div>
          </div>
          
          {!isOwnChannel && user && (
            <button 
              className={`btn ${isSubscribed ? 'btn-secondary' : 'btn-primary'} btn-lg`}
              onClick={handleSubscribe}
              disabled={subscribing}
              style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isSubscribed ? <UserCheck size={20} /> : <UserPlus size={20} />}
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          )}
        </div>

        {/* Channel Videos */}
        <div className="dash-section fade-in">
          <h2 className="dash-section-title" style={{ marginBottom: '1.5rem' }}>Videos</h2>
          
          {videos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Film size={36} /></div>
              <h3>No videos uploaded yet</h3>
              <p>This channel doesn't have any content.</p>
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

import { Link } from 'react-router-dom';
import { Eye, ThumbsUp, Clock } from 'lucide-react';
import { videosAPI } from '../api';
import './VideoCard.css';

function formatViews(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function VideoCard({ video, compact }) {
  const thumbnailUrl = video.thumbnailFilename
    ? videosAPI.getThumbnailUrl(video.thumbnailFilename)
    : null;

  const initials = video.uploader?.username
    ? video.uploader.username.substring(0, 2).toUpperCase()
    : '??';

  return (
    <Link to={`/watch/${video._id}`} className={`video-card ${compact ? 'video-card-compact' : ''}`} id={`video-card-${video._id}`}>
      <div className="video-card-thumbnail">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={video.title} loading="lazy" />
        ) : (
          <div className="thumbnail-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}
        <div className="video-card-overlay">
          <div className="play-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
        {video.category && video.category !== 'Uncategorized' && (
          <span className="video-card-badge badge badge-accent">{video.category}</span>
        )}
      </div>

      <div className="video-card-info">
        {!compact && (
          <div className="video-card-avatar">
            {initials}
          </div>
        )}
        <div className="video-card-meta">
          <h3 className="video-card-title">{video.title}</h3>
          <p className="video-card-channel">{video.uploader?.username || 'Unknown'}</p>
          <div className="video-card-stats">
            <span><Eye size={13} /> {formatViews(video.views)}</span>
            <span><ThumbsUp size={13} /> {formatViews(video.likes)}</span>
            <span><Clock size={13} /> {timeAgo(video.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

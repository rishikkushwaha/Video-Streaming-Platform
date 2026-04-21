import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { videosAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import VideoPlayer from '../components/VideoPlayer';
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
  Maximize2,
  Minimize2,
  Square,
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
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [editText, setEditText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const hasViewed = useRef(false);

  const streamUrl = video ? videosAPI.getStreamUrl(video.filename) : '';
  const uploaderInitials = (video?.uploader?.username || '??').substring(0, 2).toUpperCase();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key.toLowerCase() === 't') {
        setIsTheaterMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      
      // Set initial liked status
      if (user && res.data.likedBy) {
        setLiked(res.data.likedBy.some(id => id.toString() === user.id));
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

  useEffect(() => {
    if (user && video) {
      const isLiked = video.likedBy?.some(uid => uid.toString() === user.id);
      setLiked(!!isLiked);
    } else {
      setLiked(false);
    }
  }, [user, video]);

  useEffect(() => {
    hasViewed.current = false;
    fetchVideo();
    window.scrollTo(0, 0);
  }, [id, user]);




  const handleLike = async () => {
    if (!user || liking) return;
    setLiking(true);
    try {
      const res = await videosAPI.likeVideo(id);
      setVideo((prev) => ({ ...prev, likes: res.data.likes }));
      setLiked(res.data.isLiked);
    } catch (err) {
      console.error('Like failed:', err);
    } finally {
      setLiking(false);
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

  const handleCommentDelete = async (commentId) => {
    try {
      await videosAPI.deleteComment(commentId);
      setComments(prev => prev.filter(c => c._id !== commentId && c.parentComment !== commentId));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleCommentEdit = async (commentId) => {
    if (!editText.trim()) return;
    try {
      await videosAPI.editComment(commentId, editText);
      setComments(prev => prev.map(c => c._id === commentId ? { ...c, text: editText } : c));
      setEditingCommentId(null);
    } catch (err) {
      console.error('Edit error:', err);
    }
  };

  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    if (!user || !replyText.trim()) return;
    try {
      const res = await videosAPI.replyToComment(parentId, replyText);
      setComments(prev => [res.data, ...prev]);
      setReplyText('');
      setReplyingToCommentId(null);
    } catch (err) {
      console.error('Reply error:', err);
    }
  };

  const handleCommentLike = async (commentId) => {
    if (!user) return;
    try {
      const res = await videosAPI.likeComment(commentId);
      setComments(prev => prev.map(c => 
        c._id === commentId ? { ...c, likes: res.data.likes, likedBy: res.data.isLiked ? [...(c.likedBy || []), user.id] : (c.likedBy || []).filter(id => id.toString() !== user.id) } : c
      ));
    } catch (err) {
      console.error('Comment like error:', err);
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


  return (
    <div className={`page-content watch-page ${isTheaterMode ? 'theater-mode-active' : ''}`}>
      <div className={isTheaterMode ? '' : 'container'}>
        {!isTheaterMode && (
          <Link to="/" className="back-link" id="back-home">
            <ArrowLeft size={18} />
            Back to Home
          </Link>
        )}

        <div className={`watch-layout ${isTheaterMode ? 'theater-mode' : ''}`}>
          {/* Main Video */}
          <div className="watch-main fade-in">
            <VideoPlayer 
              src={streamUrl} 
              poster={video.thumbnailFilename ? videosAPI.getThumbnailUrl(video.thumbnailFilename) : ''} 
            />

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
                    className={`action-btn like-btn ${liked ? 'active' : ''}`} 
                    onClick={handleLike}
                    disabled={!user || liking}
                    id="like-btn"
                  >
                    <i className={`fas fa-thumbs-up ${liking ? 'fa-spin' : ''}`}></i>
                    <span>{formatViews(video.likes)} {liked ? 'Liked' : 'Like'}</span>
                  </button>
                  <button className="action-btn" onClick={handleShare} id="share-btn">
                    <Share2 size={16} />
                    <span>Share</span>
                  </button>
                  <button 
                    className={`action-btn ${isTheaterMode ? 'active' : ''}`}
                    onClick={() => setIsTheaterMode(!isTheaterMode)}
                    title="Theater Mode (t)"
                  >
                    {isTheaterMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    <span>Theater</span>
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
                      {(user.username || '??').substring(0, 2).toUpperCase()}
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
                  {comments.filter(c => !c.parentComment).map((comment) => (
                    <div key={comment._id} className="comment-item-container">
                      <div className="comment-item" style={{ display: 'flex', gap: '1rem' }}>
                        <div className="channel-avatar" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                          {(comment.user?.username || '??').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="comment-content" style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{comment.user?.username || 'Unknown'}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          
                          {editingCommentId === comment._id ? (
                            <div className="edit-form">
                              <input 
                                className="input-field"
                                value={editText} 
                                onChange={(e) => setEditText(e.target.value)} 
                                autoFocus
                              />
                              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button className="btn btn-primary btn-sm" onClick={() => handleCommentEdit(comment._id)}>Save</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditingCommentId(null)}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>{comment.text}</p>
                          )}

                          <div className="comment-actions" style={{ display: 'flex', gap: '16px', marginTop: '8px', alignItems: 'center' }}>
                            <button 
                              className={`comment-action-btn ${comment.likedBy?.some(id => id.toString() === user?.id) ? 'active' : ''}`}
                              onClick={() => handleCommentLike(comment._id)}
                            >
                              <ThumbsUp size={14} />
                              <span>{comment.likes || 0}</span>
                            </button>
                            <button className="comment-action-btn" onClick={() => {
                              setReplyingToCommentId(comment._id);
                              setReplyText('');
                            }}>
                              Reply
                            </button>
                            
                            {user?.id === comment.user?._id && (
                              <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="comment-action-btn" onClick={() => {
                                  setEditingCommentId(comment._id);
                                  setEditText(comment.text);
                                }}>Edit</button>
                                <button className="comment-action-btn" onClick={() => handleCommentDelete(comment._id)}>Delete</button>
                              </div>
                            )}
                          </div>

                          {replyingToCommentId === comment._id && (
                            <form onSubmit={(e) => handleReplySubmit(e, comment._id)} className="reply-form" style={{ marginTop: '12px' }}>
                              <input 
                                className="input-field"
                                placeholder="Write a reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                autoFocus
                              />
                              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button type="submit" className="btn btn-primary btn-sm">Reply</button>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReplyingToCommentId(null)}>Cancel</button>
                              </div>
                            </form>
                          )}

                          {/* Render Replies */}
                          <div className="replies-list" style={{ marginTop: '12px', paddingLeft: '24px', borderLeft: '2px solid var(--border)' }}>
                            {comments.filter(r => r.parentComment === comment._id).map(reply => (
                              <div key={reply._id} className="comment-item" style={{ display: 'flex', gap: '1rem', marginTop: '12px' }}>
                                <div className="channel-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                                  {(reply.user?.username || '??').substring(0, 2).toUpperCase()}
                                </div>
                                <div className="comment-content">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{reply.user?.username}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(reply.createdAt)}</span>
                                  </div>
                                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{reply.text}</p>
                                  
                                  <div className="comment-actions" style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                                    <button 
                                      className={`comment-action-btn ${reply.likedBy?.some(id => id.toString() === user?.id) ? 'active' : ''}`}
                                      onClick={() => handleCommentLike(reply._id)}
                                    >
                                      <ThumbsUp size={12} />
                                      <span>{reply.likes || 0}</span>
                                    </button>
                                    {user?.id === reply.user?._id && (
                                      <button className="comment-action-btn" style={{ fontSize: '0.75rem' }} onClick={() => handleCommentDelete(reply._id)}>Delete</button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
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

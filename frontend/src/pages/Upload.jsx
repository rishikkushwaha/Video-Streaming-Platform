import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { videosAPI } from '../api';
import { Upload as UploadIcon, Film, Image, FileText, Tag, CheckCircle } from 'lucide-react';
import './Upload.css';

const CATEGORIES = [
  'Uncategorized',
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

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: 'Uncategorized' });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [thumbPreview, setThumbPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleThumbChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      setThumbPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setError('Please select a video file');
      return;
    }
    if (!form.title.trim()) {
      setError('Please enter a title');
      return;
    }

    setError('');
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('video', videoFile);
    if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('category', form.category);

    try {
      await videosAPI.upload(formData);
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="page-content upload-page">
        <div className="upload-success fade-in">
          <div className="success-icon">
            <CheckCircle size={48} />
          </div>
          <h2>Video Uploaded!</h2>
          <p>Your video has been uploaded successfully. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content upload-page">
      <div className="container">
        <div className="upload-container fade-in">
          <div className="upload-header">
            <h1>
              <UploadIcon size={28} />
              Upload.
            </h1>
            <p>Share your story.</p>
          </div>

          {error && (
            <div className="alert alert-error" id="upload-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="upload-form" id="upload-form">
            <div className="upload-grid">
              {/* Left: File Uploads */}
              <div className="upload-files">
                {/* Video Drop Zone */}
                <div className="drop-zone" id="video-drop-zone">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="drop-input"
                    id="video-input"
                  />
                  {videoPreview ? (
                    <div className="drop-preview">
                      <video src={videoPreview} className="preview-video" muted />
                      <div className="drop-overlay">
                        <Film size={24} />
                        <span>Change Video</span>
                      </div>
                    </div>
                  ) : (
                    <div className="drop-content">
                      <div className="drop-icon">
                        <Film size={32} />
                      </div>
                      <h3>Select Video File</h3>
                      <p>MP4, MKV, AVI, MOV, WebM • Max 500MB</p>
                    </div>
                  )}
                </div>

                {/* Thumbnail Drop Zone */}
                <div className="drop-zone drop-zone-sm" id="thumb-drop-zone">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbChange}
                    className="drop-input"
                    id="thumb-input"
                  />
                  {thumbPreview ? (
                    <div className="drop-preview">
                      <img src={thumbPreview} alt="Thumbnail" className="preview-thumb" />
                      <div className="drop-overlay">
                        <Image size={20} />
                        <span>Change</span>
                      </div>
                    </div>
                  ) : (
                    <div className="drop-content">
                      <Image size={24} />
                      <h4>Add Thumbnail</h4>
                      <p>JPG, PNG, WebP</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Metadata */}
              <div className="upload-meta">
                <div className="input-group">
                  <label htmlFor="title">
                    <FileText size={14} /> Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    className="input-field"
                    placeholder="Give your video a catchy title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="description">
                    <FileText size={14} /> Description
                  </label>
                  <textarea
                    id="description"
                    className="input-field"
                    placeholder="Tell viewers about your video..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    maxLength={2000}
                    rows={5}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="category">
                    <Tag size={14} /> Category
                  </label>
                  <select
                    id="category"
                    className="input-field"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg upload-submit"
                  disabled={uploading}
                  id="upload-submit"
                >
                  {uploading ? (
                    <>Uploading...</>
                  ) : (
                    <>
                      <UploadIcon size={18} />
                      Publish
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

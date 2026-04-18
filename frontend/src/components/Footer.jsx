import { Link } from 'react-router-dom';
import { Play, Code, Mail } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="logo-icon-sm">
                <Play size={14} fill="white" />
              </div>
              <span className="logo-text">StreamFlix</span>
            </Link>
            <p className="footer-desc">
              Your premium destination for discovering and sharing video content.
            </p>
            <div className="footer-social">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="social-link"><Code size={18} /></a>
              <a href="mailto:contact@streamflix.com" className="social-link"><Mail size={18} /></a>
            </div>
          </div>

          {/* Links */}
          <div className="footer-links">
            <h3 className="footer-title">Platform</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/?sort=views">Trending</Link></li>
              <li><Link to="/upload">Upload</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h3 className="footer-title">Company</h3>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} StreamFlix. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

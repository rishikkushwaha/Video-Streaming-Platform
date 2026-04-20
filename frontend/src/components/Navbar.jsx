import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import {
  Play,
  Search,
  Upload,
  LogIn,
  LogOut,
  User,
  Home,
  Compass,
  Flame,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Bell,
  Settings,
  HelpCircle,
  Shield,
  Bookmark,
  History,
} from 'lucide-react';
import { useState } from 'react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useLayout();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' && !location.search;
    return location.pathname === path;
  };

  return (
    <>
      {/* Top Bar */}
      <header className="topbar" id="main-topbar">
        <div className="topbar-inner">
          <Link to="/" className="topbar-logo" id="topbar-logo">
            <div className="logo-icon">
              <Play size={18} fill="white" />
            </div>
            <span className="logo-text">StreamFlix</span>
          </Link>

          <form className="topbar-search" onSubmit={handleSearch} id="topbar-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search videos, creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              id="search-input"
            />
          </form>

          <div className="topbar-actions">
            {user ? (
              <>
                <Link to="/upload" className="btn btn-primary btn-sm" id="upload-btn">
                  <Upload size={15} />
                  Upload
                </Link>
                <button className="topbar-icon-btn" title="Notifications">
                  <Bell size={19} />
                </button>
                <Link to="/dashboard" className="topbar-avatar" id="avatar-btn" title={user.username}>
                  {user.username.substring(0, 2).toUpperCase()}
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm" id="login-btn">
                  <LogIn size={16} />
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" id="register-btn">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Left Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} id="sidebar">
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          id="sidebar-toggle"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <nav className="sidebar-nav">
          {/* Main */}
          <div className="sidebar-section">
            {!sidebarCollapsed && <span className="sidebar-heading">Menu</span>}
            <Link to="/" className={`sidebar-link ${isActive('/') ? 'active' : ''}`} id="nav-home" title="Home">
              <Home size={20} />
              <span className="sidebar-label">Home</span>
            </Link>
            <Link to="/?sort=views" className={`sidebar-link ${location.search.includes('sort=views') ? 'active' : ''}`} id="nav-trending" title="Trending">
              <Flame size={20} />
              <span className="sidebar-label">Trending</span>
            </Link>
            <Link to="/?sort=latest" className={`sidebar-link ${location.search.includes('sort=latest') ? 'active' : ''}`} id="nav-explore" title="Explore">
              <Compass size={20} />
              <span className="sidebar-label">Explore</span>
            </Link>
          </div>

          <div className="sidebar-divider"></div>

          {/* Account */}
          <div className="sidebar-section">
            {!sidebarCollapsed && <span className="sidebar-heading">Account</span>}
            {user ? (
              <>
                <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`} id="nav-dashboard" title="Dashboard">
                  <LayoutDashboard size={20} />
                  <span className="sidebar-label">Dashboard</span>
                </Link>
                <Link to="/watch-later" className={`sidebar-link ${isActive('/watch-later') ? 'active' : ''}`} id="nav-watch-later" title="Watch Later">
                  <Bookmark size={20} />
                  <span className="sidebar-label">Watch Later</span>
                </Link>
                <Link to="/history" className={`sidebar-link ${isActive('/history') ? 'active' : ''}`} id="nav-history" title="History">
                  <History size={20} />
                  <span className="sidebar-label">History</span>
                </Link>
                <Link to="/upload" className={`sidebar-link ${isActive('/upload') ? 'active' : ''}`} id="nav-upload" title="Upload">
                  <Upload size={20} />
                  <span className="sidebar-label">Upload</span>
                </Link>
                <button onClick={handleLogout} className="sidebar-link" id="nav-logout" title="Logout">
                  <LogOut size={20} />
                  <span className="sidebar-label">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`sidebar-link ${isActive('/login') ? 'active' : ''}`} id="nav-login" title="Sign In">
                  <LogIn size={20} />
                  <span className="sidebar-label">Sign In</span>
                </Link>
                <Link to="/register" className={`sidebar-link ${isActive('/register') ? 'active' : ''}`} id="nav-register" title="Register">
                  <User size={20} />
                  <span className="sidebar-label">Register</span>
                </Link>
              </>
            )}
          </div>

          <div className="sidebar-divider"></div>

          {/* Info */}
          <div className="sidebar-section">
            {!sidebarCollapsed && <span className="sidebar-heading">Information</span>}
            <Link to="/about" className={`sidebar-link ${isActive('/about') ? 'active' : ''}`} title="Help Center">
              <HelpCircle size={20} />
              <span className="sidebar-label">Help Center</span>
            </Link>
            <Link to="/privacy" className={`sidebar-link ${isActive('/privacy') ? 'active' : ''}`} title="Privacy & Safety">
              <Shield size={20} />
              <span className="sidebar-label">Privacy</span>
            </Link>
            <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`} title="Settings">
              <Settings size={20} />
              <span className="sidebar-label">Settings</span>
            </Link>
          </div>
        </nav>

        {/* Sidebar footer */}
        {!sidebarCollapsed && (
          <div className="sidebar-footer">
            <p>© 2026 StreamFlix</p>
            <p>All rights reserved</p>
          </div>
        )}
      </aside>
    </>
  );
}

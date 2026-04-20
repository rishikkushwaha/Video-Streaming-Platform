import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LayoutProvider, useLayout } from './context/LayoutContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from "./components/Footer";
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import Watch from './pages/Watch';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import VerifyEmail from './pages/VerifyEmail';
import Channel from './pages/Channel';
import WatchLater from './pages/WatchLater';
import History from './pages/History';

function AppLayout() {
  const { sidebarCollapsed } = useLayout();

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      <div className="bg-blobs">
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>
      </div>
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/channel/:id" element={<Channel />} />
          <Route path="/watch-later" element={<WatchLater />} />
          <Route path="/history" element={<History />} />
        </Routes>
        <Footer />
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LayoutProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AppLayout />
          </BrowserRouter>
        </LayoutProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

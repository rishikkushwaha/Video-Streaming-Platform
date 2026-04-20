import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MailCheck, KeyRound } from 'lucide-react';
import './Auth.css';

export default function VerifyEmail() {
  const { verifyEmail, user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already verified, go home
  if (user?.isVerified) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyEmail(code);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content auth-page">
      <div className="auth-container fade-in">
        <div className="auth-header">
          <div className="auth-icon-wrapper" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <MailCheck size={28} />
          </div>
          <h1>Verify your email</h1>
          <p>We've sent a 6-digit code to your email. It expires in 10 minutes.</p>
        </div>

        {error && (
          <div className="alert alert-error" id="verify-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" id="verify-form">
          <div className="input-group">
            <label htmlFor="code">Verification Code</label>
            <div className="input-with-icon">
              <KeyRound size={18} className="input-icon" />
              <input
                id="code"
                type="text"
                className="input-field"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                maxLength={6}
                minLength={6}
                style={{ letterSpacing: '4px', fontSize: '1.2rem', textAlign: 'center' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading} id="verify-submit">
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
      </div>
    </div>
  );
}

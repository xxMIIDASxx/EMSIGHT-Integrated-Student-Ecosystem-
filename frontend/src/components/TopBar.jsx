import React, { useState, useRef } from 'react';
import { Moon, Sun, LogOut, Key, X, Upload, User } from 'lucide-react';
import logo from '../assets/logo_no_txt.png';
import api from '../api';

function TopBar({ user, onLogout, theme, setTheme, currentPlatform, setCurrentPlatform }) {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setLoading(true);

    try {
      await api.post('/accounts/users/change_password/', {
        email: user.email,
        old_password: oldPassword,
        new_password: newPassword
      });
      setPasswordSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setPasswordError(err.response.data.error);
      } else {
        setPasswordError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError('');
    setUploadSuccess('');
    setLoading(true);

    const formData = new FormData();
    formData.append('email', user.email);
    formData.append('profile_picture', file);

    try {
      const res = await api.post('/accounts/users/upload_profile_picture/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadSuccess('Profile picture updated successfully!');
      // Update local storage and force reload or pass a callback to update user
      localStorage.setItem('user', JSON.stringify(res.data));
      window.location.reload(); // Simple way to reflect changes globally
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setUploadError(err.response.data.error);
      } else {
        setUploadError('Failed to upload picture.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getProfilePicUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://127.0.0.1:8000${url}`;
  };

  return (
    <div className="demo-topbar">
      <div className="demo-brand" onClick={() => setCurrentPlatform && setCurrentPlatform('portal')} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="EMSIGHT Logo" style={{ height: '64px', marginRight: '0.75rem' }} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span className="brand-title" style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '0.2px' }}>EMSIGHT</span>
          <span style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>
            {currentPlatform === 'community' ? 'COMMUNITY' : currentPlatform === 'share' ? 'SHARE' : 'STUDENT PORTAL'}
          </span>
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {user && setCurrentPlatform && (
          <div style={{ display: 'flex', background: 'var(--surface-hover)', borderRadius: 'var(--radius-full)', padding: '0.25rem' }}>
            <button
              onClick={() => setCurrentPlatform('portal')}
              style={{
                padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-full)', border: 'none',
                background: currentPlatform === 'portal' ? 'var(--primary)' : 'transparent',
                color: currentPlatform === 'portal' ? 'white' : 'var(--text-main)',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              Portal
            </button>
            <button
              onClick={() => setCurrentPlatform('community')}
              style={{
                padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-full)', border: 'none',
                background: currentPlatform === 'community' ? 'var(--primary)' : 'transparent',
                color: currentPlatform === 'community' ? 'white' : 'var(--text-main)',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              Community
            </button>
            <button
              onClick={() => setCurrentPlatform('share')}
              style={{
                padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-full)', border: 'none',
                background: currentPlatform === 'share' ? 'var(--primary)' : 'transparent',
                color: currentPlatform === 'share' ? 'white' : 'var(--text-main)',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              Share
            </button>
          </div>
        )}
      </div>

      <div className="role-switcher" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginRight: '1rem' }}>
            {user.profile_picture ? (
              <img src={getProfilePicUrl(user.profile_picture)} alt="Profile" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <User size={20} />
              </div>
            )}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
              {user.first_name} {user.last_name}
              <span style={{ marginLeft: '0.5rem', padding: '0.15rem 0.5rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                {user.role}
              </span>
            </span>
            <button 
              onClick={() => setShowSettingsModal(true)} 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
            >
              <Key size={16} /> Settings
            </button>
            <button 
              onClick={onLogout} 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
        
        <button 
          onClick={toggleTheme} 
          className="role-btn" 
          style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      {showSettingsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setShowSettingsModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Account Settings</h2>
            
            <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={16} /> Profile Picture
              </h3>
              {uploadError && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{uploadError}</div>}
              {uploadSuccess && <div style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.875rem' }}>{uploadSuccess}</div>}
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                ref={fileInputRef} 
                onChange={handleProfilePicUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="btn btn-secondary" 
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Uploading...' : 'Select Picture to Upload'}
              </button>
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={16} /> Change Password
              </h3>
              {passwordError && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{passwordError}</div>}
              {passwordSuccess && <div style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.875rem' }}>{passwordSuccess}</div>}
              
              <form onSubmit={handleChangePassword}>
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label className="input-label">Current Password</label>
                  <input 
                    type="password" 
                    className="input-field" 
                    value={oldPassword} 
                    onChange={(e) => setOldPassword(e.target.value)} 
                    required 
                  />
                </div>
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label">New Password</label>
                  <input 
                    type="password" 
                    className="input-field" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TopBar;

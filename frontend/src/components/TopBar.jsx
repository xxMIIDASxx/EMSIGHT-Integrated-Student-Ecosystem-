import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Moon, Sun, LogOut, Key, X, Upload, User, Menu } from 'lucide-react';
import logo from '../assets/logo_no_txt.png';
import api from '../api';

function TopBar({ user, onLogout, theme, setTheme, currentPlatform, setCurrentPlatform, isSidebarOpen, setIsSidebarOpen }) {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAnimatingTheme, setIsAnimatingTheme] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const toggleTheme = () => {
    setIsAnimatingTheme(true);
    setTheme(theme === 'light' ? 'dark' : 'light');
    setTimeout(() => {
      setIsAnimatingTheme(false);
    }, 500);
  };

  const closeSettings = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowSettingsModal(false);
      setIsClosing(false);
    }, 280);
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
      <button 
        className="hamburger-btn"
        onClick={() => setIsSidebarOpen && setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu size={24} />
      </button>
      <div className="demo-brand" onClick={() => setCurrentPlatform && setCurrentPlatform('portal')} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="EMSIGHT Logo" style={{ height: '64px', marginRight: '0.75rem' }} />
        <div className="brand-text-container" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span className="brand-title" style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '0.2px' }}>EMSIGHT</span>
          <span className="brand-subtitle hide-mobile" style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>
            {currentPlatform === 'community' ? 'COMMUNITY' : currentPlatform === 'share' ? 'SHARE' : 'STUDENT PORTAL'}
          </span>
        </div>
      </div>
      
      <div className="platform-switcher" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {user && setCurrentPlatform && (
          <div style={{ display: 'flex', position: 'relative', background: 'var(--surface-hover)', borderRadius: 'var(--radius-full)', padding: '0.25rem', minWidth: '300px' }}>
            <div 
              style={{
                position: 'absolute',
                top: '0.25rem',
                bottom: '0.25rem',
                left: `calc(0.25rem + ${
                  currentPlatform === 'portal' ? '0%' : 
                  currentPlatform === 'community' ? '33.333%' : '66.666%'
                } - ${currentPlatform === 'portal' ? '0px' : currentPlatform === 'community' ? '0.16rem' : '0.32rem'})`,
                width: 'calc(33.333% - 0.16rem)',
                background: 'var(--primary)',
                borderRadius: 'var(--radius-full)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                zIndex: 0
              }}
            />
            <button
              onClick={() => setCurrentPlatform('portal')}
              style={{
                flex: 1, position: 'relative', zIndex: 1,
                padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-full)', border: 'none',
                background: 'transparent',
                color: currentPlatform === 'portal' ? 'white' : 'var(--text-main)',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'color 0.3s'
              }}
            >
              Portal
            </button>
            <button
              onClick={() => setCurrentPlatform('community')}
              style={{
                flex: 1, position: 'relative', zIndex: 1,
                padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-full)', border: 'none',
                background: 'transparent',
                color: currentPlatform === 'community' ? 'white' : 'var(--text-main)',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'color 0.3s'
              }}
            >
              Community
            </button>
            <button
              onClick={() => setCurrentPlatform('share')}
              style={{
                flex: 1, position: 'relative', zIndex: 1,
                padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-full)', border: 'none',
                background: 'transparent',
                color: currentPlatform === 'share' ? 'white' : 'var(--text-main)',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'color 0.3s'
              }}
            >
              Share
            </button>
          </div>
        )}
      </div>

      <div className="role-switcher" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && (
          <div className="user-actions-group" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginRight: '1rem' }}>
            {user.profile_picture ? (
              <img src={getProfilePicUrl(user.profile_picture)} alt="Profile" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <User size={20} />
              </div>
            )}
            <span className="hide-mobile" style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
              {user.first_name} {user.last_name}
              <span style={{ marginLeft: '0.5rem', padding: '0.15rem 0.5rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                {user.role}
              </span>
            </span>
            <button 
              onClick={() => setShowSettingsModal(true)} 
              className="btn btn-secondary action-btn" 
              style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
              title="Settings"
            >
              <Key size={16} /> <span className="hide-mobile">Settings</span>
            </button>
            <button 
              onClick={onLogout} 
              className="btn btn-secondary action-btn" 
              style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
              title="Logout"
            >
              <LogOut size={16} /> <span className="hide-mobile">Logout</span>
            </button>
          </div>
        )}
        
        <button 
          onClick={toggleTheme}
          className="role-btn theme-btn" 
          style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          <div className={isAnimatingTheme ? 'spin-animation' : ''} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </div>
        </button>
      </div>

      {showSettingsModal && createPortal(
        <div className={`overlay-animate ${isClosing ? 'closing' : ''}`} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)'
        }}>
          <div className={`modal-animate glass-panel ${isClosing ? 'closing' : ''}`} style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative', margin: 'auto' }}>
            <button 
              onClick={closeSettings}
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
        </div>,
        document.body
      )}
    </div>
  );
}

export default TopBar;

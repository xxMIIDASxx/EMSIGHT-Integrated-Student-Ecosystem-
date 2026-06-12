import React from 'react';
import { Calendar, Bell, FileText, UserCheck, ShieldAlert, GraduationCap, LayoutDashboard, FileArchive, MessageSquare, Briefcase, FileCheck, Share2, FolderOpen, Bookmark, AlertTriangle } from 'lucide-react';

function Sidebar({ user, currentRole, activeTab, setActiveTab, currentPlatform }) {
  const getNavItems = () => {
    switch(currentRole) {
      case 'student':
        return [
          { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="nav-icon" /> },
          { id: 'calendar', label: 'Calendar', icon: <Calendar className="nav-icon" /> },
          { id: 'notifications', label: 'Notifications', icon: <Bell className="nav-icon" /> },
          { id: 'grades', label: 'Report Cards', icon: <GraduationCap className="nav-icon" /> },
          { id: 'absences', label: 'Absences', icon: <UserCheck className="nav-icon" /> },
          { id: 'documents', label: 'Admin Documents', icon: <FileText className="nav-icon" /> },
        ];
      case 'teacher':
        return [
          { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="nav-icon" /> },
          { id: 'calendar', label: 'Manage Calendar', icon: <Calendar className="nav-icon" /> },
          { id: 'notifications', label: 'Send Notifications', icon: <Bell className="nav-icon" /> },
          { id: 'grades', label: 'Manage Grades', icon: <FileArchive className="nav-icon" /> },
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="nav-icon" /> },
          { id: 'calendar', label: 'Manage Calendar', icon: <Calendar className="nav-icon" /> },
          { id: 'notifications', label: 'Global Notifications', icon: <Bell className="nav-icon" /> },
          { id: 'users', label: 'User Directory', icon: <UserCheck className="nav-icon" /> },
          { id: 'validations', label: 'Validations', icon: <ShieldAlert className="nav-icon" /> },
        ];
      default:
        return [];
    }
  };

  const navItems = currentPlatform === 'community'
    ? [
        { id: 'feed', label: 'News Feed', icon: <MessageSquare className="nav-icon" /> },
        { id: 'events', label: 'Events', icon: <Calendar className="nav-icon" /> },
        { id: 'jobs', label: 'Job Offers', icon: <Briefcase className="nav-icon" /> },
        { id: 'cvanalyzer', label: 'CV Analyzer', icon: <FileCheck className="nav-icon" /> },
      ]
    : currentPlatform === 'share'
      ? user?.role === 'admin'
        ? [
            { id: 'browse', label: 'All Resources', icon: <FolderOpen className="nav-icon" /> },
            { id: 'reported', label: 'Reported', icon: <AlertTriangle className="nav-icon" /> },
          ]
        : [
            { id: 'browse', label: 'Browse', icon: <Share2 className="nav-icon" /> },
            { id: 'myresources', label: 'My Resources', icon: <FolderOpen className="nav-icon" /> },
            { id: 'favorites', label: 'My List', icon: <Bookmark className="nav-icon" /> },
          ]
    : getNavItems();

  const userName = user ? `${user.first_name} ${user.last_name}` : currentRole;

  const getProfilePicUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://127.0.0.1:8000${url}`;
  };

  return (
    <div className="sidebar">
      <div style={{padding: '2rem 1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
        {user && user.profile_picture ? (
          <img src={getProfilePicUrl(user.profile_picture)} alt="Profile" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
        ) : (
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <UserCheck size={24} />
          </div>
        )}
        <div>
          <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem'}}>
            {currentPlatform === 'community' ? 'Community' : currentPlatform === 'share' ? 'Share' : `${currentRole} Dashboard`}
          </div>
          <div style={{fontWeight: 600, fontSize: '1rem'}}>
            {userName}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            {item.label}
          </div>
        ))}
      </div>

      {/* Credits & Copyright */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderTop: '1px solid var(--border)',
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        lineHeight: 1.6,
      }}>
        <p style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>PFA EMSIGHT</p>
        <p style={{ marginBottom: '0.5rem' }}>
          Made by : Amjad AHRRAR, Hajar CHABLI,<br />
          Nizar BTIRA, Nizar EL IDRYSY,<br />
          Owais BAKKALI.
        </p>
        <p style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', fontSize: '0.68rem' }}>
          EMSIGHT © 2026. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Sidebar;

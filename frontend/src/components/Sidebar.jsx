import React from 'react';
import { Calendar, Bell, FileText, UserCheck, ShieldAlert, GraduationCap, LayoutDashboard, FileArchive, MessageSquare, Briefcase, FileCheck, Share2, FolderOpen, Bookmark, AlertTriangle, X } from 'lucide-react';

function Sidebar({ user, currentRole, activeTab, setActiveTab, currentPlatform, isSidebarOpen, setIsSidebarOpen }) {
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
      ].filter(item => !(currentRole === 'teacher' && item.id === 'jobs'))
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
    return `${import.meta.env.PROD ? '' : 'http://127.0.0.1:8000'}${url}`;
  };

  return (
    <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
      <div style={{padding: '2rem 1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative'}}>

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

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div key={currentPlatform} className="animate-sidebar-content">
          {navItems.map(item => (
            <div
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                if (setIsSidebarOpen) setIsSidebarOpen(false);
              }}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </div>
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
          Made by :{' '}
          <a href="#" target="_blank" rel="noopener noreferrer" className="author-link">Amjad AHRRAR</a>,{' '}
          <a href="https://www.linkedin.com/in/hajarchabli?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noopener noreferrer" className="author-link">Hajar CHABLI</a>,<br />
          <a href="https://github.com/BtiraNizar" target="_blank" rel="noopener noreferrer" className="author-link">Nizar BTIRA</a>,{' '}
          <a href="https://www.linkedin.com/in/nizarelidrysy?utm_source=share_via&utm_content=profile&utm_medium=member_ios" target="_blank" rel="noopener noreferrer" className="author-link">Nizar EL IDRYSY</a>,<br />
          <a href="https://github.com/xxMIIDASxx" target="_blank" rel="noopener noreferrer" className="author-link">Owais BAKKALI</a>.
        </p>
        <p style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', fontSize: '0.68rem' }}>
          EMSIGHT © 2026. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Sidebar;

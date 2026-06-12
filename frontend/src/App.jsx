import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CommunityDashboard from './pages/CommunityDashboard';
import ShareDashboard from './pages/ShareDashboard';
import Login from './pages/Login';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentPlatform, setCurrentPlatform] = useState('portal');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) {
    return (
      <div className="app-container" style={{ paddingTop: 0 }}>
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 100 }}>
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
            className="role-btn" 
            style={{ padding: '0.4rem', borderRadius: '50%', background: 'var(--surface)' }}
          >
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
        </div>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Login onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (currentPlatform === 'community') {
      return <CommunityDashboard activeTab={activeTab} demoUser={user} />;
    }
    if (currentPlatform === 'share') {
      return <ShareDashboard activeTab={activeTab} demoUser={user} />;
    }
    
    switch (user.role) {
      case 'student':
        return <StudentDashboard activeTab={activeTab} demoUser={user} />;
      case 'teacher':
        return <TeacherDashboard activeTab={activeTab} demoUser={user} />;
      case 'admin':
        return <AdminDashboard activeTab={activeTab} demoUser={user} />;
      default:
        return <div>Select a role</div>;
    }
  };

  return (
    <div className="app-container">
      <TopBar 
        user={user} 
        onLogout={handleLogout}
        theme={theme} 
        setTheme={setTheme}
        currentPlatform={currentPlatform}
        setCurrentPlatform={(platform) => {
          setCurrentPlatform(platform);
          if (platform === 'community') {
            setActiveTab('feed');
          } else if (platform === 'share') {
            setActiveTab('browse');
          } else {
            setActiveTab('dashboard');
          }
        }}
      />
      <Sidebar 
        user={user} 
        currentRole={user.role} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        currentPlatform={currentPlatform}
      />
      
      <main className="main-content">
        <div className="animate-fade-in" key={`${user.role}-${activeTab}-${currentPlatform}`}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;

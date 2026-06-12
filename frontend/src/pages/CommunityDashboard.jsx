import React, { useState, useEffect } from 'react';
import { MessageSquare, Calendar as CalendarIcon, Briefcase, FileCheck, Send, Plus, Edit2, Trash2, X, Check, BadgeCheck } from 'lucide-react';
import api from '../api';
import * as pdfjsLib from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker';
pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

function CommunityDashboard({ activeTab, demoUser }) {
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [jobOffers, setJobOffers] = useState([]);
  const [cvAnalyses, setCvAnalyses] = useState([]);
  
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState(null);
  
  // Edit Post State
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');
  
  // New Event State
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', event_date: '', location: '' });
  const [editingEventId, setEditingEventId] = useState(null);
  const [editEvent, setEditEvent] = useState({ title: '', description: '', event_date: '', location: '' });

  // New Job State
  const [showJobForm, setShowJobForm] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', company: '', description: '', requirements: '', location: '', job_type: 'full_time', expiration_date: '' });
  const [editingJobId, setEditingJobId] = useState(null);
  const [editJob, setEditJob] = useState({ title: '', company: '', description: '', requirements: '', location: '', job_type: 'full_time', expiration_date: '' });

  // CV Analyzer state
  const [cvText, setCvText] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [cvInputMode, setCvInputMode] = useState('upload');
  const [cvFileName, setCvFileName] = useState('');

  useEffect(() => {
    const userIdQuery = demoUser ? `?user_id=${demoUser.id}` : '';
    if (activeTab === 'feed') {
      api.get('/community/posts/').then(res => setPosts(res.data)).catch(console.error);
    } else if (activeTab === 'events') {
      api.get('/community/events/').then(res => setEvents(res.data)).catch(console.error);
    } else if (activeTab === 'jobs') {
      api.get('/community/job-offers/').then(res => setJobOffers(res.data)).catch(console.error);
    } else if (activeTab === 'cvanalyzer') {
      api.get(`/community/cv-analysis/${userIdQuery}`).then(res => setCvAnalyses(res.data)).catch(console.error);
      api.get('/community/job-offers/').then(res => setJobOffers(res.data)).catch(console.error);
    }
  }, [activeTab, demoUser]);

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !newPostMedia) return;
    
    const formData = new FormData();
    formData.append('content', newPostContent);
    if (demoUser?.id) formData.append('user_id', demoUser.id);
    if (newPostMedia) formData.append('media', newPostMedia);

    api.post('/community/posts/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(res => {
        setPosts([res.data, ...posts]);
        setNewPostContent('');
        setNewPostMedia(null);
        // reset file input
        const fileInput = document.getElementById('post-media-input');
        if (fileInput) fileInput.value = '';
      })
      .catch(console.error);
  };

  const handleUpdatePost = (e, postId) => {
    e.preventDefault();
    if (!editPostContent.trim()) return;
    
    api.put(`/community/posts/${postId}/`, { content: editPostContent, user_id: demoUser?.id })
      .then(res => {
        setPosts(posts.map(p => p.id === postId ? res.data : p));
        setEditingPostId(null);
        setEditPostContent('');
      })
      .catch(console.error);
  };

  const handleDeletePost = (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    api.delete(`/community/posts/${postId}/`)
      .then(() => {
        setPosts(posts.filter(p => p.id !== postId));
      })
      .catch(console.error);
  };

  const handleToggleValidate = (postId) => {
    api.post(`/community/posts/${postId}/toggle-validate/`, { user_id: demoUser?.id })
      .then(res => {
        setPosts(posts.map(p => p.id === postId ? res.data : p));
      })
      .catch(console.error);
  };

  const handleCreateEvent = (e) => {
    e.preventDefault();
    api.post('/community/events/', { ...newEvent, user_id: demoUser?.id })
      .then(res => {
        setEvents([res.data, ...events]);
        setShowEventForm(false);
        setNewEvent({ title: '', description: '', event_date: '', location: '' });
      })
      .catch(console.error);
  };

  const handleCreateJob = (e) => {
    e.preventDefault();
    const payload = { ...newJob, user_id: demoUser?.id };
    if (!payload.expiration_date) payload.expiration_date = null;

    api.post('/community/job-offers/', payload)
      .then(res => {
        setJobOffers([res.data, ...jobOffers]);
        setShowJobForm(false);
        setNewJob({ title: '', company: '', description: '', requirements: '', location: '', job_type: 'full_time', expiration_date: '' });
      })
      .catch(console.error);
  };

  const handleUpdateEvent = (e, eventId) => {
    e.preventDefault();
    api.put(`/community/events/${eventId}/`, { ...editEvent, user_id: demoUser?.id })
      .then(res => {
        setEvents(events.map(ev => ev.id === eventId ? res.data : ev));
        setEditingEventId(null);
      })
      .catch(console.error);
  };

  const handleDeleteEvent = (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    api.delete(`/community/events/${eventId}/`)
      .then(() => {
        setEvents(events.filter(ev => ev.id !== eventId));
      })
      .catch(console.error);
  };

  const handleUpdateJob = (e, jobId) => {
    e.preventDefault();
    const payload = { ...editJob, user_id: demoUser?.id };
    if (!payload.expiration_date) payload.expiration_date = null;

    api.put(`/community/job-offers/${jobId}/`, payload)
      .then(res => {
        setJobOffers(jobOffers.map(job => job.id === jobId ? res.data : job));
        setEditingJobId(null);
      })
      .catch(console.error);
  };

  const handleDeleteJob = (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job offer?")) return;
    api.delete(`/community/job-offers/${jobId}/`)
      .then(() => {
        setJobOffers(jobOffers.filter(job => job.id !== jobId));
      })
      .catch(console.error);
  };

  const handleAnalyzeCV = (e) => {
    e.preventDefault();
    if (!cvText.trim()) return;
    setAnalysisLoading(true);
    setCurrentAnalysis(null);

    const payload = { cv_text: cvText, user_id: demoUser?.id };
    if (selectedJob) {
      payload.job_offer = selectedJob;
    }

    api.post('/community/cv-analysis/', payload)
      .then(res => {
        setCurrentAnalysis(res.data);
        setCvAnalyses([res.data, ...cvAnalyses]);
      })
      .catch(console.error)
      .finally(() => setAnalysisLoading(false));
  };

  const getProfilePicUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://127.0.0.1:8000${url}`;
  };

  const renderFeed = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={20} /> Create a Post
        </h3>
        <form onSubmit={handleCreatePost}>
          <textarea
            className="input-field"
            rows="3"
            placeholder="Share an update, ask a question, or post an article..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            style={{ resize: 'none', marginBottom: '1rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <input 
              id="post-media-input"
              type="file" 
              onChange={(e) => setNewPostMedia(e.target.files[0])} 
              style={{ fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={16} /> Post
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {posts.map(post => (
          <div key={post.id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative' }}>
            {/* Action buttons for author, admin, or teacher */}
            {(post.author_detail?.id === demoUser?.id || demoUser?.role === 'admin' || demoUser?.role === 'teacher') && editingPostId !== post.id && (
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                {demoUser?.role === 'teacher' && (
                  <button onClick={() => handleToggleValidate(post.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: post.validators?.some(v => v.id === demoUser.id) ? 'var(--success)' : 'var(--text-muted)' }} title={post.validators?.some(v => v.id === demoUser.id) ? "Devalidate Post" : "Validate Post"}>
                    <BadgeCheck size={18} fill={post.validators?.some(v => v.id === demoUser.id) ? "var(--success)" : "none"} color={post.validators?.some(v => v.id === demoUser.id) ? "white" : "currentColor"} />
                  </button>
                )}
                {post.author_detail?.id === demoUser?.id && (
                  <button onClick={() => { setEditingPostId(post.id); setEditPostContent(post.content); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Edit">
                    <Edit2 size={16} />
                  </button>
                )}
                {(post.author_detail?.id === demoUser?.id || demoUser?.role === 'admin') && (
                  <button onClick={() => handleDeletePost(post.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} title="Delete">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <img 
                src={getProfilePicUrl(post.author_detail?.profile_picture) || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author_detail?.first_name || 'U'}`} 
                alt="Profile" 
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
              />
              <div>
                <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {post.author_detail?.first_name} {post.author_detail?.last_name}
                  {post.author_detail?.role === 'admin' && (
                    <span style={{ background: 'var(--danger)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-sm)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
                      <BadgeCheck size={12} /> Admin
                    </span>
                  )}
                  {post.author_detail?.role === 'teacher' && (
                    <span style={{ background: 'var(--secondary)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-sm)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
                      <BadgeCheck size={12} /> TEACHER
                    </span>
                  )}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(post.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            
            {editingPostId === post.id ? (
              <form onSubmit={(e) => handleUpdatePost(e, post.id)}>
                <textarea
                  className="input-field"
                  rows="3"
                  value={editPostContent}
                  onChange={(e) => setEditPostContent(e.target.value)}
                  style={{ resize: 'vertical', marginBottom: '0.5rem', fontSize: '0.9rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setEditingPostId(null)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <X size={14} /> Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Check size={14} /> Save
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{post.content}</p>
                {post.media && (
                  <div style={{ marginTop: '0.5rem' }}>
                    {post.media.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                      <img src={getProfilePicUrl(post.media)} alt="Post Media" style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)' }} />
                    ) : (
                      <a href={getProfilePicUrl(post.media)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-hover)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                        <FileCheck size={18} /> View Attached Document
                      </a>
                    )}
                  </div>
                )}
                {post.validators?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#16a34a', fontWeight: 600, background: '#dcfce7', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', width: 'fit-content' }}>
                    <BadgeCheck size={18} fill="#16a34a" color="white" />
                    <span>Verified by: {post.validators.map(v => `${v.first_name} ${v.last_name}`).join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderEvents = () => (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Community Events</h2>
        {demoUser?.role === 'admin' && (
          <button onClick={() => setShowEventForm(!showEventForm)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {showEventForm ? <X size={16} /> : <Plus size={16} />} {showEventForm ? 'Cancel' : 'New Event'}
          </button>
        )}
      </div>

      {showEventForm && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Create New Event</h3>
          <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Event Title</label>
              <input type="text" required className="input-field" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Date and Time</label>
                <input type="datetime-local" required className="input-field" value={newEvent.event_date} onChange={e => setNewEvent({...newEvent, event_date: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Location (Optional)</label>
                <input type="text" className="input-field" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea rows="3" required className="input-field" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})}></textarea>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">Create Event</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {events.map(event => (
          <div key={event.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {demoUser?.role === 'admin' && editingEventId !== event.id && (
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => { 
                  setEditingEventId(event.id); 
                  setEditEvent({ 
                    title: event.title, 
                    description: event.description, 
                    event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '', 
                    location: event.location 
                  }); 
                }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Edit">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDeleteEvent(event.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {editingEventId === event.id ? (
              <form onSubmit={(e) => handleUpdateEvent(e, event.id)} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <input type="text" required className="input-field" value={editEvent.title} onChange={e => setEditEvent({...editEvent, title: e.target.value})} placeholder="Event Title" />
                <input type="datetime-local" required className="input-field" value={editEvent.event_date} onChange={e => setEditEvent({...editEvent, event_date: e.target.value})} />
                <input type="text" className="input-field" value={editEvent.location} onChange={e => setEditEvent({...editEvent, location: e.target.value})} placeholder="Location" />
                <textarea rows="2" required className="input-field" value={editEvent.description} onChange={e => setEditEvent({...editEvent, description: e.target.value})} placeholder="Description"></textarea>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setEditingEventId(null)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    <X size={14} /> Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    <Check size={14} /> Save
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--primary)', paddingRight: demoUser?.role === 'admin' ? '3rem' : '0' }}>{event.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CalendarIcon size={14} /> {new Date(event.event_date).toLocaleString()}
                </p>
                <p style={{ marginBottom: '1rem', flex: 1, fontSize: '0.95rem', lineHeight: 1.5 }}>{event.description}</p>
                {event.location && (
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: 'auto' }}>{event.location}</p>
                )}
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                  Organized by {event.author_detail?.first_name} {event.author_detail?.last_name}
                </p>
              </>
            )}
          </div>
        ))}
        {events.length === 0 && <p>No upcoming events.</p>}
      </div>
    </div>
  );

  const renderJobs = () => (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Job & Internship Offers</h2>
        {demoUser?.role === 'admin' && (
          <button onClick={() => setShowJobForm(!showJobForm)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {showJobForm ? <X size={16} /> : <Plus size={16} />} {showJobForm ? 'Cancel' : 'New Offer'}
          </button>
        )}
      </div>

      {showJobForm && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Create Job/Internship Offer</h3>
          <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Job Title</label>
                <input type="text" required className="input-field" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Company</label>
                <input type="text" required className="input-field" value={newJob.company} onChange={e => setNewJob({...newJob, company: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Location</label>
                <input type="text" required className="input-field" value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Job Type</label>
                <select className="input-field" value={newJob.job_type} onChange={e => setNewJob({...newJob, job_type: e.target.value})}>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Expiration Date (Optional)</label>
                <input type="date" className="input-field" value={newJob.expiration_date} onChange={e => setNewJob({...newJob, expiration_date: e.target.value})} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea rows="3" required className="input-field" value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})}></textarea>
            </div>
            <div className="input-group">
              <label className="input-label">Requirements</label>
              <textarea rows="2" required className="input-field" value={newJob.requirements} onChange={e => setNewJob({...newJob, requirements: e.target.value})}></textarea>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">Create Offer</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {jobOffers.map(job => (
          <div key={job.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
            {demoUser?.role === 'admin' && editingJobId !== job.id && (
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => { 
                  setEditingJobId(job.id); 
                  setEditJob({ 
                    title: job.title, 
                    company: job.company, 
                    description: job.description, 
                    requirements: job.requirements, 
                    location: job.location, 
                    job_type: job.job_type, 
                    expiration_date: job.expiration_date || '' 
                  }); 
                }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Edit">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDeleteJob(job.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {editingJobId === job.id ? (
              <form onSubmit={(e) => handleUpdateJob(e, job.id)} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input type="text" required className="input-field" value={editJob.title} onChange={e => setEditJob({...editJob, title: e.target.value})} placeholder="Job Title" />
                  <input type="text" required className="input-field" value={editJob.company} onChange={e => setEditJob({...editJob, company: e.target.value})} placeholder="Company" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <input type="text" required className="input-field" value={editJob.location} onChange={e => setEditJob({...editJob, location: e.target.value})} placeholder="Location" />
                  <select className="input-field" value={editJob.job_type} onChange={e => setEditJob({...editJob, job_type: e.target.value})}>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                  </select>
                  <input type="date" className="input-field" value={editJob.expiration_date} onChange={e => setEditJob({...editJob, expiration_date: e.target.value})} />
                </div>
                <textarea rows="2" required className="input-field" value={editJob.description} onChange={e => setEditJob({...editJob, description: e.target.value})} placeholder="Description"></textarea>
                <textarea rows="2" required className="input-field" value={editJob.requirements} onChange={e => setEditJob({...editJob, requirements: e.target.value})} placeholder="Requirements"></textarea>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setEditingJobId(null)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    <X size={14} /> Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    <Check size={14} /> Save
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: demoUser?.role === 'admin' ? '3rem' : '0' }}>
                  <div>
                    <h3 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>{job.title}</h3>
                    <p style={{ fontWeight: 600 }}>{job.company}</p>
                  </div>
                  <span className="badge" style={{ background: 'var(--primary)', color: 'white', textTransform: 'capitalize' }}>
                    {job.job_type.replace('_', ' ')}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{job.location} {job.expiration_date && `· Expires: ${job.expiration_date}`}</p>
                <p style={{ lineHeight: 1.6 }}>{job.description}</p>
                <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', marginTop: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem' }}>Requirements:</strong>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{job.requirements}</p>
                </div>
              </>
            )}
          </div>
        ))}
        {jobOffers.length === 0 && <p>No job offers available.</p>}
      </div>
    </div>
  );

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setCvFileName('');
      setCvText('');
      return;
    }
    setCvFileName(file.name);

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const typedarray = new Uint8Array(evt.target.result);
        try {
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          let text = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => item.str);
            text += strings.join(" ") + "\n";
          }
          setCvText(text);
        } catch (error) {
          console.error("Error extracting PDF text: ", error);
          alert("Error extracting text from PDF: " + (error.message || error));
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setCvText(evt.target.result);
      };
      reader.readAsText(file);
    }
  };

  const renderCVAnalyzer = () => (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      <div className="glass-panel" style={{ alignSelf: 'start' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileCheck size={24} /> AI CV Analyzer
        </h2>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Upload your CV file (.txt, .pdf) or paste the text below, and optionally select a job offer to see how well your profile matches the requirements.
        </p>
        <form onSubmit={handleAnalyzeCV}>
          <div className="input-group">
            <label className="input-label">Target Job Offer (Optional)</label>
            <select 
              className="input-field" 
              value={selectedJob} 
              onChange={(e) => setSelectedJob(e.target.value)}
            >
              <option value="">-- General Analysis --</option>
              {jobOffers.map(job => (
                <option key={job.id} value={job.id}>{job.title} at {job.company}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <button 
              type="button" 
              onClick={() => setCvInputMode('upload')} 
              style={{ background: 'none', border: 'none', fontSize: '0.95rem', fontWeight: cvInputMode === 'upload' ? 700 : 500, color: cvInputMode === 'upload' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', borderBottom: cvInputMode === 'upload' ? '2px solid var(--primary)' : '2px solid transparent', paddingBottom: '0.5rem', marginBottom: '-0.5rem' }}
            >
              Upload File
            </button>
            <button 
              type="button" 
              onClick={() => setCvInputMode('paste')} 
              style={{ background: 'none', border: 'none', fontSize: '0.95rem', fontWeight: cvInputMode === 'paste' ? 700 : 500, color: cvInputMode === 'paste' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', borderBottom: cvInputMode === 'paste' ? '2px solid var(--primary)' : '2px solid transparent', paddingBottom: '0.5rem', marginBottom: '-0.5rem' }}
            >
              Paste Text
            </button>
          </div>

          {cvInputMode === 'upload' && (
            <div className="input-group">
              <label className="input-label">Upload CV File (.txt, .pdf)</label>
              <input
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileUpload}
                className="input-field"
                style={{ cursor: 'pointer', padding: '0.5rem' }}
                required={!cvText}
              />
              {cvFileName && <p style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: '0.5rem', fontWeight: 500 }}>✅ Loaded: {cvFileName}</p>}
            </div>
          )}
          
          {cvInputMode === 'paste' && (
            <div className="input-group">
              <label className="input-label">Paste CV Content</label>
              <textarea
                className="input-field"
                rows="12"
                required={cvInputMode === 'paste'}
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder="Paste the text content of your resume here..."
                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={analysisLoading}>
            {analysisLoading ? 'Analyzing...' : 'Analyze My CV'}
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {currentAnalysis && (
          <div className="glass-panel" style={{ border: `2px solid ${currentAnalysis.score >= 70 ? 'var(--success)' : currentAnalysis.score >= 40 ? 'var(--warning)' : 'var(--danger)'}` }}>
            <h3 style={{ marginBottom: '1rem' }}>Analysis Results</h3>
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ 
                width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `8px solid ${currentAnalysis.score >= 70 ? 'var(--success)' : currentAnalysis.score >= 40 ? 'var(--warning)' : 'var(--danger)'}`,
                fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)'
              }}>
                {currentAnalysis.score}%
              </div>
              <p style={{ marginTop: '1rem', fontWeight: 600 }}>Match Score</p>
            </div>
            <div>
              <h4 style={{ marginBottom: '0.5rem' }}>Optimization Suggestions</h4>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: 'var(--text-muted)', background: 'var(--surface-hover)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                {currentAnalysis.suggestions}
              </p>
            </div>
          </div>
        )}

        {cvAnalyses.length > 0 && !currentAnalysis && (
          <div className="glass-panel">
            <h3 style={{ marginBottom: '1rem' }}>Recent Analyses</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {cvAnalyses.slice(0, 3).map(analysis => (
                <div key={analysis.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>Score: {analysis.score}%</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(analysis.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Target: {analysis.job_offer_detail ? analysis.job_offer_detail.title : 'General Analysis'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  switch (activeTab) {
    case 'feed': return renderFeed();
    case 'events': return renderEvents();
    case 'jobs': return renderJobs();
    case 'cvanalyzer': return renderCVAnalyzer();
    default: return renderFeed();
  }
}

export default CommunityDashboard;

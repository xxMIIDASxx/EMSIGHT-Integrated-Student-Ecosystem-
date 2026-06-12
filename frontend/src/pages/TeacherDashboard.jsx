import React, { useState, useEffect } from 'react';
import api from '../api';

function TeacherDashboard({ activeTab, demoUser }) {
  const [calendar, setCalendar] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [reportCards, setReportCards] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Grade Editing State
  const [editingRc, setEditingRc] = useState(null);
  const [editGrades, setEditGrades] = useState([]);

  // Class Grading State
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('S1');
  const [selectedEvalType, setSelectedEvalType] = useState('CC');
  const [selectedModule, setSelectedModule] = useState('');
  const [classGrades, setClassGrades] = useState({});
  const [bulkSuccess, setBulkSuccess] = useState(false);

  const teacherModules = React.useMemo(() => {
    if (!demoUser?.teacher_profile?.matiere) return [];
    try {
      const parsed = JSON.parse(demoUser.teacher_profile.matiere);
      return Array.isArray(parsed) ? parsed : [demoUser.teacher_profile.matiere];
    } catch {
      return [demoUser.teacher_profile.matiere];
    }
  }, [demoUser]);

  const teacherClasses = React.useMemo(() => {
    if (!demoUser?.teacher_profile?.classes) return [];
    try {
      const parsed = JSON.parse(demoUser.teacher_profile.classes);
      return Array.isArray(parsed) ? parsed : [demoUser.teacher_profile.classes];
    } catch {
      return [demoUser.teacher_profile.classes];
    }
  }, [demoUser]);

  useEffect(() => {
    if (teacherModules.length > 0 && !selectedModule) {
      setSelectedModule(teacherModules[0]);
    }
  }, [teacherModules, selectedModule]);

  const [selectedTimetableClass, setSelectedTimetableClass] = useState('');
  const [classSchedule, setClassSchedule] = useState([[], [], [], [], []]);

  useEffect(() => {
    if (teacherClasses.length > 0 && !selectedTimetableClass) {
      setSelectedTimetableClass(teacherClasses[0]);
    }
  }, [teacherClasses, selectedTimetableClass]);

  useEffect(() => {
    if (selectedTimetableClass) {
      api.get(`/portal/schedules/?target_class=${selectedTimetableClass}`).then(res => {
        if (res.data.length > 0) {
          const data = res.data[0].schedule_data;
          setClassSchedule(Array.isArray(data) && data.length === 5 ? data : [[], [], [], [], []]);
        } else {
          setClassSchedule([[], [], [], [], []]);
        }
      }).catch(() => {});
    }
  }, [selectedTimetableClass]);

  // Forms
  const [newEvent, setNewEvent] = useState({ title: '', description: '', start_time: '', end_time: '', event_type: 'Cours', target_classes: 'All Classes' });
  const [editingEvent, setEditingEvent] = useState(null);
  const [newNotif, setNewNotif] = useState({ title: '', content: '' });
  const [notifSuccess, setNotifSuccess] = useState(false);
  const [eventSuccess, setEventSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    api.get('/portal/calendar/').then(res => setCalendar(res.data));
    api.get('/portal/notifications/').then(res => setNotifications(res.data));
    api.get('/portal/absences/').then(res => setAbsences(res.data));
    api.get('/portal/report-cards/').then(res => setReportCards(res.data));
    api.get('/accounts/users/').then(res => {
      setStudents(res.data.filter(u => u.role === 'student'));
    });
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!demoUser) return;

    api.post('/portal/calendar/', {
      ...newEvent,
      created_by: demoUser.id,
      professor: demoUser.id
    }).then(() => {
      setNewEvent({ title: '', description: '', start_time: '', end_time: '', event_type: 'Cours', target_classes: 'All Classes' });
      setEventSuccess(true);
      setTimeout(() => setEventSuccess(false), 3000);
      fetchData();
    });
  };

  const handleDeleteEvent = (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      api.delete(`/portal/calendar/${id}/`).then(() => fetchData());
    }
  };

  const handleUpdateEvent = (e) => {
    e.preventDefault();
    api.patch(`/portal/calendar/${editingEvent.id}/`, editingEvent).then(() => {
      setEditingEvent(null);
      fetchData();
    });
  };

  const handleSendNotif = (e) => {
    e.preventDefault();
    if (!demoUser) return;

    const recipientIds = students.map(s => s.id);
    if (recipientIds.length === 0) {
      alert('No students found to notify.');
      return;
    }

    api.post('/portal/notifications/', {
      ...newNotif,
      type_notif: 'Info',
      sender: demoUser.id,
      recipients: recipientIds
    }).then(() => {
      setNewNotif({ title: '', content: '' });
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 3000);
      fetchData();
    }).catch(err => {
      console.error('Error sending notification:', err);
    });
  };

  const startEditingGrades = (rc) => {
    setEditingRc(rc);
    setEditGrades(rc.grades.map(g => ({ ...g })));
  };

  const handleGradeChange = (index, value) => {
    let val = parseFloat(value) || 0;
    if (val < 0) val = 0;
    if (val > 20) val = 20;
    const updated = [...editGrades];
    updated[index].value = val;
    setEditGrades(updated);
  };

  const saveGrades = () => {
    if (!editingRc) return;
    
    // In a real app, we would send multiple PATCH requests or a bulk update
    // Here we'll simulate by updating each grade
    const promises = editGrades.map(g => api.patch(`/portal/grades/${g.id}/`, { value: g.value }));
    
    Promise.all(promises).then(() => {
      // Recalculate average
      const avg = (editGrades.reduce((acc, g) => acc + g.value, 0) / editGrades.length).toFixed(2);
      api.patch(`/portal/report-cards/${editingRc.id}/`, { general_average: avg }).then(() => {
        setEditingRc(null);
        fetchData();
      });
    }).catch(err => alert("Error saving grades: " + err));
  };

  const handleClassGradeChange = (studentId, value) => {
    setClassGrades(prev => ({ ...prev, [studentId]: value }));
  };

  const submitClassGrades = () => {
    if (!selectedClass || !selectedModule) {
      alert('Please select a class and a module.');
      return;
    }
    const gradesArray = Object.keys(classGrades).map(id => ({
      student_id: parseInt(id),
      value: classGrades[id]
    })).filter(g => g.value !== '');

    if (gradesArray.length === 0) return;

    const payload = {
      module: selectedModule,
      academic_year: '2025-2026',
      semester: selectedSemester,
      subject: selectedModule,
      evaluation_type: selectedEvalType,
      grades: gradesArray
    };

    api.post('/portal/grades/bulk_submit_grades/', payload).then(() => {
      setBulkSuccess(true);
      setTimeout(() => setBulkSuccess(false), 3000);
      setClassGrades({});
      fetchData();
    }).catch(err => alert('Error submitting grades: ' + err));
  };

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel">
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{
            width: '120px', height: '120px', borderRadius: '50%',
            backgroundColor: 'rgba(16,185,129,0.1)', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid rgba(16,185,129,0.3)', flexShrink: 0
          }}>
            <img
              src={demoUser?.profile_picture ? (demoUser.profile_picture.startsWith('http') ? demoUser.profile_picture : `http://127.0.0.1:8000${demoUser.profile_picture}`) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${demoUser?.first_name || 'Teacher'}&top=${demoUser?.gender === 'F' ? 'longHair,bob,curly' : 'shortFlat,shortRound,sides'}&mouth=smile&eyebrows=default&eyes=default`}
              alt="Profile"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${demoUser?.first_name || 'T'}&backgroundColor=10B981&color=ffffff`;
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h2 style={{ marginBottom: '0.25rem' }}>
              {demoUser ? `${demoUser.first_name} ${demoUser.last_name}` : 'Teacher Profile'}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Teacher</p>
            {demoUser && demoUser.teacher_profile ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '0.875rem 1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Matricule</p>
                  <p style={{ fontWeight: 600, color: 'var(--primary)' }}>{demoUser.matricule}</p>
                </div>
                <div style={{ padding: '0.875rem 1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</p>
                  <p style={{ fontWeight: 600 }}>{demoUser.teacher_profile.departement}</p>
                </div>
                <div style={{ padding: '0.875rem 1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Modules</p>
                  <p style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {teacherModules.length > 0 ? teacherModules.join(', ') : 'Not Assigned'}
                  </p>
                </div>
                <div style={{ padding: '0.875rem 1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</p>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{demoUser.email}</p>
                </div>
              </div>
            ) : <p>Loading...</p>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{students.length}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Students</p>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--secondary)' }}>{calendar.length}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Events Scheduled</p>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>
            {notifications.filter(n => demoUser && n.sender === demoUser.id).length}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Notifications Sent</p>
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayColors = ['rgba(79, 70, 229, 0.15)', 'rgba(245, 158, 11, 0.15)', 'rgba(239, 68, 68, 0.15)', 'rgba(16, 185, 129, 0.15)', 'rgba(59, 130, 246, 0.15)'];
    const dayBorders = ['#4F46E5', '#F59E0B', '#EF4444', '#10B981', '#3B82F6'];
    const hasSchedule = classSchedule.some(day => day.length > 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>Class Timetables</h2>
            {teacherClasses.length > 0 && (
              <select className="input-field" style={{ width: 'auto' }} value={selectedTimetableClass} onChange={e => setSelectedTimetableClass(e.target.value)}>
                {teacherClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
          
          {teacherClasses.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
              <p style={{ color: 'var(--text-muted)' }}>You have no classes assigned. Contact an administrator to link classes to your profile.</p>
            </div>
          ) : hasSchedule ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              {days.map((day, idx) => (
                <div key={day} style={{ border: `1px solid ${dayBorders[idx]}30`, borderTop: `3px solid ${dayBorders[idx]}`, borderRadius: 'var(--radius-md)', padding: '1rem', background: dayColors[idx], minHeight: '150px' }}>
                  <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: dayBorders[idx], fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{day}</h4>
                  {classSchedule[idx] && classSchedule[idx].map((s, i) => (
                    <div key={i} style={{ padding: '0.5rem', background: 'var(--surface)', marginBottom: '0.5rem', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: `3px solid ${dayBorders[idx]}` }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: dayBorders[idx] }}>{s.time}</p>
                      <p style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: 'var(--text-main)' }}>{s.name}</p>
                    </div>
                  ))}
                  {(!classSchedule[idx] || classSchedule[idx].length === 0) && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>No slots</p>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
              <p style={{ color: 'var(--text-muted)' }}>No timetable has been published for {selectedTimetableClass} yet.</p>
            </div>
          )}
        </div>

        <div className="glass-panel">
          <h2 style={{ marginBottom: '1.5rem' }}>Scheduled Events</h2>
          {editingEvent ? (
            <div style={{ padding: '1.5rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)', marginBottom: '2rem' }}>
              <h3>Edit Event</h3>
              <form onSubmit={handleUpdateEvent} style={{ marginTop: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group"><label className="input-label">Title</label><input type="text" className="input-field" value={editingEvent.title} onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} /></div>
                  <div className="input-group"><label className="input-label">Description</label><input type="text" className="input-field" value={editingEvent.description} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} /></div>
                  <div className="input-group"><label className="input-label">Type</label><select className="input-field" value={editingEvent.event_type} onChange={e => setEditingEvent({...editingEvent, event_type: e.target.value})}><option value="Cours">Cours</option><option value="TD">TD</option><option value="Examen">Examen</option></select></div>
                  <div className="input-group"><label className="input-label">Target Class(es)</label><input type="text" className="input-field" value={editingEvent.target_classes || ''} onChange={e => setEditingEvent({...editingEvent, target_classes: e.target.value})} /></div>
                  <div className="input-group"><label className="input-label">Start</label><input type="datetime-local" className="input-field" value={editingEvent.start_time.slice(0, 16)} onChange={e => setEditingEvent({...editingEvent, start_time: e.target.value})} /></div>
                  <div className="input-group"><label className="input-label">End</label><input type="datetime-local" className="input-field" value={editingEvent.end_time.slice(0, 16)} onChange={e => setEditingEvent({...editingEvent, end_time: e.target.value})} /></div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary">Update Event</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingEvent(null)}>Cancel</button>
                </div>
              </form>
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {calendar.map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: ev.event_type === 'Examen' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                  {ev.event_type === 'Examen' ? 'EX' : ev.event_type === 'TD' ? 'TD' : 'CR'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600 }}>{ev.title} <span style={{ fontSize: '0.75rem', fontWeight: 400, marginLeft: '0.5rem', background: 'var(--surface-hover)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{ev.target_classes}</span></p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ev.description}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>{new Date(ev.start_time).toLocaleDateString()}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setEditingEvent(ev)}>Edit</button>
                  <button className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDeleteEvent(ev.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel">
          <h2 style={{ marginBottom: '1.5rem' }}>Add Calendar Event</h2>
          {eventSuccess && <div style={{ padding: '0.875rem', background: 'rgba(16,185,129,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '1rem', color: 'var(--primary)' }}>Event added successfully!</div>}
          <form onSubmit={handleAddEvent}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}><label className="input-label">Title</label><input type="text" className="input-field" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} required /></div>
              <div className="input-group"><label className="input-label">Type</label><select className="input-field" value={newEvent.event_type} onChange={e => setNewEvent({ ...newEvent, event_type: e.target.value })}><option value="Cours">Cours</option><option value="TD">TD</option><option value="Examen">Examen</option></select></div>
              <div className="input-group"><label className="input-label">Target Class(es)</label><input type="text" className="input-field" placeholder="e.g. 1A_IIR or All Classes" value={newEvent.target_classes} onChange={e => setNewEvent({ ...newEvent, target_classes: e.target.value })} /></div>
              <div className="input-group"><label className="input-label">Start</label><input type="datetime-local" className="input-field" value={newEvent.start_time} onChange={e => setNewEvent({ ...newEvent, start_time: e.target.value })} required /></div>
              <div className="input-group"><label className="input-label">End</label><input type="datetime-local" className="input-field" value={newEvent.end_time} onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })} required /></div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Add Event</button>
          </form>
        </div>
      </div>
    );
  };

  const renderNotifications = () => {
    const sentByMe = notifications.filter(n => demoUser && n.sender === demoUser.id);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel">
          <h2>Send Notification</h2>
          {notifSuccess && <div style={{ padding: '0.875rem', background: 'rgba(16,185,129,0.1)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', color: 'var(--primary)' }}>Notification sent!</div>}
          <form onSubmit={handleSendNotif}>
            <div className="input-group"><label className="input-label">Title</label><input type="text" className="input-field" value={newNotif.title} onChange={e => setNewNotif({ ...newNotif, title: e.target.value })} required /></div>
            <div className="input-group"><label className="input-label">Message</label><textarea className="input-field" rows={4} value={newNotif.content} onChange={e => setNewNotif({ ...newNotif, content: e.target.value })} required></textarea></div>
            <button type="submit" className="btn btn-primary">Send to All Students</button>
          </form>
        </div>
        <div className="glass-panel">
          <h2>Sent History</h2>
          {sentByMe.map(n => (
            <div key={n.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
              <h4>{n.title}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{n.content}</p>
              <small>{new Date(n.date_envoi).toLocaleString()}</small>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGrades = () => {
    const uniqueClasses = [...new Set(students.map(s => s.student_profile?.filiere).filter(Boolean))];
    const studentsInClass = students.filter(s => s.student_profile?.filiere === selectedClass);

    // Filter report cards by tutor name matching teacher's full name
    const teacherName = `${demoUser?.first_name} ${demoUser?.last_name}`;
    const myTutoredStudents = reportCards.filter(rc => rc.student_details?.student_profile?.tutor_name === teacherName);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel">
          <h2 style={{ marginBottom: '1.5rem' }}>Enter Grades by Class</h2>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Modules: <strong style={{ color: 'var(--primary)' }}>{teacherModules.length > 0 ? teacherModules.join(', ') : 'Not Assigned'}</strong>
            </p>
          </div>
          
          {bulkSuccess && (
            <div style={{ padding: '0.875rem', background: 'rgba(16,185,129,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '1.5rem', color: 'var(--success)' }}>
              Grades submitted successfully for {selectedClass}!
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div className="input-group">
              <label className="input-label">Select Module</label>
              <select className="input-field" value={selectedModule} onChange={e => setSelectedModule(e.target.value)}>
                {teacherModules.map(mod => <option key={mod} value={mod}>{mod}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Select Class</label>
              <select className="input-field" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                <option value="">-- Choose a Class --</option>
                {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Semester</label>
              <select className="input-field" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
                <option value="S1">Semester 1 (S1)</option>
                <option value="S2">Semester 2 (S2)</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Evaluation Type</label>
              <select className="input-field" value={selectedEvalType} onChange={e => setSelectedEvalType(e.target.value)}>
                <option value="CC">CC (Contrôle Continu)</option>
                <option value="Examen">Examen Final</option>
              </select>
            </div>
          </div>

          {selectedClass && (
            <div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Matricule</th><th>Student Name</th><th>Grade (/20)</th></tr>
                  </thead>
                  <tbody>
                    {studentsInClass.map(student => (
                      <tr key={student.id}>
                        <td style={{ width: '20%' }}>{student.matricule}</td>
                        <td style={{ width: '40%' }}>{student.first_name} {student.last_name}</td>
                        <td style={{ width: '40%' }}>
                          <input 
                            type="number" 
                            className="input-field" 
                            style={{ width: '100px', padding: '0.4rem 0.75rem' }} 
                            step="0.25" min="0" max="20"
                            placeholder="Ex: 15.5"
                            value={classGrades[student.id] !== undefined ? classGrades[student.id] : ''}
                            onChange={e => handleClassGradeChange(student.id, e.target.value)} 
                          />
                        </td>
                      </tr>
                    ))}
                    {studentsInClass.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No students found in this class.</td></tr>}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={submitClassGrades}>Submit Grades for {selectedClass}</button>
            </div>
          )}
        </div>

        <div className="glass-panel">
          <h2 style={{ marginBottom: '1.5rem' }}>Manage General Averages (Tutored Students)</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Showing students where you are assigned as Tutor.</p>
        
        {editingRc ? (
          <div style={{ padding: '1.5rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)' }}>
            <h3>Editing Grades for {editingRc.student_details?.first_name} {editingRc.student_details?.last_name}</h3>
            <p style={{ marginBottom: '1.5rem' }}>{editingRc.academic_year} - {editingRc.semester}</p>
            {editGrades.map((g, idx) => (
              <div key={g.id} className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                <span style={{ flex: 1, fontWeight: 500 }}>{g.subject}</span>
                <input type="number" step="0.25" min="0" max="20" className="input-field" style={{ width: '100px' }} value={g.value} onChange={e => handleGradeChange(idx, e.target.value)} />
                <span style={{ color: 'var(--text-muted)' }}>/20</span>
              </div>
            ))}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={saveGrades}>Save Changes</button>
              <button className="btn btn-secondary" onClick={() => setEditingRc(null)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Student</th><th>Year</th><th>Semester</th><th>Average</th><th>Action</th></tr>
              </thead>
              <tbody>
                {myTutoredStudents.map(rc => (
                  <tr key={rc.id}>
                    <td>{rc.student_details?.first_name} {rc.student_details?.last_name}</td>
                    <td>{rc.academic_year}</td>
                    <td>{rc.semester}</td>
                    <td><span style={{ color: rc.general_average >= 10 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{rc.general_average}</span></td>
                    <td><button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => startEditingGrades(rc)}>Edit</button></td>
                  </tr>
                ))}
                {myTutoredStudents.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No tutored students found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    );
  };

  switch (activeTab) {
    case 'calendar': return renderCalendar();
    case 'notifications': return renderNotifications();
    case 'grades': return renderGrades();
    default: return renderOverview();
  }
}

export default TeacherDashboard;

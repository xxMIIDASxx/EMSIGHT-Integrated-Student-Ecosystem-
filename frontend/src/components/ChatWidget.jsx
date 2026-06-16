import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Check, CheckCheck, Paperclip, FileText, Image as ImageIcon, Trash2, Ban } from 'lucide-react';
import api from '../api';

const ChatWidget = ({ demoUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [seenIds, setSeenIds] = useState(new Set());
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchUsers = () => {
    api.get('/accounts/users/')
      .then(res => {
        const allowed = res.data.filter(u => u.id !== demoUser?.id && u.role !== 'teacher');
        setUsers(allowed);
      })
      .catch(console.error);
  };

  const fetchMessages = () => {
    api.get('/community/messages/')
      .then(res => setMessages(res.data))
      .catch(err => {
        console.error(err);
        if (err.response?.status === 500) {
          alert('Database error! Please make sure you have visited /api/run-migrations/ in your browser to create the Message table.');
        }
      });
  };

  useEffect(() => {
    fetchMessages();
    const bgInterval = setInterval(fetchMessages, 10000);
    return () => clearInterval(bgInterval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredMessages = selectedUser ? messages.filter(m => {
    const isMe = m.sender?.id === demoUser?.id;
    if (isMe && m.deleted_by_sender) return false;
    if (!isMe && m.deleted_by_receiver) return false;
    return (m.sender?.id === demoUser?.id && m.receiver === selectedUser.id) ||
           (m.sender?.id === selectedUser.id && m.receiver === demoUser?.id);
  }) : [];

  const handleDeleteMessage = (msgId, type) => {
    api.post(`/community/messages/${msgId}/delete_message/`, { user_id: demoUser.id, type })
      .then(() => {
        fetchMessages();
        setDeletingMessageId(null);
      })
      .catch(console.error);
  };

  useEffect(() => {
    scrollToBottom();
    if (selectedUser && isOpen) {
      const incomingIds = filteredMessages
        .filter(m => m.sender?.id === selectedUser.id && !seenIds.has(m.id))
        .map(m => m.id);

      if (incomingIds.length > 0) {
        setSeenIds(prev => new Set([...prev, ...incomingIds]));
        incomingIds.forEach(id => {
          api.patch(`/community/messages/${id}/`, { is_read: true }).catch(() => {});
        });
      }
    }
  }, [messages, selectedUser, isOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!selectedUser || (!newMessage.trim() && !attachment) || !demoUser) return;

    const formData = new FormData();
    formData.append('sender_id', demoUser.id);
    formData.append('receiver_id', selectedUser.id);
    if (newMessage.trim()) {
      formData.append('content', newMessage);
    }
    if (attachment) {
      formData.append('attachment', attachment);
    }

    // Since we are sending FormData, Axios will automatically set the Content-Type to multipart/form-data
    api.post('/community/messages/', formData).then(() => {
      setNewMessage('');
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchMessages();
    }).catch(err => {
      console.error(err);
      alert('Error sending message: ' + (err.response?.data?.error || err.message));
    });
  };

  const unreadCount = (userId) =>
    messages.filter(m =>
      m.sender?.id === userId &&
      m.receiver === demoUser?.id &&
      !m.is_read &&
      !seenIds.has(m.id)
    ).length;

  const totalUnread = users.reduce((sum, u) => sum + unreadCount(u.id), 0);

  const initials = (u) => `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase();
  const avatarColor = (role) => role === 'admin' ? '#8B5CF6' : '#10B981';

  return (
    <>
      <button
        className={`chat-widget-btn ${isOpen ? 'chat-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 16px rgba(16,185,129,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)',
          transition: 'transform 0.2s',
        }}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && totalUnread > 0 && (
          <div style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#EF4444',
            color: 'white',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            fontSize: '0.72rem',
            fontWeight: '700',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite',
          }}>
            {totalUnread > 9 ? '9+' : totalUnread}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="chat-widget-window" style={{
          background: 'white',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease forwards',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #10B981, #059669)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: 'white',
            flexShrink: 0
          }}>
            <MessageCircle size={20} />
            <span style={{ fontWeight: '700' }}>Community Chat</span>
            {selectedUser && (
              <span style={{ marginLeft: 'auto', marginRight: '0.5rem', fontSize: '0.85rem', opacity: 0.9 }}>
                {selectedUser.first_name} {selectedUser.last_name}
              </span>
            )}
            <button className="chat-mobile-close" onClick={() => setIsOpen(false)} style={!selectedUser ? { marginLeft: 'auto' } : {}}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <div style={{
              width: selectedUser ? '70px' : '100%',
              background: '#f8fafc',
              borderRight: '1px solid #e2e8f0',
              overflowY: 'auto',
              transition: 'width 0.25s ease',
              flexShrink: 0
            }}>
              {users.map(u => {
                const unread = unreadCount(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    style={{
                      padding: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      borderBottom: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      background: selectedUser?.id === u.id ? 'rgba(16,185,129,0.1)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: avatarColor(u.role), color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '600', fontSize: '0.9rem'
                      }}>
                        {initials(u)}
                      </div>
                      {unread > 0 && (
                        <div style={{
                          position: 'absolute', top: '-2px', right: '-2px',
                          background: '#EF4444', color: 'white', width: '16px', height: '16px',
                          borderRadius: '50%', fontSize: '0.6rem', fontWeight: '700',
                          border: '2px solid white', display: 'flex', alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {unread}
                        </div>
                      )}
                    </div>
                    {!selectedUser && (
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {u.first_name} {u.last_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {u.role}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedUser ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {filteredMessages.length === 0 ? (
                    <div style={{ margin: 'auto', color: '#94a3b8', fontSize: '0.83rem', textAlign: 'center', lineHeight: '1.6' }}>
                      No messages yet.<br/>Say hi to {selectedUser.first_name}!
                    </div>
                  ) : (
                    filteredMessages.map(m => {
                      const isMe = m.sender?.id === demoUser?.id;
                      const isRead = m.is_read || seenIds.has(m.id);
                      return (
                        <div key={m.id} style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '82%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          position: 'relative'
                        }}>
                          <div style={{
                            background: m.deleted_for_everyone ? 'transparent' : (isMe ? 'linear-gradient(135deg, #10B981, #059669)' : '#f1f5f9'),
                            color: m.deleted_for_everyone ? '#94a3b8' : (isMe ? 'white' : '#1e293b'),
                            padding: '0.55rem 0.85rem',
                            borderRadius: '14px',
                            borderBottomRightRadius: isMe ? '3px' : '14px',
                            borderBottomLeftRadius: isMe ? '14px' : '3px',
                            border: m.deleted_for_everyone ? '1px dashed #cbd5e1' : 'none',
                            fontSize: '0.88rem',
                            lineHeight: '1.45',
                            wordBreak: 'break-word',
                            fontStyle: m.deleted_for_everyone ? 'italic' : 'normal'
                          }}>
                            {m.deleted_for_everyone ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Ban size={14} />
                                <span>This message was deleted</span>
                              </div>
                            ) : (
                              <>
                                {m.attachment && (
                                  <div style={{ marginBottom: m.content ? '0.5rem' : '0' }}>
                                    {m.attachment.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                      <a href={m.attachment} target="_blank" rel="noopener noreferrer">
                                        <img src={m.attachment} alt="attachment" style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '150px', objectFit: 'cover' }} />
                                      </a>
                                    ) : (
                                      <a href={m.attachment} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'inherit', textDecoration: 'none', background: 'rgba(0,0,0,0.05)', padding: '6px 10px', borderRadius: '8px', maxWidth: '100%' }}>
                                        <FileText size={16} style={{ flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.8rem', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {decodeURIComponent(m.attachment.split('/').pop().split('?')[0])}
                                        </span>
                                      </a>
                                    )}
                                  </div>
                                )}
                                {m.content && <div>{m.content}</div>}
                              </>
                            )}
                          </div>
                          <div style={{
                            fontSize: '0.68rem',
                            color: '#94a3b8',
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isMe && (
                              isRead ? <CheckCheck size={13} color="#10B981" /> : <Check size={13} color="#94a3b8" />
                            )}
                            <button 
                              onClick={() => setDeletingMessageId(deletingMessageId === m.id ? null : m.id)}
                              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: '4px', padding: 0, display: 'flex', alignItems: 'center' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {deletingMessageId === m.id && (
                            <div style={{
                              position: 'absolute',
                              background: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              padding: '4px',
                              zIndex: 10,
                              top: '100%',
                              marginTop: '4px',
                              right: isMe ? '0' : 'auto',
                              left: isMe ? 'auto' : '0',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              minWidth: '130px'
                            }}>
                              <button onClick={() => handleDeleteMessage(m.id, 'me')} style={{ textAlign: 'left', padding: '8px 10px', background: 'none', border: 'none', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '4px', color: '#1e293b' }} onMouseEnter={e => e.currentTarget.style.background='#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background='none'}>
                                Delete for me
                              </button>
                              {isMe && (
                                <button onClick={() => handleDeleteMessage(m.id, 'everyone')} style={{ textAlign: 'left', padding: '8px 10px', background: 'none', border: 'none', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '4px', color: '#ef4444' }} onMouseEnter={e => e.currentTarget.style.background='#fee2e2'} onMouseLeave={e => e.currentTarget.style.background='none'}>
                                  Delete for everyone
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid #e2e8f0', background: 'white', flexShrink: 0 }}>
                  {attachment && (
                    <div style={{ padding: '0.4rem 0.75rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                      <Paperclip size={14} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment.name}</span>
                      <button type="button" onClick={() => setAttachment(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} style={{
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={e => setAttachment(e.target.files[0])}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem', borderRadius: '50%', transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Paperclip size={18} />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder={`Message ${selectedUser.first_name}...`}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.875rem',
                        borderRadius: '20px',
                        border: '1.5px solid #e2e8f0',
                        fontSize: '0.88rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={e => e.target.style.borderColor = '#10B981'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() && !attachment}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: (newMessage.trim() || attachment) ? 'linear-gradient(135deg, #10B981, #059669)' : '#e2e8f0',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: (newMessage.trim() || attachment) ? 'pointer' : 'not-allowed',
                        transition: 'background 0.2s, transform 0.15s'
                      }}
                    >
                      <Send size={16} style={{ marginLeft: '-2px', marginTop: '2px' }} />
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                Select a contact to chat
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;

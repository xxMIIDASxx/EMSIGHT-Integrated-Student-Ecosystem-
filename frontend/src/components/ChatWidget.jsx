import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Check, CheckCheck } from 'lucide-react';
import api from '../api';

const ChatWidget = ({ demoUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [seenIds, setSeenIds] = useState(new Set());
  const messagesEndRef = useRef(null);

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

  const filteredMessages = selectedUser ? messages.filter(m =>
    (m.sender?.id === demoUser?.id && m.receiver === selectedUser.id) ||
    (m.sender?.id === selectedUser.id && m.receiver === demoUser?.id)
  ) : [];

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
    if (!selectedUser || !newMessage.trim() || !demoUser) return;

    api.post('/community/messages/', {
      sender_id: demoUser.id,
      receiver_id: selectedUser.id,
      content: newMessage
    }).then(() => {
      setNewMessage('');
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
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
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
          zIndex: 1000,
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
        <div style={{
          position: 'fixed',
          bottom: '5.5rem',
          right: '2rem',
          width: '380px',
          height: '540px',
          background: 'white',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 999,
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
              <span style={{ marginLeft: 'auto', fontSize: '0.85rem', opacity: 0.9 }}>
                {selectedUser.first_name} {selectedUser.last_name}
              </span>
            )}
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
                          gap: '2px'
                        }}>
                          <div style={{
                            background: isMe ? 'linear-gradient(135deg, #10B981, #059669)' : '#f1f5f9',
                            color: isMe ? 'white' : '#1e293b',
                            padding: '0.55rem 0.85rem',
                            borderRadius: '14px',
                            borderBottomRightRadius: isMe ? '3px' : '14px',
                            borderBottomLeftRadius: isMe ? '14px' : '3px',
                            fontSize: '0.88rem',
                            lineHeight: '1.45',
                            wordBreak: 'break-word'
                          }}>
                            {m.content}
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
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} style={{
                  padding: '0.75rem',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  gap: '0.5rem',
                  flexShrink: 0
                }}>
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
                    disabled={!newMessage.trim()}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: newMessage.trim() ? 'linear-gradient(135deg, #10B981, #059669)' : '#e2e8f0',
                      color: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                      transition: 'background 0.2s, transform 0.15s'
                    }}
                  >
                    <Send size={16} style={{ marginLeft: '-2px', marginTop: '2px' }} />
                  </button>
                </form>
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

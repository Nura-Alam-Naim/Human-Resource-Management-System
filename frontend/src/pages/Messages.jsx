import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PageHeader from '../components/PageHeader';
import { Send, MessageSquare, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import './Messages.scss'; // We'll create this file next

const Messages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get('user_id');

  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // The otherId we are chatting with
  const [chatHistory, setChatHistory] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [isNewMessageMode, setIsNewMessageMode] = useState(false);
  const [selectedContact, setSelectedContact] = useState('');
  const messagesEndRef = useRef(null);

  // Poll intervals
  const pollingInterval = useRef(null);

  useEffect(() => {
    fetchConversationsAndContacts();
    
    // Set up polling for new messages every 5 seconds
    pollingInterval.current = setInterval(() => {
      fetchConversationsSilently();
      if (activeChat) {
        fetchChatHistorySilently(activeChat);
      }
    }, 5000);

    return () => clearInterval(pollingInterval.current);
  }, [activeChat]);

  // When initialUserId is provided from query params (e.g., clicking "Message" from another page)
  useEffect(() => {
    if (initialUserId && contacts.length > 0) {
      // Find if we already have a conversation with this user
      const existingConv = conversations.find(c => c.id.toString() === initialUserId);
      if (existingConv) {
        openChat(initialUserId);
      } else {
        // Start a new message mode with this user selected
        setIsNewMessageMode(true);
        setSelectedContact(initialUserId);
      }
    }
  }, [initialUserId, contacts]);

  const fetchConversationsAndContacts = async () => {
    try {
      setLoadingConv(true);
      const [convRes, contactRes] = await Promise.all([
        axios.get('/api/messages/conversations'),
        axios.get('/api/messages/contacts')
      ]);
      setConversations(convRes.data);
      setContacts(contactRes.data);
    } catch (error) {
      console.error("Error fetching messages data", error);
    } finally {
      setLoadingConv(false);
    }
  };

  const fetchConversationsSilently = async () => {
    try {
      const res = await axios.get('/api/messages/conversations');
      setConversations(res.data);
    } catch (error) {}
  };

  const openChat = async (otherId) => {
    setActiveChat(otherId);
    setIsNewMessageMode(false);
    setLoadingChat(true);
    await fetchChatHistorySilently(otherId);
    setLoadingChat(false);
    
    // Mark as read
    try {
      await axios.put(`/api/messages/${otherId}/read`);
      // Update local unread count
      setConversations(prev => prev.map(c => c.id === otherId ? { ...c, unread_count: 0 } : c));
    } catch (error) {}
  };

  const fetchChatHistorySilently = async (otherId) => {
    try {
      const res = await axios.get(`/api/messages/${otherId}`);
      setChatHistory(res.data);
      scrollToBottom();
    } catch (error) {}
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const receiverId = isNewMessageMode ? selectedContact : activeChat;
    if (!receiverId) {
      toast.error("Please select a recipient.");
      return;
    }

    try {
      await axios.post('/api/messages', {
        receiver_id: receiverId,
        message: newMessage
      });
      setNewMessage('');
      
      if (isNewMessageMode) {
        setIsNewMessageMode(false);
        openChat(receiverId);
      } else {
        fetchChatHistorySilently(activeChat);
      }
      fetchConversationsSilently();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  };

  const getRoleColor = (role) => {
    if (role === 'admin') return '#ef4444'; // Red for admin
    if (role === 'manager') return '#8b5cf6'; // Purple for manager
    return 'var(--primary-color)'; // Default blue for employee
  };

  const renderActiveChatHeader = () => {
    if (isNewMessageMode) {
      return (
        <div className="chat-header" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
          <div className="w-full form-group mb-0">
            <select 
              className="form-control"
              value={selectedContact}
              onChange={(e) => setSelectedContact(e.target.value)}
            >
              <option value="">Select someone to message...</option>
              {contacts.map(c => {
                const jobInfo = [c.department_name, c.designation_title].filter(Boolean).join(' - ');
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} {jobInfo ? `— ${jobInfo}` : ''} ({c.role})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      );
    }

    const currentConv = conversations.find(c => c.id === activeChat) || contacts.find(c => c.id === activeChat);
    if (!currentConv) return null;

    return (
      <div className="chat-header" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
        <div className="flex items-center gap-3">
          <div className="avatar-circle small">
            {currentConv.profile_picture ? (
              <img src={`http://localhost:8800/${currentConv.profile_picture}`} alt="" />
            ) : (
              <UserIcon size={16} />
            )}
          </div>
          <div>
            <h4 className="m-0 font-medium" style={{ color: getRoleColor(currentConv.role) }}>{currentConv.name}</h4>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {[currentConv.department || currentConv.department_name, currentConv.designation || currentConv.designation_title].filter(Boolean).join(' - ')}
              {currentConv.role ? ` (${currentConv.role})` : ''}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const isChatInputDisabled = () => {
    if (user.role !== 'admin') return false;
    
    // Check chat history. If ANY admin has replied, but it's NOT the current admin, disable input.
    const adminReplies = chatHistory.filter(m => m.sender_role === 'admin' && m.target_role !== 'admin');
    if (adminReplies.length > 0) {
      const firstReplierId = adminReplies[0].sender_id;
      if (firstReplierId !== user.id) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="dashboard-container">
      <PageHeader 
        title="Internal Messages" 
        subtitle="Communicate securely with your team and administration."
      />

      <div className="chat-layout card p-0 overflow-hidden">
        {/* Left Pane - Conversations List */}
        <div className="chat-sidebar border-r flex flex-col" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--background-color)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <button 
              className="btn btn-primary w-full flex justify-center items-center gap-2"
              onClick={() => {
                setIsNewMessageMode(true);
                setActiveChat(null);
                setChatHistory([]);
              }}
            >
              <MessageSquare size={16} /> New Message
            </button>
          </div>
          
          <div className="conversations-list flex-1 overflow-y-auto">
            {loadingConv ? (
              <div className="flex justify-center p-4"><div className="spinner"></div></div>
            ) : conversations.length === 0 ? (
              <div className="text-center p-6 text-gray-400 text-sm">
                No active conversations yet.
              </div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.id} 
                  className={`conversation-item ${activeChat === conv.id && !isNewMessageMode ? 'active' : ''}`}
                  onClick={() => openChat(conv.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm truncate" style={{ color: getRoleColor(conv.role) }}>{conv.name}</span>
                    {conv.unread_count > 0 && (
                      <span className="badge badge-primary rounded-full px-2 text-xs">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] truncate mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {[conv.department, conv.designation].filter(Boolean).join(' - ')} {conv.role ? `(${conv.role})` : ''}
                  </div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-color)', opacity: 0.8 }}>{conv.latest_message}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane - Active Chat Area */}
        <div className="chat-area flex flex-col" style={{ backgroundColor: 'var(--card-bg)' }}>
          {!activeChat && !isNewMessageMode ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare size={48} className="mb-4 text-gray-200" />
              <p>Select a conversation or start a new message.</p>
            </div>
          ) : (
            <>
              {renderActiveChatHeader()}
              
              <div className="chat-history flex-1 overflow-y-auto p-4" style={{ backgroundColor: 'var(--background-color)' }}>
                {loadingChat ? (
                  <div className="flex justify-center p-4"><div className="spinner"></div></div>
                ) : chatHistory.length === 0 && !isNewMessageMode ? (
                  <div className="text-center p-6 text-gray-400 text-sm">
                    No messages yet. Send a message to start the conversation!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatHistory.map(msg => {
                      const isMe = msg.sender_id === user.id;
                      return (
                        <div key={msg.id} className={`message-bubble-wrapper ${isMe ? 'sent' : 'received'}`}>
                          {!isMe && (
                            <div className="avatar-circle xs mt-1">
                              {msg.sender_avatar ? (
                                <img src={`http://localhost:8800/${msg.sender_avatar}`} alt="" />
                              ) : (
                                <UserIcon size={12} />
                              )}
                            </div>
                          )}
                          <div 
                            className={`message-bubble ${isMe ? 'bg-primary text-white' : ''}`} 
                            style={!isMe ? { 
                              backgroundColor: 'var(--card-bg)', 
                              border: '1px solid var(--border-color)', 
                              borderLeft: `4px solid ${getRoleColor(msg.sender_role)}`,
                              color: 'var(--text-color)' 
                            } : {}}
                          >
                            {!isMe && (
                              <div className="text-xs font-semibold mb-1" style={{ color: getRoleColor(msg.sender_role) }}>
                                {msg.sender_name}
                              </div>
                            )}
                            <div className="message-text whitespace-pre-wrap">{msg.message}</div>
                            <div className={`message-time text-[10px] mt-1 text-right`} style={{ color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)' }}>
                              {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="chat-input-area border-t p-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                {isChatInputDisabled() ? (
                  <div className="text-center text-sm text-gray-500 py-2">
                    This conversation has been claimed by another administrator.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                    <textarea 
                      className="form-control flex-1 resize-none"
                      rows="2"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    ></textarea>
                    <button 
                      type="submit" 
                      className="btn btn-primary h-auto py-3 px-4"
                      disabled={!newMessage.trim() || (isNewMessageMode && !selectedContact)}
                    >
                      <Send size={18} />
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '../components/PageHeader';
import { Send, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ receiver_id: '', message: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const msgs = await axios.get('/api/messages');
      setMessages(msgs.data);
      
      if (user.role === 'admin' || user.role === 'manager') {
        const endpoint = user.role === 'manager' ? '/api/manager/team/users?limit=1000' : '/api/admin/leaves/users?limit=1000';
        const usersRes = await axios.get(endpoint);
        setUsers(usersRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching messages", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/messages', formData);
      toast.success("Message sent successfully!");
      setFormData({ receiver_id: '', message: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  };

  return (
    <div className="dashboard-container">
      <PageHeader 
        title="Internal Messages" 
        subtitle="Communicate with your team regarding attendance and leaves."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(user.role === 'admin' || user.role === 'manager') && (
          <div className="md:col-span-1">
            <div className="card p-4">
              <h3 className="mb-4">Send Message</h3>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="form-group">
                <label>To Employee</label>
                <select 
                  className="form-control"
                  required
                  value={formData.receiver_id}
                  onChange={e => setFormData({...formData, receiver_id: e.target.value})}
                >
                  <option value="">Select an employee...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea 
                  className="form-control"
                  rows="4"
                  required
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  placeholder="Type your message here..."
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary w-full flex justify-center align-center gap-2">
                <Send size={16} /> Send Message
              </button>
            </form>
          </div>
        </div>
        )}

        <div className={user.role === 'employee' ? "md:col-span-3" : "md:col-span-2"}>
          <div className="card p-4">
            <h3 className="mb-4">My Inbox</h3>
            {loading ? (
              <div className="flex justify-center p-4"><div className="spinner"></div></div>
            ) : messages.length === 0 ? (
              <div className="text-center text-secondary p-8 border border-dashed rounded bg-gray-50">
                <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
                <p>Your inbox is empty.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={`p-4 rounded border ${!msg.is_read ? 'border-primary bg-blue-50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold">{msg.sender_name}</span>
                        <span className="text-xs ml-2 bg-gray-200 px-2 py-1 rounded text-gray-700">{msg.sender_role}</span>
                      </div>
                      <span className="text-xs text-secondary">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="m-0 text-gray-800 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;

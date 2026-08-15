import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Clock } from 'lucide-react';
import './ActivityLog.scss';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/admin/leaves/logs');
        setLogs(res.data);
      } catch (error) {
        console.error("Error fetching logs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex justify-center mt-4 mb-4"><div className="spinner spinner-sm"></div></div>;
  }

  if (logs.length === 0) {
    return <div className="text-center text-secondary p-4">No activity logs found.</div>;
  }

  return (
    <div className="activity-log-container">
      <h3><Activity size={18} /> System Activity Log</h3>
      <div className="log-list">
        {logs.map(log => (
          <div key={log.id} className="log-item">
            <div className="log-icon">
              <Clock size={16} />
            </div>
            <div className="log-content">
              <div className="log-header">
                <span className="log-action">{log.action}</span>
                <span className="log-time">{formatDate(log.created_at)}</span>
              </div>
              <div className="log-details">
                {log.details}
                {log.target_name && (
                  <span className="log-target"> &middot; Target: {log.target_name}</span>
                )}
              </div>
              <div className="log-performer">
                By: <span style={{ color: log.performer_role === 'manager' ? '#3b82f6' : (log.performer_role === 'employee' ? '#10b981' : 'inherit') }}>
                  {log.performer_name || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;

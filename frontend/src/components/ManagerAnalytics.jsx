import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, Clock, CheckCircle } from 'lucide-react';
import './ManagerAnalytics.scss';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const ManagerAnalytics = ({ onStatClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({
    total_employees: 0,
    pending_requests: 0,
    approved_requests: 0,
    leave_distribution: [],
    leave_status_distribution: [],
    worktime_stats: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const endpoint = user.role === 'manager' ? '/api/manager/team/analytics' : '/api/admin/leaves/analytics';
        const res = await axios.get(endpoint);
        setData(res.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="flex justify-center mt-2 mb-2"><div className="spinner"></div></div>;

  return (
    <div className="analytics-container">
      <div className="stats-grid">
        <div className="stat-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/all-employees')}>
          <div className="stat-icon users-icon"><Users size={24} /></div>
          <div className="stat-details">
            <span className="stat-value">{data.total_employees}</span>
            <span className="stat-label">Total Employees</span>
          </div>
        </div>
        <div className="stat-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => onStatClick && onStatClick('pending')}>
          <div className="stat-icon pending-icon"><Clock size={24} /></div>
          <div className="stat-details">
            <span className="stat-value">{data.pending_requests}</span>
            <span className="stat-label">Pending Requests</span>
          </div>
        </div>
        <div className="stat-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => onStatClick && onStatClick('approved')}>
          <div className="stat-icon approved-icon"><CheckCircle size={24} /></div>
          <div className="stat-details">
            <span className="stat-value">{data.approved_requests}</span>
            <span className="stat-label">Approved Leaves</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {data.leave_distribution && data.leave_distribution.length > 0 && (
          <div className="chart-card">
            <h4>Leave Distribution</h4>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.leave_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.leave_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {data.leave_status_distribution && data.leave_status_distribution.length > 0 && (
          <div className="chart-card">
            <h4>Leave Statuses</h4>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.leave_status_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.leave_status_distribution.map((entry, index) => {
                      let color = COLORS[index % COLORS.length];
                      if (entry.name === 'approved') color = '#10b981';
                      if (entry.name === 'pending' || entry.name === 'pending_manager' || entry.name === 'pending_hr') color = '#f59e0b';
                      if (entry.name === 'rejected') color = '#ef4444';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {data.worktime_stats && data.worktime_stats.length > 0 && (
        <div className="chart-card mt-6">
          <h4>Weekly Work Time (Avg Hours)</h4>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.worktime_stats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="avg_hours" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Average Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerAnalytics;

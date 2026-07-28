import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Clock, CheckCircle } from 'lucide-react';
import './ManagerAnalytics.scss';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const ManagerAnalytics = () => {
  const [data, setData] = useState({
    total_employees: 0,
    pending_requests: 0,
    approved_requests: 0,
    leave_distribution: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('/api/admin/leaves/analytics');
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
        <div className="stat-card">
          <div className="stat-icon users-icon"><Users size={24} /></div>
          <div className="stat-details">
            <span className="stat-value">{data.total_employees}</span>
            <span className="stat-label">Total Employees</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending-icon"><Clock size={24} /></div>
          <div className="stat-details">
            <span className="stat-value">{data.pending_requests}</span>
            <span className="stat-label">Pending Requests</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon approved-icon"><CheckCircle size={24} /></div>
          <div className="stat-details">
            <span className="stat-value">{data.approved_requests}</span>
            <span className="stat-label">Approved Leaves</span>
          </div>
        </div>
      </div>

      {data.leave_distribution.length > 0 && (
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
    </div>
  );
};

export default ManagerAnalytics;

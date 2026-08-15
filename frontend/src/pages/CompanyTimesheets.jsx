import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '../components/PageHeader';
import { Calendar, Clock, User } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import EmployeeProfileView from '../components/EmployeeProfileView';

const CompanyTimesheets = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await axios.get('/api/attendance/all');
        setRecords(res.data);
      } catch (error) {
        console.error("Error fetching company timesheets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const viewUserProfile = async (userId) => {
    try {
      const res = await axios.get(`/api/admin/leaves/users/${userId}`);
      setSelectedUser(res.data);
      setIsProfileModalOpen(true);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  const calculateHours = (start, end) => {
    if (!start || !end) return '-';
    const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
    return diff.toFixed(1) + ' hrs';
  };

  return (
    <div className="dashboard-container">
      <PageHeader
        title="Company Attendance"
        subtitle="Monitor daily attendance and clock-ins across the organization."
      />

      {loading ? (
        <div className="flex justify-center mt-8 mb-8"><div className="spinner"></div></div>
      ) : (
        <div className="tables-wrapper flex flex-col gap-8">
          
          <div className="card">
            <div className="card-header p-4 border-b">
              <h3 className="m-0 text-lg font-semibold">Managers</h3>
            </div>
            <div className="table-container">
              <TimesheetTable records={records.filter(r => r.role === 'manager')} viewUserProfile={viewUserProfile} calculateHours={calculateHours} formatDate={formatDate} formatTime={formatTime} />
            </div>
          </div>

          <div className="card">
            <div className="card-header p-4 border-b">
              <h3 className="m-0 text-lg font-semibold">Employees</h3>
            </div>
            <div className="table-container">
              <TimesheetTable records={records.filter(r => r.role === 'employee')} viewUserProfile={viewUserProfile} calculateHours={calculateHours} formatDate={formatDate} formatTime={formatTime} />
            </div>
          </div>

        </div>
      )}

      <Modal
        isOpen={isProfileModalOpen && !!selectedUser}
        onClose={() => { setIsProfileModalOpen(false); setSelectedUser(null); }}
        title="Employee Profile & Work History"
        size="large"
      >
        <EmployeeProfileView data={selectedUser} onUpdate={() => { viewUserProfile(selectedUser.user.id); }} />
      </Modal>
    </div>
  );
};

const TimesheetTable = ({ records, viewUserProfile, calculateHours, formatDate, formatTime }) => {
  if (records.length === 0) {
    return <div className="text-center p-4 text-gray-500">No attendance records found in this category.</div>;
  }

  return (
    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Date</th>
          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Employee</th>
          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Department</th>
          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Clock In</th>
          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Clock Out</th>
          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Total Hours</th>
          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => (
          <tr key={record.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
            <td style={{ padding: '16px' }}>
              <span className="font-medium">{formatDate(record.date)}</span>
            </td>
            <td style={{ padding: '16px' }}>
              <div 
                className="flex items-center gap-2 cursor-pointer transition-colors"
                style={{ padding: '4px', borderRadius: '4px' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => viewUserProfile(record.user_id)}
                title="View worktime history"
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={12} color="#3b82f6" />
                </div>
                <span className="font-medium">{record.employee_name}</span>
                {record.status === 'present' && record.clock_out && (
                  calculateHours(record.clock_in, record.clock_out).replace(' hrs', '') >= 8 ? 
                  <span style={{ fontSize: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', padding: '2px 6px', borderRadius: '4px' }}>Meeting Req</span> : 
                  <span style={{ fontSize: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error-color)', padding: '2px 6px', borderRadius: '4px' }}>Action Req</span>
                )}
              </div>
            </td>
            <td style={{ padding: '16px' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{record.department_name || 'N/A'}</span>
            </td>
            <td style={{ padding: '16px' }}>
              <div className="flex items-center gap-2">
                <Clock size={14} color="var(--success-color)" />
                <span>{formatTime(record.clock_in)}</span>
              </div>
            </td>
            <td style={{ padding: '16px' }}>
              <div className="flex items-center gap-2">
                <Clock size={14} color="var(--error-color)" />
                <span>{formatTime(record.clock_out)}</span>
              </div>
            </td>
            <td style={{ padding: '16px' }}>
              <span className="font-mono">{calculateHours(record.clock_in, record.clock_out)}</span>
            </td>
            <td style={{ padding: '16px' }}>
              <StatusBadge status={record.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
export default CompanyTimesheets;

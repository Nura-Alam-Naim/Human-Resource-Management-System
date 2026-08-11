import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, User as UserIcon, FileText, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import DateRange from '../components/DateRange';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import ManagerAnalytics from '../components/ManagerAnalytics';
import ActivityLog from '../components/ActivityLog';
import CreateUserForm from '../components/CreateUserForm';
import EmployeeProfileView from '../components/EmployeeProfileView';
import MemberRequests from '../components/MemberRequests';
import './ManagerDashboard.scss';

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 10;

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/leaves/all-requests?page=${page}&limit=${limit}&search=${searchTerm}`);
      setRequests(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Error fetching all requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, searchTerm]);

  const handleUpdateStatus = async (id, status) => {
    if (window.confirm(`Are you sure you want to ${status} this request?`)) {
      try {
        await axios.put(`/api/admin/leaves/update-status/${id}`, { status });
        toast.success(`Request ${status} successfully!`);
        fetchRequests();
      } catch (error) {
        toast.error(error.response?.data?.message || `Error updating status to ${status}`);
      }
    }
  };

  const viewUserProfile = async (userId) => {
    try {
      const res = await axios.get(`/api/admin/leaves/users/${userId}`);
      setSelectedUser(res.data);
      setIsProfileModalOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching user profile.");
    }
  };

  return (
    <div className="dashboard-container">
      <PageHeader
        title="Global Administration"
        subtitle="Manage company-wide settings, leaves, and users."
        action={
          <button className="btn btn-primary flex align-center gap-2" onClick={() => setIsCreateModalOpen(true)}>
            <UserPlus size={18} /> Create User
          </button>
        }
      />

      <div className="mb-8">
        <MemberRequests />
      </div>

      <ManagerAnalytics onStatClick={(term) => {
        setSearchTerm(term);
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }} />

      <div className="card manager-history-card">
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <input
            type="text"
            placeholder="Search requests by name, reason, or status..."
            className="w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Details</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    <div className="flex justify-center mt-2 mb-2"><div className="spinner spinner-sm"></div></div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">No leave requests found matching your criteria.</td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req.id}>
                    <td>
                      <div
                        className="employee-cell cursor-pointer"
                        onClick={() => viewUserProfile(req.user_id)}
                        title="Click to view profile"
                      >
                        <div className="avatar">
                          <UserIcon size={16} />
                        </div>
                        <span className="font-medium employee-name">{req.employee_name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="details-cell">
                        <span className="type-label">{req.type_name}</span>
                        <DateRange start={req.start_date} end={req.end_date} />
                      </div>
                    </td>
                    <td>
                      <div className="reason-cell">
                        <FileText size={14} className="icon" />
                        <span className="truncate" title={req.reason}>{req.reason}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={req.status} />
                    </td>
                    <td>
                      {req.status === 'pending' ? (
                        <div className="action-buttons">
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'approved')}
                            className="btn btn-success btn-sm"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'rejected')}
                            className="btn btn-danger btn-sm"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">No actions available</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <ActivityLog />

      <Modal
        isOpen={isProfileModalOpen && !!selectedUser}
        onClose={() => { setIsProfileModalOpen(false); setSelectedUser(null); }}
        title="Employee Profile"
        size="large"
      >
        <EmployeeProfileView data={selectedUser} onUpdate={() => { viewUserProfile(selectedUser.user.id); fetchRequests(); }} />
      </Modal>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User"
      >
        <CreateUserForm onSuccess={() => setIsCreateModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default AdminDashboard;

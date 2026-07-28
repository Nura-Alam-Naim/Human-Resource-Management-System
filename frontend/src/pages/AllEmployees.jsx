import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User as UserIcon, Mail, Calendar, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import EmployeeProfileView from '../components/EmployeeProfileView';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import './AllEmployees.scss';

const AllEmployees = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/leaves/users?page=${page}&limit=${limit}&search=${searchTerm}`);
      setUsers(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm]);

  const viewUserProfile = async (userId) => {
    try {
      const res = await axios.get(`/api/admin/leaves/users/${userId}`);
      setSelectedUser(res.data);
      setIsProfileModalOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching user profile.");
    }
  };

  // search and filtering is now handled server-side

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="dashboard-container">
      <PageHeader
        title="All Employees"
        subtitle={`${users.length} total users in the system.`}
      />

      <div className="card search-card">
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Email</th>
                <th>Role</th>
                <th>Leave Balance</th>
                <th>Leaves Taken</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center">
                    <div className="flex justify-center mt-2 mb-2"><div className="spinner spinner-sm"></div></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">No employees found.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div
                        className="employee-cell cursor-pointer"
                        onClick={() => viewUserProfile(user.id)}
                        title="Click to view full profile"
                      >
                        <div className="avatar">
                          <UserIcon size={16} />
                        </div>
                        <span className="font-medium employee-name">{user.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="email-cell">
                        <Mail size={14} className="icon" />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className="role-text">{user.role}</span>
                    </td>
                    <td>
                      <span className="balance-cell">{user.total_leave_balance} days</span>
                    </td>
                    <td>
                      <span className="taken-cell">{user.total_leaves_taken} days</span>
                    </td>
                    <td>
                      <span className="date-text">
                        {formatDate(user.created_at)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal
        isOpen={isProfileModalOpen && !!selectedUser}
        onClose={() => { setIsProfileModalOpen(false); setSelectedUser(null); }}
        title="Employee Profile"
        size="large"
      >
        <EmployeeProfileView data={selectedUser} />
      </Modal>
    </div>
  );
};

export default AllEmployees;

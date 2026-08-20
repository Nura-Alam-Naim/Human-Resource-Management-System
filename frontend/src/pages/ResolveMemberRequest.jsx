import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { User, CheckCircle, ArrowLeft, Building, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const ResolveMemberRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [reqRes, usersRes] = await Promise.all([
          axios.get(`/api/requests/member/${id}`),
          axios.get('/api/admin/leaves/users?limit=1000')
        ]);
        setRequest(reqRes.data);
        setAllUsers(usersRes.data.data);
      } catch (error) {
        toast.error('Failed to load data.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAssignEmployee = async (employeeId) => {
    if (!window.confirm("Are you sure you want to assign this employee to the department?")) return;

    try {
      // 1. Assign employee to the new department
      await axios.put(`/api/admin/leaves/users/${employeeId}/department`, { 
        department_id: request.department_id 
      });
      
      // 2. Mark the request as approved
      await axios.put(`/api/requests/member/${id}`, { status: 'approved' });
      
      toast.success(`Employee assigned and request resolved!`);
      navigate('/settings'); // Redirect back to settings or dashboard
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to resolve request.");
    }
  };

  if (loading) {
    return <div className="flex justify-center mt-10"><div className="spinner"></div></div>;
  }

  if (!request) {
    return <div className="text-center p-10 text-gray-500">Request not found.</div>;
  }

  // Filter users who are NOT already in the target department AND are not admins
  const eligibleUsers = allUsers.filter(u => u.department_id !== request.department_id && u.role !== 'admin');
  
  // Filter by search term
  const filteredUsers = eligibleUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <button 
        className="btn btn-outline btn-sm mb-4 flex items-center gap-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <PageHeader 
        title="Resolve Member Request"
        subtitle="Select an employee to fulfill the manager's request."
      />

      <div className="card mb-8 border-indigo-500">
        <div className="p-6 bg-indigo-50 rounded-t-lg border-b border-indigo-100 flex gap-4 items-start">
          <div className="bg-indigo-100 p-3 rounded-full mt-1">
            <UserPlus className="text-indigo-600" size={24} />
          </div>
          <div>
            <h3 className="m-0 text-xl font-bold text-indigo-900">Request from {request.manager_name}</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-indigo-800">
              <div>
                <strong><Building size={14} className="inline mr-1"/> Department:</strong> {request.department_name}
              </div>
              <div>
                <strong>Role Needed:</strong> {request.requested_role}
              </div>
              <div className="md:col-span-2 bg-white p-3 rounded border border-indigo-100 shadow-sm mt-2">
                <strong>Justification:</strong> {request.description || 'No specific justification provided.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header p-4 border-b flex justify-between items-center">
          <h3 className="m-0 font-semibold">Select Employee to Assign</h3>
          <input 
            type="text" 
            placeholder="Search employees..." 
            className="form-control max-w-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="table-container p-0">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No employees match your search.</div>
          ) : (
            <table className="m-0">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Current Department</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar-circle" style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                          {user.profile_picture ? (
                            <img src={`http://localhost:8800/${user.profile_picture}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <User size={16} />
                          )}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="text-gray-600">{user.email}</td>
                    <td>{user.department_name || 'Unassigned'}</td>
                    <td>
                      <span className={`badge ${user.role === 'manager' ? 'badge-primary' : 'badge-secondary'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-success btn-sm flex items-center gap-1"
                        onClick={() => handleAssignEmployee(user.id)}
                      >
                        <CheckCircle size={14} /> Select for Department
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default ResolveMemberRequest;

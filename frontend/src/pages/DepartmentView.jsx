import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { Building, User, Users, ArrowLeft, Check, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';

const DepartmentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingManager, setIsEditingManager] = useState(false);
  const [managerFormId, setManagerFormId] = useState('');
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [addEmployeeId, setAddEmployeeId] = useState('');

  const fetchDepartmentData = async () => {
    try {
      setLoading(true);
      const [deptRes, usersRes] = await Promise.all([
        axios.get(`/api/departments/${id}`),
        axios.get('/api/admin/leaves/users?limit=1000')
      ]);
      setData(deptRes.data);
      setAllUsers(usersRes.data.data);
      setManagerFormId(deptRes.data.department.manager_id || '');
    } catch (error) {
      toast.error('Failed to load department details.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentData();
  }, [id]);

  const handleUpdateManager = async () => {
    try {
      await axios.put(`/api/departments/${id}`, { 
        name: data.department.name, 
        manager_id: managerFormId 
      });
      toast.success('Department manager updated successfully.');
      setIsEditingManager(false);
      fetchDepartmentData();
    } catch (error) {
      toast.error('Failed to update manager.');
    }
  };

  const handleAddEmployee = async () => {
    if (!addEmployeeId) return toast.error('Please select an employee.');
    try {
      // Update the user's department
      await axios.put(`/api/admin/leaves/users/${addEmployeeId}/department`, { department_id: id });
      toast.success('Employee added to department successfully.');
      setIsAddingEmployee(false);
      setAddEmployeeId('');
      fetchDepartmentData();
    } catch (error) {
      toast.error('Failed to add employee to department.');
    }
  };

  const handleTransferRequest = async (requestId, status) => {
    try {
      await axios.put(`/api/departments/transfer-requests/${requestId}/status`, { status });
      toast.success(`Request ${status} successfully!`);
      fetchDepartmentData();
    } catch (error) {
      toast.error(`Failed to ${status} request.`);
    }
  };

  const handleMemberRequest = async (requestId, status) => {
    try {
      await axios.put(`/api/requests/member/${requestId}`, { status });
      toast.success(`Request ${status} successfully!`);
      fetchDepartmentData();
    } catch (error) {
      toast.error(`Failed to update request.`);
    }
  };

  if (loading) {
    return <div className="flex justify-center mt-10"><div className="spinner"></div></div>;
  }

  if (!data) return <div>Department not found.</div>;

  const { department, employees, transferRequests, memberRequests } = data;

  return (
    <div className="dashboard-container">
      <button 
        className="btn btn-outline btn-sm mb-4 flex items-center gap-2"
        onClick={() => navigate('/settings')}
      >
        <ArrowLeft size={16} /> Back to Settings
      </button>

      <PageHeader 
        title={`Department: ${department.name}`}
        subtitle="Manage department details, employees, and transfer requests."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card col-span-1 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-100 p-3 rounded-full">
              <Building className="text-indigo-600" size={24} />
            </div>
            <div>
              <h3 className="m-0 text-xl font-bold">{department.name}</h3>
              <p className="text-gray-500 m-0 text-sm">Created {new Date(department.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">Department Manager</h4>
            {isEditingManager ? (
              <div className="flex flex-col gap-2">
                <select 
                  className="form-control"
                  value={managerFormId}
                  onChange={(e) => setManagerFormId(e.target.value)}
                >
                  <option value="">-- No Manager --</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button className="btn btn-primary btn-sm flex-1" onClick={handleUpdateManager}>Save</button>
                  <button className="btn btn-outline btn-sm flex-1" onClick={() => setIsEditingManager(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-500" />
                  <span className="font-medium">{department.manager_name || 'Not Assigned'}</span>
                </div>
                <button 
                  className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                  onClick={() => setIsEditingManager(true)}
                >
                  Change
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card col-span-2">
          <div className="card-header p-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-gray-500" />
              <h3 className="m-0 font-semibold">Current Employees</h3>
            </div>
            <button 
              className="btn btn-outline btn-sm flex items-center gap-1"
              onClick={() => setIsAddingEmployee(!isAddingEmployee)}
            >
              <Plus size={14} /> Add
            </button>
          </div>
          
          {isAddingEmployee && (
            <div className="p-4 border-b flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Select Employee</label>
                <select 
                  className="form-control"
                  value={addEmployeeId}
                  onChange={(e) => setAddEmployeeId(e.target.value)}
                >
                  <option value="">-- Choose Employee --</option>
                  {allUsers.filter(u => u.department_id !== parseInt(id)).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleAddEmployee}>Add</button>
              <button className="btn btn-outline" onClick={() => setIsAddingEmployee(false)}>Cancel</button>
            </div>
          )}

          <div className="table-container p-0">
            {employees.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No employees assigned to this department.</div>
            ) : (
              <table className="m-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Designation</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id}>
                      <td className="font-medium">{emp.name}</td>
                      <td className="text-gray-600">{emp.email}</td>
                      <td>
                        <span className={`badge ${emp.role === 'manager' ? 'badge-primary' : 'badge-secondary'}`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="text-gray-600">{emp.designation_title || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="card border-red-500">
        <div className="card-header p-4 border-b flex justify-between items-center">
          <h3 className="m-0 font-semibold text-red-500">Pending Transfer Requests</h3>
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {transferRequests.length} Pending
          </span>
        </div>
        <div className="table-container p-0">
          {transferRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No pending transfer requests for this department.</div>
          ) : (
            <table className="m-0">
              <thead>
                <tr>
                  <th>Requested Date</th>
                  <th>Requested By</th>
                  <th>Employee to Transfer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transferRequests.map(req => (
                  <tr key={req.id}>
                    <td>{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="font-medium">{req.requester_name}</td>
                    <td className="font-medium text-indigo-600">{req.employee_name}</td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-success btn-sm flex items-center gap-1"
                          onClick={() => handleTransferRequest(req.id, 'approved')}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button 
                          className="btn btn-danger btn-sm flex items-center gap-1"
                          onClick={() => handleTransferRequest(req.id, 'rejected')}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card border-indigo-500 mt-6">
        <div className="card-header p-4 border-b flex justify-between items-center">
          <h3 className="m-0 font-semibold text-indigo-600">Pending Member Requests</h3>
          <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {memberRequests?.length || 0} Pending
          </span>
        </div>
        <div className="table-container p-0">
          {(!memberRequests || memberRequests.length === 0) ? (
            <div className="p-8 text-center text-gray-500">No pending member requests for this department.</div>
          ) : (
            <table className="m-0">
              <thead>
                <tr>
                  <th>Requested Date</th>
                  <th>Requested By</th>
                  <th>Role Needed</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {memberRequests.map(req => (
                  <tr key={req.id}>
                    <td>{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="font-medium">{req.manager_name}</td>
                    <td className="font-medium text-indigo-600">{req.requested_role}</td>
                    <td className="text-gray-600 text-sm">{req.description || 'N/A'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-primary btn-sm flex items-center gap-1"
                          onClick={() => navigate(`/resolve-request/${req.id}`)}
                        >
                          <Check size={14} /> Resolve
                        </button>
                        <button 
                          className="btn btn-danger btn-sm flex items-center gap-1"
                          onClick={() => handleMemberRequest(req.id, 'rejected')}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
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

export default DepartmentView;

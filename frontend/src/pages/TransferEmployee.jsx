import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const TransferEmployee = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [transferringId, setTransferringId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, deptRes] = await Promise.all([
        axios.get('/api/admin/leaves/users?limit=1000'),
        axios.get('/api/departments')
      ]);
      setUsers(usersRes.data.data);
      setDepartments(deptRes.data);
    } catch (error) {
      toast.error('Failed to load data for transfers.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransfer = async (userId, targetDeptId) => {
    if (!targetDeptId) {
      return toast.error("Please select a target department first.");
    }
    
    setTransferringId(userId);
    try {
      await axios.put(`/api/admin/leaves/users/${userId}/department`, { 
        department_id: targetDeptId 
      });
      toast.success("Employee transferred successfully!");
      fetchData(); // Refresh list to show new department
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to transfer employee");
    } finally {
      setTransferringId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center mt-10"><div className="spinner"></div></div>;
  }

  const filteredUsers = users.filter(u => 
    u.role !== 'admin' &&
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="mt-8">
      <div className="card border-t-4 border-green-500">
        <div className="card-header p-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="m-0 text-lg font-semibold text-gray-800">Global Employee Transfer</h3>
            <p className="m-0 text-sm text-gray-500">Quickly reassign employees to different departments</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1 border rounded-md">
            <Search size={16} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search employee..." 
              className="border-none outline-none text-sm p-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container p-0">
          <table className="m-0">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Email</th>
                <th>Current Role</th>
                <th>Current Department</th>
                <th>Transfer To</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td className="font-medium">{user.name}</td>
                  <td className="text-gray-600">{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'manager' ? 'badge-primary' : (user.role === 'admin' ? 'badge-danger' : 'badge-secondary')}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="font-medium text-indigo-600">
                    {user.department_name || 'Unassigned'}
                  </td>
                  <td>
                    <select 
                      className="form-control form-control-sm"
                      id={`dept-select-${user.id}`}
                      defaultValue=""
                    >
                      <option value="" disabled>-- Select New Dept --</option>
                      {departments.map(dept => (
                        <option 
                          key={dept.id} 
                          value={dept.id}
                          disabled={dept.id === user.department_id}
                        >
                          {dept.name} {dept.id === user.department_id ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button 
                      className="btn btn-primary btn-sm flex items-center gap-1"
                      disabled={transferringId === user.id}
                      onClick={() => {
                        const selectEl = document.getElementById(`dept-select-${user.id}`);
                        handleTransfer(user.id, selectEl.value);
                      }}
                    >
                      <RefreshCw size={14} className={transferringId === user.id ? "animate-spin" : ""} />
                      {transferringId === user.id ? 'Moving...' : 'Transfer'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-gray-500">No employees found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransferEmployee;

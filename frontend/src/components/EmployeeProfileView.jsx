import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Edit2, Save, X } from 'lucide-react';
import StatusBadge from './StatusBadge';
import DateRange from './DateRange';

const EmployeeProfileView = ({ data, onUpdate }) => {
  if (!data) return null;
  const { user: loggedInUser } = useAuth();
  const { user, history } = data;
  
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [designations, setDesignations] = useState([]);
  const [selectedDesignation, setSelectedDesignation] = useState(user.designation_id || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditingRole && designations.length === 0) {
      fetchDesignations();
    }
  }, [isEditingRole]);

  const fetchDesignations = async () => {
    try {
      // If manager, fetch team designations. If admin, maybe all designations?
      // Since admin can also view this, let's use the team designations endpoint for managers.
      // If admin, we would hit /api/designations. But wait, we can just use the user's department to fetch designations if admin.
      let endpoint = '';
      if (loggedInUser.role === 'manager') {
        endpoint = '/api/manager/team/designations';
      } else if (loggedInUser.role === 'admin') {
        endpoint = `/api/designations/department/${user.department_id}`;
      }
      
      if (endpoint) {
        const res = await axios.get(endpoint);
        setDesignations(res.data);
      }
    } catch (error) {
      console.error("Error fetching designations", error);
      toast.error("Failed to load roles");
    }
  };

  const handleSaveRole = async () => {
    setLoading(true);
    try {
      const endpoint = loggedInUser.role === 'manager' 
        ? `/api/manager/team/users/${user.id}/designation`
        : `/api/admin/leaves/users/${user.id}/designation`;
      
      await axios.put(endpoint, { designation_id: selectedDesignation });
      toast.success("Role updated successfully!");
      setIsEditingRole(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to update role");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <div className="profile-details-grid">
        <div className="profile-detail">
          <span className="label">Name</span>
          <span className="value">{user.name}</span>
        </div>
        <div className="profile-detail">
          <span className="label">Email</span>
          <span className="value">{user.email}</span>
        </div>
        <div className="profile-detail">
          <span className="label">Working Role</span>
          <span className="value flex align-center gap-2">
            {!isEditingRole ? (
              <>
                <span>{user.designation_title || 'Unassigned'}</span>
                {(loggedInUser.role === 'manager' || loggedInUser.role === 'admin') && (
                  <button className="btn btn-outline btn-sm" onClick={() => setIsEditingRole(true)} title="Change Working Role">
                    <Edit2 size={14} />
                  </button>
                )}
              </>
            ) : (
              <div className="flex gap-2 w-full">
                <select 
                  className="form-control form-control-sm w-full"
                  value={selectedDesignation}
                  onChange={(e) => setSelectedDesignation(e.target.value)}
                >
                  <option value="">-- Select Role --</option>
                  {designations.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
                <button className="btn btn-success btn-sm" onClick={handleSaveRole} disabled={loading} title="Save Role">
                  <Save size={14} />
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => setIsEditingRole(false)} title="Cancel">
                  <X size={14} />
                </button>
              </div>
            )}
          </span>
        </div>
        <div className="profile-detail">
          <span className="label">System Access</span>
          <span className="value"><StatusBadge status="approved" /> {user.role.toUpperCase()}</span>
        </div>
        <div className="profile-detail">
          <span className="label">Leave Balance</span>
          <span className="value balance-highlight">{user.total_leave_balance} Days</span>
        </div>
      </div>

      <div className="user-history-section">
        <h4>Leave History</h4>
        {history.length === 0 ? (
          <p className="text-muted">No history found for this employee.</p>
        ) : (
          <table className="compact-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Dates</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(req => (
                <tr key={req.id}>
                  <td>{req.type_name}</td>
                  <td>
                    <DateRange start={req.start_date} end={req.end_date} />
                  </td>
                  <td>
                    <span
                      className="truncate text-secondary text-sm"
                      title={req.reason}
                    >
                      {req.reason}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={req.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default EmployeeProfileView;

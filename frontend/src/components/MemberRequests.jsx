import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from './StatusBadge';

const MemberRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/requests/member');
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching member requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdate = async (id, status) => {
    if (window.confirm(`Are you sure you want to ${status} this request?`)) {
      try {
        await axios.put(`/api/requests/member/${id}`, { status });
        toast.success(`Request ${status} successfully!`);
        fetchRequests();
      } catch (error) {
        toast.error("Error updating request");
      }
    }
  };

  if (loading) {
    return <div className="card p-6 flex justify-center"><div className="spinner"></div></div>;
  }

  if (requests.length === 0) {
    return null; // Don't show anything if no requests exist
  }

  return (
    <div className="card">
      <div className="p-4 border-b border-[var(--border-color)] flex align-center gap-2">
        <UserPlus size={18} className="text-primary" />
        <h3 className="font-semibold m-0">Manager Hiring Requests</h3>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Requested Role</th>
              <th>Justification</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id}>
                <td>
                  <div className="font-medium">{req.department_name}</div>
                  <div className="text-sm text-secondary">by {req.manager_name}</div>
                </td>
                <td className="font-medium text-primary">{req.requested_role}</td>
                <td><span className="truncate max-w-[200px]" title={req.description}>{req.description}</span></td>
                <td><StatusBadge status={req.status} /></td>
                <td>
                  {req.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(req.id, 'approved')} className="btn btn-success btn-sm"><Check size={14}/></button>
                      <button onClick={() => handleUpdate(req.id, 'rejected')} className="btn btn-danger btn-sm"><X size={14}/></button>
                    </div>
                  ) : (
                    <span className="text-secondary text-sm">Resolved</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberRequests;

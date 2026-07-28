import React from 'react';
import StatusBadge from './StatusBadge';
import DateRange from './DateRange';

const EmployeeProfileView = ({ data }) => {
  if (!data) return null;

  const { user, history } = data;

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
          <span className="label">Role</span>
          <span className="value"><StatusBadge status="approved" /> {user.role}</span>
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

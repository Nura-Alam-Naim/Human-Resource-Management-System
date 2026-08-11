import React from 'react';

const StatusBadge = ({ status }) => {
  const formatStatus = (s) => {
    if (s === 'pending_manager') return 'Pending (Manager)';
    if (s === 'pending_hr') return 'Pending (HR)';
    return s.replace('_', ' ');
  };

  const getStyle = (s) => {
    if (s === 'pending_manager' || s === 'pending_hr') return 'pending';
    return s;
  }

  return (
    <span className={`badge badge-${getStyle(status)}`} style={{ textTransform: 'capitalize' }}>
      {formatStatus(status)}
    </span>
  );
};

export default StatusBadge;

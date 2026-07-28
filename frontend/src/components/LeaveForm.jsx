import React from 'react';

const LeaveForm = ({ formData, onChange, onSubmit, submitLabel = 'Submit Request' }) => {
  const handleFieldChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label>Leave Type</label>
        <select
          value={formData.type_id}
          onChange={(e) => handleFieldChange('type_id', Number(e.target.value))}
        >
          <option value={1}>Sick Leave</option>
          <option value={2}>Casual Leave</option>
          <option value={3}>Annual Leave</option>
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Start Date</label>
          <input
            type="date"
            required
            value={formData.start_date}
            onChange={(e) => handleFieldChange('start_date', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>End Date</label>
          <input
            type="date"
            required
            value={formData.end_date}
            onChange={(e) => handleFieldChange('end_date', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Reason</label>
        <textarea
          rows="3"
          required
          value={formData.reason}
          onChange={(e) => handleFieldChange('reason', e.target.value)}
          placeholder="Briefly explain your reason for leave..."
        ></textarea>
      </div>

      <button type="submit" className="btn btn-primary w-full mt-2">
        {submitLabel}
      </button>
    </form>
  );
};

export default LeaveForm;

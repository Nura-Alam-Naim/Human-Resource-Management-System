import React, { useState } from 'react';
import axios from 'axios';

const CreateUserForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    total_leave_balance: 20
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/leaves/create-user', formData);
      alert("User created successfully! Temporary password: Welcome@123");
      setFormData({ name: '', email: '', role: 'employee', total_leave_balance: 20 });
      if (onSuccess) onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Full Name</label>
        <input
          type="text"
          required
          style={{ width: '100%' }}
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
      </div>
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Email</label>
        <input
          type="email"
          required
          style={{ width: '100%' }}
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />
      </div>
      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Role</label>
          <select
            style={{ width: '100%' }}
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Leave Balance</label>
          <input
            type="number"
            required
            min="0"
            style={{ width: '100%' }}
            value={formData.total_leave_balance}
            onChange={(e) => handleChange('total_leave_balance', parseInt(e.target.value))}
          />
        </div>
      </div>
      <button type="submit" className="btn btn-primary w-full">
        Create User
      </button>
    </form>
  );
};

export default CreateUserForm;

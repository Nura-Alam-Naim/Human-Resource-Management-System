import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

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
      toast.success("User created successfully! Temporary password: Welcome@123", { duration: 5000 });
      setFormData({ name: '', email: '', role: 'employee', total_leave_balance: 20 });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Full Name</label>
        <input
          type="text"
          required
          className="w-full"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          required
          className="w-full"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Role</label>
          <select
            className="w-full"
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <div className="form-group">
          <label>Leave Balance</label>
          <input
            type="number"
            required
            min="0"
            className="w-full"
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

import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const RequestMemberForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    requested_role: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/manager/team/request-member', formData);
      toast.success("Request sent successfully!");
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error submitting request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-2">
      <div className="form-group">
        <label>Requested Role / Job Title</label>
        <input 
          type="text" 
          className="form-control" 
          required 
          value={formData.requested_role}
          onChange={(e) => setFormData({...formData, requested_role: e.target.value})}
          placeholder="e.g. Senior Frontend Developer"
        />
      </div>
      
      <div className="form-group">
        <label>Why do you need this member?</label>
        <textarea 
          className="form-control" 
          rows="4" 
          required 
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Provide a brief justification for HR..."
        ></textarea>
      </div>

      <div className="flex justify-end pt-4">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </form>
  );
};

export default RequestMemberForm;

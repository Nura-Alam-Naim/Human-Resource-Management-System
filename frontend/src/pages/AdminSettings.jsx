import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { Settings, Plus, Building, Briefcase, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import './AdminSettings.scss';

import { useNavigate } from 'react-router-dom';

const AdminSettings = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isDesigModalOpen, setIsDesigModalOpen] = useState(false);
  
  // Form states
  const [deptForm, setDeptForm] = useState({ name: '', manager_id: '' });
  const [desigForm, setDesigForm] = useState({ title: '', department_id: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, usersRes] = await Promise.all([
        axios.get('/api/departments'),
        axios.get('/api/admin/leaves/users?limit=1000') // get all users to populate manager dropdown
      ]);
      setDepartments(deptRes.data);
      setUsers(usersRes.data.data);
    } catch (error) {
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/departments', deptForm);
      toast.success('Department created successfully');
      setIsDeptModalOpen(false);
      setDeptForm({ name: '', manager_id: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create department');
    }
  };

  const handleCreateDesignation = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/designations', desigForm);
      toast.success('Designation created successfully');
      setIsDesigModalOpen(false);
      setDesigForm({ title: '', department_id: '' });
      // Fetch designations shouldn't be needed if we don't display them here, 
      // but let's assume we might want to list them under departments in the future.
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create designation');
    }
  };

  const openDesigModal = (deptId) => {
    setDesigForm({ title: '', department_id: deptId });
    setIsDesigModalOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center mt-10"><div className="spinner"></div></div>;
  }

  return (
    <div className="dashboard-container admin-settings">
      <PageHeader 
        title="Organization Settings" 
        subtitle="Manage company departments and job designations"
      />

      <div className="settings-actions mb-6 flex gap-4">
        <button className="btn btn-primary" onClick={() => setIsDeptModalOpen(true)}>
          <Plus size={16} /> New Department
        </button>
      </div>

      <div className="departments-grid">
        {departments.length === 0 ? (
          <div className="card text-center text-gray-500 py-10">
            No departments configured yet. Create one to get started!
          </div>
        ) : (
          departments.map(dept => (
            <div 
              key={dept.id} 
              className="card dept-card cursor-pointer hover:shadow-lg transition-shadow relative"
              onClick={() => navigate(`/department/${dept.id}`)}
            >
              {dept.pending_transfers > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                  {dept.pending_transfers}
                </div>
              )}
              <div className="dept-card-header">
                <div className="flex items-center gap-2">
                  <Building className="text-indigo-600" size={24} />
                  <h3 className="text-xl font-bold m-0">{dept.name}</h3>
                </div>
                <div className="manager-badge">
                  <UserIcon size={14} />
                  <span>{dept.manager_name || 'No Manager Assigned'}</span>
                </div>
              </div>
              
              <div className="dept-card-actions mt-4 border-t pt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">View full details &rarr;</span>
                <button 
                  className="btn btn-outline btn-sm z-10" 
                  onClick={(e) => {
                    e.stopPropagation();
                    openDesigModal(dept.id);
                  }}
                >
                  <Plus size={14} /> Add Role
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Department Modal */}
      <Modal 
        isOpen={isDeptModalOpen} 
        onClose={() => setIsDeptModalOpen(false)} 
        title="Create Department"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4">
          <div className="form-group">
            <label>Department Name</label>
            <input 
              type="text" 
              required 
              className="form-control"
              value={deptForm.name}
              onChange={e => setDeptForm({...deptForm, name: e.target.value})}
              placeholder="e.g. Engineering"
            />
          </div>
          <div className="form-group">
            <label>Assign Manager (Optional)</label>
            <select 
              className="form-control"
              value={deptForm.manager_id}
              onChange={e => setDeptForm({...deptForm, manager_id: e.target.value})}
            >
              <option value="">-- Select a Manager --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" className="btn btn-outline" onClick={() => setIsDeptModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </form>
      </Modal>

      {/* Designation Modal */}
      <Modal 
        isOpen={isDesigModalOpen} 
        onClose={() => setIsDesigModalOpen(false)} 
        title="Create Job Designation"
      >
        <form onSubmit={handleCreateDesignation} className="space-y-4">
          <div className="form-group">
            <label>Job Title</label>
            <input 
              type="text" 
              required 
              className="form-control"
              value={desigForm.title}
              onChange={e => setDesigForm({...desigForm, title: e.target.value})}
              placeholder="e.g. Senior Software Engineer"
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" className="btn btn-outline" onClick={() => setIsDesigModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminSettings;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Building, User, Mail, Lock, Globe } from 'lucide-react';
import './Login.scss';

const Register = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    subdomain: '',
    adminName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // POST to public registration endpoint
      const res = await axios.post('/api/auth/register', formData);
      toast.success(res.data.message || 'Registration successful! You can now log in.');
      
      // Redirect to the new subdomain login page if it's dynamic
      if (res.data.subdomain) {
        const currentHost = window.location.hostname;
        const hostParts = currentHost.split('.');
        let newHost = '';
        if (hostParts.length > 2 || (hostParts.length === 2 && hostParts[1] === 'localhost')) {
            hostParts[0] = res.data.subdomain;
            newHost = hostParts.join('.');
        } else {
            newHost = `${res.data.subdomain}.${currentHost}`;
        }
        
        const port = window.location.port ? `:${window.location.port}` : '';
        const protocol = window.location.protocol;
        
        setTimeout(() => {
            window.location.href = `${protocol}//${newHost}${port}/login`;
        }, 2000);
      } else {
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card p-8 rounded-xl shadow-2xl bg-white max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <Building size={40} className="text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Register Your Company</h2>
          <p className="text-gray-500 mt-2 text-sm">Create a workspace for your team</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="text-sm font-medium text-gray-700 block mb-1">Company Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
                placeholder="Acme Corp"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="text-sm font-medium text-gray-700 block mb-1">Workspace URL (Subdomain)</label>
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 p-2 border border-gray-300 rounded-l focus:ring-primary focus:border-primary"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                required
                placeholder="acme"
              />
              <span className="bg-gray-100 border border-l-0 border-gray-300 px-3 py-2 rounded-r text-gray-500 text-sm whitespace-nowrap">
                .your-app.com
              </span>
            </div>
          </div>

          <div className="form-group pt-4 border-t border-gray-100">
            <label className="text-sm font-medium text-gray-700 block mb-1">Admin Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                required
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="text-sm font-medium text-gray-700 block mb-1">Admin Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="text-gray-400" />
              </div>
              <input
                type="email"
                className="w-full pl-10 p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="admin@acmecorp.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-gray-400" />
              </div>
              <input
                type="password"
                className="w-full pl-10 p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="••••••••"
                minLength="6"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors mt-6 flex justify-center items-center h-10"
            disabled={loading}
          >
            {loading ? <div className="spinner w-5 h-5 border-2"></div> : 'Create Workspace'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have a workspace? <Link to="/login" className="text-primary hover:underline font-medium">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

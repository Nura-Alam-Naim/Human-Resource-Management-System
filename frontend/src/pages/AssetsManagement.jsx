import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Laptop, Monitor, Smartphone, Cpu, Box, Edit, Trash2, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const AssetsManagement = () => {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    asset_tag: '',
    name: '',
    category: 'laptop',
    status: 'available',
    assigned_to: '',
    assigned_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setFilteredAssets(
      assets.filter(a => 
        a.name.toLowerCase().includes(search.toLowerCase()) || 
        a.asset_tag.toLowerCase().includes(search.toLowerCase()) ||
        (a.assigned_to_name && a.assigned_to_name.toLowerCase().includes(search.toLowerCase()))
      )
    );
  }, [search, assets]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsRes, employeesRes] = await Promise.all([
        axios.get('/api/assets'),
        axios.get('/api/admin/leaves/users') // Re-use the existing users route to get employee list
      ]);
      setAssets(assetsRes.data);
      setEmployees(employeesRes.data.users || []);
    } catch (error) {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({
      id: null,
      asset_tag: '',
      name: '',
      category: 'laptop',
      status: 'available',
      assigned_to: '',
      assigned_date: '',
      notes: ''
    });
    setShowModal(true);
  };

  const openEditModal = (asset) => {
    setIsEditing(true);
    setFormData({
      id: asset.id,
      asset_tag: asset.asset_tag,
      name: asset.name,
      category: asset.category,
      status: asset.status,
      assigned_to: asset.assigned_to || '',
      assigned_date: asset.assigned_date ? new Date(asset.assigned_date).toISOString().split('T')[0] : '',
      notes: asset.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        assigned_to: formData.assigned_to === '' ? null : formData.assigned_to,
        assigned_date: formData.assigned_date === '' ? null : formData.assigned_date
      };

      if (isEditing) {
        await axios.put(`/api/assets/${formData.id}`, payload);
        toast.success('Asset updated successfully');
      } else {
        await axios.post('/api/assets', payload);
        toast.success('Asset created successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving asset');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this asset?")) {
      try {
        await axios.delete(`/api/assets/${id}`);
        toast.success('Asset deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete asset');
      }
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'laptop': return <Laptop size={18} className="text-blue-500" />;
      case 'monitor': return <Monitor size={18} className="text-purple-500" />;
      case 'phone': return <Smartphone size={18} className="text-green-500" />;
      case 'software': return <Cpu size={18} className="text-pink-500" />;
      default: return <Box size={18} className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available': return <span className="badge badge-success">Available</span>;
      case 'assigned': return <span className="badge badge-primary">Assigned</span>;
      case 'maintenance': return <span className="badge badge-warning">Maintenance</span>;
      case 'retired': return <span className="badge badge-neutral">Retired</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="page-container p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Assets Inventory</h1>
          <p className="text-gray-500">Track company devices and software licenses.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} /> Add New Asset
        </button>
      </div>

      <div className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-color)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] flex justify-between items-center">
          <div className="search-bar relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search assets..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control pl-10 w-full"
            />
          </div>
          <span className="text-sm font-medium text-gray-500">{filteredAssets.length} Total Assets</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center"><div className="spinner"></div></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-tertiary)] text-gray-500 text-sm border-b border-[var(--border-color)]">
                  <th className="p-4 font-semibold">Asset Tag</th>
                  <th className="p-4 font-semibold">Name & Category</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Assigned To</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.length > 0 ? filteredAssets.map(asset => (
                  <tr key={asset.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="p-4 font-mono font-medium">{asset.asset_tag}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(asset.category)}
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{asset.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{asset.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(asset.status)}</td>
                    <td className="p-4">
                      {asset.assigned_to_name ? (
                        <div>
                          <p className="font-medium">{asset.assigned_to_name}</p>
                          <p className="text-xs text-gray-500">Since: {new Date(asset.assigned_date).toLocaleDateString()}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEditModal(asset)} className="text-blue-500 hover:text-blue-600 mr-4 transition-colors" title="Edit">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(asset.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">No assets found matching your criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Asset' : 'Add New Asset'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Asset Tag *</label>
                  <input required type="text" className="form-control" value={formData.asset_tag} onChange={e => setFormData({...formData, asset_tag: e.target.value})} placeholder="e.g. LAP-001" />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select required className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="laptop">Laptop</option>
                    <option value="monitor">Monitor</option>
                    <option value="phone">Mobile Phone</option>
                    <option value="software">Software License</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Asset Name / Model *</label>
                <input required type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. MacBook Pro M2 16GB" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Status *</label>
                  <select required className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="maintenance">In Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                {formData.status === 'assigned' && (
                  <div className="form-group">
                    <label>Assignment Date</label>
                    <input required type="date" className="form-control" value={formData.assigned_date} onChange={e => setFormData({...formData, assigned_date: e.target.value})} />
                  </div>
                )}
              </div>

              {formData.status === 'assigned' && (
                <div className="form-group">
                  <label>Assign To Employee *</label>
                  <select required className="form-control" value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})}>
                    <option value="">-- Select Employee --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Additional Notes</label>
                <textarea className="form-control" rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Serial numbers, conditions, etc."></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{isEditing ? 'Update Asset' : 'Save Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AssetsManagement;

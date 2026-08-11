import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '../components/PageHeader';
import { Calendar, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const PublicHolidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ date: '', name: '' });

  const fetchHolidays = async () => {
    try {
      const res = await axios.get('/api/holidays');
      setHolidays(res.data);
    } catch (error) {
      toast.error('Error fetching holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await axios.post('/api/holidays/sync');
      toast.success(res.data.message || 'Holidays synced!');
      fetchHolidays();
    } catch (error) {
      toast.error('Error syncing holidays');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/holidays', formData);
      toast.success('Holiday created!');
      setIsModalOpen(false);
      setFormData({ date: '', name: '' });
      fetchHolidays();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating holiday');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this holiday?")) {
      try {
        await axios.delete(`/api/holidays/${id}`);
        toast.success("Holiday removed.");
        fetchHolidays();
      } catch (error) {
        toast.error("Failed to remove holiday");
      }
    }
  };

  return (
    <div className="dashboard-container">
      <PageHeader 
        title="Public Holidays" 
        subtitle="Manage company-wide public holidays (excluded from leave days)."
        action={
          <div className="flex gap-2">
            <button className="btn btn-outline flex align-center gap-2" onClick={handleSync} disabled={syncing}>
              {syncing ? <div className="spinner spinner-sm"></div> : <Calendar size={16} />} 
              {syncing ? 'Syncing...' : 'Auto Sync'}
            </button>
            <button className="btn btn-primary flex align-center gap-2" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Add Holiday
            </button>
          </div>
        }
      />

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Holiday Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" className="text-center">Loading...</td></tr>
              ) : holidays.length === 0 ? (
                <tr><td colSpan="3" className="text-center">No holidays configured.</td></tr>
              ) : (
                holidays.map(h => (
                  <tr key={h.id}>
                    <td>
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar size={16} className="text-indigo-500" />
                        {new Date(h.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </td>
                    <td>{h.name}</td>
                    <td>
                      <button className="btn btn-outline btn-sm text-red-500 border-red-200" onClick={() => handleDelete(h.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Public Holiday">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="form-group">
            <label>Holiday Name</label>
            <input 
              type="text" 
              required 
              className="form-control" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Thanksgiving Day"
            />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input 
              type="date" 
              required 
              className="form-control" 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Holiday</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PublicHolidays;

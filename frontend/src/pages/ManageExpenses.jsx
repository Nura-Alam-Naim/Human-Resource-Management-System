import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Search, CheckCircle, XCircle, Clock, FileText, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageExpenses = () => {
  const [claims, setClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, []);

  useEffect(() => {
    setFilteredClaims(
      claims.filter(c => 
        c.employee_name.toLowerCase().includes(search.toLowerCase()) || 
        c.category.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, claims]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/expenses/manage');
      setClaims(res.data);
    } catch (error) {
      toast.error('Failed to load expense claims');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`/api/expenses/${id}/status`, { status: newStatus });
      toast.success(`Claim ${newStatus} successfully`);
      fetchClaims();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to update status`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="badge badge-success"><CheckCircle size={12} className="mr-1" /> Approved</span>;
      case 'rejected': return <span className="badge badge-danger"><XCircle size={12} className="mr-1" /> Rejected</span>;
      default: return <span className="badge badge-warning"><Clock size={12} className="mr-1" /> Pending</span>;
    }
  };

  return (
    <div className="page-container p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Expenses</h1>
          <p className="text-gray-500">Review and approve employee expense claims.</p>
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-color)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] flex justify-between items-center">
          <div className="search-bar relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search claims..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control pl-10 w-full"
            />
          </div>
          <span className="text-sm font-medium text-gray-500">{filteredClaims.length} Claims</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center"><div className="spinner"></div></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-tertiary)] text-gray-500 text-sm border-b border-[var(--border-color)]">
                  <th className="p-4 font-semibold">Employee</th>
                  <th className="p-4 font-semibold">Date & Category</th>
                  <th className="p-4 font-semibold">Description</th>
                  <th className="p-4 font-semibold">Amount</th>
                  <th className="p-4 font-semibold">Receipt</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.length > 0 ? filteredClaims.map(claim => (
                  <tr key={claim.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-[var(--text-primary)]">{claim.employee_name}</p>
                      <p className="text-xs text-gray-500">{claim.department_name}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-[var(--text-primary)] capitalize">{claim.category}</p>
                      <p className="text-xs text-gray-500">{new Date(claim.date).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm max-w-[200px] truncate" title={claim.description}>{claim.description}</p>
                    </td>
                    <td className="p-4 font-medium text-[var(--text-primary)]">
                      ${Number(claim.amount).toFixed(2)}
                    </td>
                    <td className="p-4">
                      {claim.receipt_path ? (
                        <a href={`http://localhost:8800/${claim.receipt_path}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 text-sm">
                          <FileText size={14} /> View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm italic">None</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(claim.status)}
                        {claim.approved_by_name && (
                          <span className="text-[10px] text-gray-400">By {claim.approved_by_name}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {claim.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => updateStatus(claim.id, 'approved')} className="text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 p-1.5 rounded transition-colors" title="Approve">
                            <Check size={18} />
                          </button>
                          <button onClick={() => updateStatus(claim.id, 'rejected')} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-1.5 rounded transition-colors" title="Reject">
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Processed</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">No expense claims found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageExpenses;

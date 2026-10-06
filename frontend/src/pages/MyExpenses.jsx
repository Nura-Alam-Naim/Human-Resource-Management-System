import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Plus, Upload, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const MyExpenses = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    date: '',
    amount: '',
    category: 'travel',
    description: ''
  });
  const [receiptFile, setReceiptFile] = useState(null);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/expenses/my-claims');
      setClaims(res.data);
    } catch (error) {
      toast.error('Failed to load expense claims');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = new FormData();
    payload.append('date', formData.date);
    payload.append('amount', formData.amount);
    payload.append('category', formData.category);
    payload.append('description', formData.description);
    if (receiptFile) {
      payload.append('receipt', receiptFile);
    }

    try {
      await axios.post('/api/expenses/submit', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Expense claim submitted successfully');
      setShowModal(false);
      setFormData({ date: '', amount: '', category: 'travel', description: '' });
      setReceiptFile(null);
      fetchClaims();
    } catch (error) {
      toast.error('Failed to submit claim');
    } finally {
      setIsSubmitting(false);
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
    <div className="page-container p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Expense Claims</h1>
          <p className="text-gray-500">Submit and track your reimbursement requests.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} /> Submit Claim
        </button>
      </div>

      <div className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-color)] overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center"><div className="spinner"></div></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-tertiary)] text-gray-500 text-sm border-b border-[var(--border-color)]">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Category & Description</th>
                  <th className="p-4 font-semibold">Amount</th>
                  <th className="p-4 font-semibold">Receipt</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {claims.length > 0 ? claims.map(claim => (
                  <tr key={claim.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="p-4">{new Date(claim.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <p className="font-medium capitalize text-[var(--text-primary)]">{claim.category}</p>
                      <p className="text-xs text-gray-500 max-w-xs truncate">{claim.description}</p>
                    </td>
                    <td className="p-4 font-medium text-[var(--text-primary)]">${Number(claim.amount).toFixed(2)}</td>
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
                          <span className="text-xs text-gray-400">By {claim.approved_by_name}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">You haven't submitted any expense claims yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Submit Expense Claim</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Expense Date *</label>
                  <input required type="date" className="form-control" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Amount ($) *</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input required type="number" step="0.01" min="0" className="form-control pl-8" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select required className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="travel">Travel & Transport</option>
                  <option value="meals">Meals & Entertainment</option>
                  <option value="supplies">Office Supplies</option>
                  <option value="equipment">Equipment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea required className="form-control" rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="What was this expense for?"></textarea>
              </div>

              <div className="form-group">
                <label>Upload Receipt (Optional)</label>
                <div className="relative border-2 border-dashed border-[var(--border-color)] rounded-lg p-4 text-center hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files[0])} />
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <Upload size={24} />
                    <span className="text-sm">{receiptFile ? receiptFile.name : "Click or drag file to upload"}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyExpenses;

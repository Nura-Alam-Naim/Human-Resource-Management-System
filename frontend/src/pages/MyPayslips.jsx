import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, FileText, Download } from 'lucide-react';
import './MyPayslips.scss';

const MyPayslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        const res = await axios.get('/api/payroll/my-payslips');
        setPayslips(res.data);
      } catch (err) {
        console.error("Failed to fetch payslips", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayslips();
  }, []);

  if (loading) return <div className="flex justify-center h-screen align-center"><div className="spinner"></div></div>;

  return (
    <div className="my-payslips-container">
      <div className="payslips-header">
        <h2>My Payslips</h2>
        <p className="text-secondary">View your monthly salary breakdown and download payslip documents.</p>
      </div>

      <div className="payslips-grid">
        {payslips.map(ps => (
          <div key={ps.id} className="payslip-card card">
            <div className="ps-header">
              <div className="ps-date">
                <FileText size={20} className="text-accent" />
                <h3>{new Date(0, ps.month - 1).toLocaleString('default', { month: 'long' })} {ps.year}</h3>
              </div>
              <span className={`badge badge-${ps.status === 'paid' ? 'success' : 'primary'}`}>{ps.status}</span>
            </div>

            <div className="ps-body">
              <div className="ps-row">
                <span>Base Salary</span>
                <span><DollarSign size={14} className="inline"/>{parseFloat(ps.base_salary).toLocaleString()}</span>
              </div>
              <div className="ps-row">
                <span>Days Worked</span>
                <span>{ps.days_worked} Days</span>
              </div>
              <div className="ps-row">
                <span>Gross Pay</span>
                <span><DollarSign size={14} className="inline"/>{parseFloat(ps.gross_pay).toLocaleString()}</span>
              </div>
              <div className="ps-row text-error">
                <span>Deductions</span>
                <span>- <DollarSign size={14} className="inline"/>{parseFloat(ps.deductions).toLocaleString()}</span>
              </div>
              <div className="ps-row ps-total">
                <span>Net Pay</span>
                <span><DollarSign size={16} className="inline"/>{parseFloat(ps.net_pay).toLocaleString()}</span>
              </div>
            </div>

            <div className="ps-footer">
              <button className="btn btn-outline btn-sm w-full" onClick={() => alert('PDF generation coming soon!')}>
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>
        ))}

        {payslips.length === 0 && (
          <div className="empty-state">
            <FileText size={48} className="text-secondary mb-4" />
            <h3>No Payslips Found</h3>
            <p>You haven't received any payslips yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPayslips;

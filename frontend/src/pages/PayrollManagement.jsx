import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Search, FileText, CheckCircle } from 'lucide-react';
import './PayrollManagement.scss';

const PayrollManagement = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('generate'); // generate, history
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [generatingFor, setGeneratingFor] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, payRes] = await Promise.all([
        axios.get('/api/admin/payroll/salaries'),
        axios.get('/api/admin/payroll/payslips')
      ]);
      setEmployees(empRes.data);
      setPayslips(payRes.data);
    } catch (err) {
      console.error("Failed to fetch payroll data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayslip = async (userId) => {
    setGeneratingFor(userId);
    try {
      await axios.post('/api/admin/payroll/generate', {
        user_id: userId,
        month: selectedMonth,
        year: selectedYear
      });
      // Refresh payslips to show newly generated one
      const payRes = await axios.get('/api/admin/payroll/payslips');
      setPayslips(payRes.data);
    } catch (err) {
      console.error(err);
      alert('Failed to generate payslip. Perhaps it already exists for this month?');
    } finally {
      setGeneratingFor(null);
    }
  };

  if (loading) return <div className="flex justify-center h-screen align-center"><div className="spinner"></div></div>;

  return (
    <div className="payroll-container">
      <div className="payroll-header">
        <h2>Payroll Management</h2>
        <div className="tab-buttons">
          <button className={`tab-btn ${activeTab === 'generate' ? 'active' : ''}`} onClick={() => setActiveTab('generate')}>
            Generate Payslips
          </button>
          <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            Payslip History
          </button>
        </div>
      </div>

      {activeTab === 'generate' && (
        <div className="card">
          <div className="filters-section">
            <div className="form-group">
              <label>Select Month</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Select Year</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-responsive mt-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department / Role</th>
                  <th>Base Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  // Check if payslip already generated for selected month/year
                  const isGenerated = payslips.some(p => p.user_id === emp.id && p.month === selectedMonth && p.year === selectedYear);
                  
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-sm text-secondary">{emp.email}</div>
                      </td>
                      <td>
                        <div>{emp.department_name || 'N/A'}</div>
                        <div className="text-sm text-secondary">{emp.designation_title || 'N/A'}</div>
                      </td>
                      <td>
                        <div className="font-medium flex items-center" style={{ gap: '4px' }}>
                          <DollarSign size={14} className="text-secondary"/> {parseFloat(emp.base_salary).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        {isGenerated ? (
                          <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                            <CheckCircle size={14} /> Generated
                          </span>
                        ) : (
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleGeneratePayslip(emp.id)}
                            disabled={generatingFor === emp.id}
                          >
                            {generatingFor === emp.id ? 'Generating...' : 'Generate Payslip'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Period</th>
                  <th>Days Worked</th>
                  <th>Gross Pay</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map(ps => (
                  <tr key={ps.id}>
                    <td>
                      <div className="font-medium">{ps.employee_name}</div>
                    </td>
                    <td>{new Date(0, ps.month - 1).toLocaleString('default', { month: 'short' })} {ps.year}</td>
                    <td>{ps.days_worked}</td>
                    <td><DollarSign size={12} className="inline"/>{parseFloat(ps.gross_pay).toLocaleString()}</td>
                    <td className="font-medium text-success"><DollarSign size={12} className="inline"/>{parseFloat(ps.net_pay).toLocaleString()}</td>
                    <td>
                      <span className="badge badge-primary">{ps.status}</span>
                    </td>
                  </tr>
                ))}
                {payslips.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-secondary">No payslips generated yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagement;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Target, Star, CheckCircle, Clock, XCircle, ChevronRight, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const TeamPerformance = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empData, setEmpData] = useState({ goals: [], appraisals: [] });
  const [loadingEmp, setLoadingEmp] = useState(false);

  // Modals
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showAppraisalModal, setShowAppraisalModal] = useState(false);
  
  // Forms
  const [goalForm, setGoalForm] = useState({ title: '', description: '', target_date: '' });
  const [appraisalForm, setAppraisalForm] = useState({ review_period: '', rating: 5, comments: '' });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    setFilteredEmployees(
      employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || (e.department_name && e.department_name.toLowerCase().includes(search.toLowerCase())))
    );
  }, [search, employees]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      // Re-using the team route to get employees
      const res = await axios.get('/api/manager/team');
      setEmployees(res.data.team);
    } catch (error) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeData = async (empId) => {
    try {
      setLoadingEmp(true);
      const res = await axios.get(`/api/performance/team/${empId}`);
      setEmpData(res.data);
    } catch (error) {
      toast.error('Failed to load employee performance data');
    } finally {
      setLoadingEmp(false);
    }
  };

  const handleSelectEmployee = (emp) => {
    setSelectedEmp(emp);
    fetchEmployeeData(emp.id);
  };

  const submitGoal = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/performance/goals', {
        employee_id: selectedEmp.id,
        ...goalForm
      });
      toast.success('Goal assigned successfully!');
      setShowGoalModal(false);
      setGoalForm({ title: '', description: '', target_date: '' });
      fetchEmployeeData(selectedEmp.id);
    } catch (error) {
      toast.error('Failed to assign goal');
    }
  };

  const submitAppraisal = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/performance/appraisals', {
        employee_id: selectedEmp.id,
        ...appraisalForm
      });
      toast.success('Appraisal submitted successfully!');
      setShowAppraisalModal(false);
      setAppraisalForm({ review_period: '', rating: 5, comments: '' });
      fetchEmployeeData(selectedEmp.id);
    } catch (error) {
      toast.error('Failed to submit appraisal');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <span className="badge badge-success"><CheckCircle size={12} className="mr-1" /> Completed</span>;
      case 'in_progress': return <span className="badge badge-warning"><Clock size={12} className="mr-1" /> In Progress</span>;
      case 'cancelled': return <span className="badge badge-danger"><XCircle size={12} className="mr-1" /> Cancelled</span>;
      default: return <span className="badge badge-neutral">Pending</span>;
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star key={i} size={16} fill={i < rating ? "currentColor" : "none"} className={i < rating ? "text-yellow-500" : "text-gray-300"} />
    ));
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="page-container p-6 max-w-7xl mx-auto flex gap-6 h-[calc(100vh-100px)]">
      
      {/* Sidebar: Employee List */}
      <div className="w-1/3 bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-color)] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
          <h2 className="text-lg font-bold mb-3">Team Performance</h2>
          <div className="search-bar relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search team members..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control pl-10 w-full"
            />
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {filteredEmployees.map(emp => (
            <button 
              key={emp.id} 
              onClick={() => handleSelectEmployee(emp)}
              className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${selectedEmp?.id === emp.id ? 'bg-[var(--primary-color)] text-white' : 'hover:bg-[var(--bg-tertiary)]'}`}
            >
              <div>
                <p className="font-medium">{emp.name}</p>
                <p className={`text-xs ${selectedEmp?.id === emp.id ? 'text-white/80' : 'text-gray-500'}`}>{emp.designation_title || 'Employee'} • {emp.department_name}</p>
              </div>
              <ChevronRight size={16} className={selectedEmp?.id === emp.id ? 'opacity-100' : 'opacity-30'} />
            </button>
          ))}
          {filteredEmployees.length === 0 && (
            <p className="text-center text-gray-500 p-4 text-sm">No employees found.</p>
          )}
        </div>
      </div>

      {/* Main Content: Performance Data */}
      <div className="w-2/3 bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-color)] overflow-hidden flex flex-col">
        {selectedEmp ? (
          <>
            <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{selectedEmp.name}'s Performance</h2>
                <p className="text-gray-500 text-sm mt-1">{selectedEmp.email}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowGoalModal(true)} className="btn btn-outline btn-sm">
                  <Target size={16} /> Assign Goal
                </button>
                <button onClick={() => setShowAppraisalModal(true)} className="btn btn-primary btn-sm">
                  <Star size={16} /> Write Appraisal
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-6 flex-1 space-y-8">
              {loadingEmp ? (
                <div className="loading-spinner">Loading data...</div>
              ) : (
                <>
                  {/* Goals Section */}
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                      <Target className="text-blue-500" /> Active Goals
                    </h3>
                    {empData.goals.length === 0 ? (
                      <p className="text-gray-500 text-sm">No goals assigned yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {empData.goals.map(goal => (
                          <div key={goal.id} className="border border-[var(--border-color)] rounded-lg p-4 bg-[var(--bg-primary)]">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{goal.title}</h4>
                              {getStatusBadge(goal.status)}
                            </div>
                            <p className="text-sm text-gray-500 mb-3">{goal.description}</p>
                            <div className="text-xs text-gray-400">
                              Target: {new Date(goal.target_date).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Appraisals Section */}
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                      <Star className="text-yellow-500" /> Performance Appraisals
                    </h3>
                    {empData.appraisals.length === 0 ? (
                      <p className="text-gray-500 text-sm">No appraisals submitted yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {empData.appraisals.map(appraisal => (
                          <div key={appraisal.id} className="border border-[var(--border-color)] rounded-lg p-4 bg-[var(--bg-primary)]">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-lg">{appraisal.review_period}</h4>
                              <div className="flex text-yellow-500">
                                {renderStars(appraisal.rating)}
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">{appraisal.comments}</p>
                            <div className="text-xs text-gray-400 text-right">
                              Written by {appraisal.reviewer_name} on {new Date(appraisal.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <Target size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-[var(--text-primary)]">No Employee Selected</h3>
            <p className="mt-2 max-w-sm text-sm">Select an employee from the list to view their performance metrics, goals, and appraisals.</p>
          </div>
        )}
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Assign New Goal</h2>
            <form onSubmit={submitGoal}>
              <div className="form-group">
                <label>Goal Title</label>
                <input required type="text" className="form-control" value={goalForm.title} onChange={e => setGoalForm({...goalForm, title: e.target.value})} />
              </div>
              <div className="form-group mt-3">
                <label>Description & Metrics</label>
                <textarea required className="form-control" rows="3" value={goalForm.description} onChange={e => setGoalForm({...goalForm, description: e.target.value})}></textarea>
              </div>
              <div className="form-group mt-3 mb-4">
                <label>Target Completion Date</label>
                <input required type="date" className="form-control" value={goalForm.target_date} onChange={e => setGoalForm({...goalForm, target_date: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-outline" onClick={() => setShowGoalModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Assign Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appraisal Modal */}
      {showAppraisalModal && (
        <div className="modal-overlay" onClick={() => setShowAppraisalModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Write Appraisal</h2>
            <form onSubmit={submitAppraisal}>
              <div className="form-group">
                <label>Review Period (e.g. Q3 2026, Annual 2026)</label>
                <input required type="text" className="form-control" value={appraisalForm.review_period} onChange={e => setAppraisalForm({...appraisalForm, review_period: e.target.value})} />
              </div>
              <div className="form-group mt-3">
                <label>Rating (1-5)</label>
                <div className="flex items-center gap-4 mt-2">
                  <input type="range" min="1" max="5" step="1" className="w-full" value={appraisalForm.rating} onChange={e => setAppraisalForm({...appraisalForm, rating: parseInt(e.target.value)})} />
                  <span className="font-bold text-xl">{appraisalForm.rating}/5</span>
                </div>
              </div>
              <div className="form-group mt-3 mb-4">
                <label>Feedback & Comments</label>
                <textarea required className="form-control" rows="4" value={appraisalForm.comments} onChange={e => setAppraisalForm({...appraisalForm, comments: e.target.value})} placeholder="Write a detailed performance review..."></textarea>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-outline" onClick={() => setShowAppraisalModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Appraisal</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeamPerformance;

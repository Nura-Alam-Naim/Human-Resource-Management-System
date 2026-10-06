import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Target, Star, CheckCircle, Clock, XCircle, User } from 'lucide-react';
import toast from 'react-hot-toast';

const MyPerformance = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/performance/my-performance');
      setGoals(res.data.goals);
      setAppraisals(res.data.appraisals);
    } catch (error) {
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const updateGoalStatus = async (goalId, newStatus) => {
    try {
      await axios.put(`/api/performance/my-goals/${goalId}/status`, { status: newStatus });
      toast.success('Goal updated successfully');
      fetchPerformanceData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update goal');
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
    <div className="page-container p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Performance</h1>
          <p className="text-gray-500">Track your goals, OKRs, and official performance reviews.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Goals Section */}
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-color)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-2 bg-[var(--bg-tertiary)]">
            <Target className="text-blue-500" />
            <h2 className="text-lg font-semibold">Active Goals & OKRs</h2>
          </div>
          <div className="p-4">
            {goals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No goals assigned yet.</p>
            ) : (
              <div className="space-y-4">
                {goals.map(goal => (
                  <div key={goal.id} className="border border-[var(--border-color)] rounded-lg p-4 bg-[var(--bg-primary)]">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{goal.title}</h3>
                      {getStatusBadge(goal.status)}
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{goal.description}</p>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                      
                      {goal.status !== 'completed' && goal.status !== 'cancelled' && (
                        <div className="flex gap-2">
                          {goal.status === 'pending' && (
                            <button onClick={() => updateGoalStatus(goal.id, 'in_progress')} className="btn btn-outline btn-sm">Start</button>
                          )}
                          {(goal.status === 'pending' || goal.status === 'in_progress') && (
                            <button onClick={() => updateGoalStatus(goal.id, 'completed')} className="btn btn-primary btn-sm">Mark Complete</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Appraisals Section */}
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-color)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-2 bg-[var(--bg-tertiary)]">
            <Star className="text-yellow-500" />
            <h2 className="text-lg font-semibold">Performance Appraisals</h2>
          </div>
          <div className="p-4">
            {appraisals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No official appraisals yet.</p>
            ) : (
              <div className="space-y-4">
                {appraisals.map(appraisal => (
                  <div key={appraisal.id} className="border border-[var(--border-color)] rounded-lg p-4 bg-[var(--bg-primary)]">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{appraisal.review_period}</h3>
                      <div className="flex text-yellow-500">
                        {renderStars(appraisal.rating)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-4 whitespace-pre-wrap">{appraisal.comments}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <User size={12} />
                      <span>Reviewed by {appraisal.reviewer_name} on {new Date(appraisal.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MyPerformance;

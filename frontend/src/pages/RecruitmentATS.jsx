import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Users, Plus, Edit, Trash2, Mail, ExternalLink } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const RecruitmentATS = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' or 'applications'
  
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  
  // Job Form Modal
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: '', department_id: '', employment_type: 'full-time', 
    location: '', description: '', requirements: '', status: 'open'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, appsRes, deptsRes] = await Promise.all([
        axios.get('http://localhost:8800/api/admin/ats/jobs', { withCredentials: true }),
        axios.get('http://localhost:8800/api/admin/ats/applications', { withCredentials: true }),
        axios.get('http://localhost:8800/api/departments', { withCredentials: true })
      ]);
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
      setDepartments(deptsRes.data);
    } catch (err) {
      toast.error("Failed to load ATS data");
    } finally {
      setLoading(false);
    }
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await axios.put(`http://localhost:8800/api/admin/ats/jobs/${editingJob.id}`, jobForm, { withCredentials: true });
        toast.success("Job updated successfully");
      } else {
        await axios.post('http://localhost:8800/api/admin/ats/jobs', jobForm, { withCredentials: true });
        toast.success("Job posted successfully");
      }
      setShowJobModal(false);
      setEditingJob(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save job");
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job posting? All applications for this job will also be deleted.")) return;
    try {
      await axios.delete(`http://localhost:8800/api/admin/ats/jobs/${id}`, { withCredentials: true });
      toast.success("Job deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete job");
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await axios.put(`http://localhost:8800/api/admin/ats/applications/${appId}/status`, { status: newStatus }, { withCredentials: true });
      toast.success(`Candidate moved to ${newStatus}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const openJobModal = (job = null) => {
    if (job) {
      setEditingJob(job);
      setJobForm({
        title: job.title, department_id: job.department_id, employment_type: job.employment_type,
        location: job.location, description: job.description, requirements: job.requirements, status: job.status
      });
    } else {
      setEditingJob(null);
      setJobForm({
        title: '', department_id: departments[0]?.id || '', employment_type: 'full-time', 
        location: '', description: '', requirements: '', status: 'open'
      });
    }
    setShowJobModal(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  return (
    <div className="dashboard-container">
      <PageHeader 
        title="Recruitment & ATS" 
        subtitle="Manage job postings and applicant pipelines"
      />

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'jobs' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Briefcase size={18} /> Job Postings
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'applications' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users size={18} /> Applications
            {applications.filter(a => a.status === 'new').length > 0 && (
              <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full ml-1">
                {applications.filter(a => a.status === 'new').length} New
              </span>
            )}
          </button>
        </nav>
      </div>

      {activeTab === 'jobs' && (
        <div>
          {user.role === 'admin' && (
            <div className="flex justify-end mb-4">
              <button onClick={() => openJobModal()} className="btn btn-primary flex items-center gap-2">
                <Plus size={16} /> Create New Job
              </button>
            </div>
          )}

          <div className="grid gap-4">
            {jobs.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500">No job postings found.</p>
              </div>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg">{job.title}</h3>
                      <span className={`badge ${job.status === 'open' ? 'badge-approved' : 'badge-cancelled'}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="text-sm text-secondary flex items-center gap-4">
                      <span>{job.department_name}</span>
                      <span>•</span>
                      <span className="capitalize">{job.employment_type.replace('-', ' ')}</span>
                      <span>•</span>
                      <span>{job.location || 'Remote'}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Posted by {job.creator_name} on {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {user.role === 'admin' && (
                    <div className="flex gap-2">
                      <button onClick={() => openJobModal(job)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Edit">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDeleteJob(job.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 font-semibold text-sm text-gray-600">Candidate</th>
                  <th className="p-4 font-semibold text-sm text-gray-600">Position</th>
                  <th className="p-4 font-semibold text-sm text-gray-600">Contact</th>
                  <th className="p-4 font-semibold text-sm text-gray-600">Resume</th>
                  <th className="p-4 font-semibold text-sm text-gray-600">Status</th>
                  <th className="p-4 font-semibold text-sm text-gray-600 text-right">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">No applications found.</td>
                  </tr>
                ) : (
                  applications.map(app => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-gray-800">{app.first_name} {app.last_name}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {app.job_title}
                        <div className="text-xs text-gray-400">{app.department_name}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        <a href={`mailto:${app.email}`} className="flex items-center gap-1 text-primary hover:underline mb-1">
                          <Mail size={14} /> {app.email}
                        </a>
                        <div>{app.phone}</div>
                      </td>
                      <td className="p-4">
                        <a 
                          href={`http://localhost:8800/${app.resume_path}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline bg-blue-50 px-3 py-1 rounded-full inline-block"
                        >
                          <ExternalLink size={14} /> View CV
                        </a>
                      </td>
                      <td className="p-4">
                        <select 
                          className={`text-sm border-0 rounded-full px-3 py-1 font-medium cursor-pointer focus:ring-2 focus:ring-primary ${
                            app.status === 'new' ? 'bg-blue-100 text-blue-800' :
                            app.status === 'reviewing' ? 'bg-yellow-100 text-yellow-800' :
                            app.status === 'interviewing' ? 'bg-purple-100 text-purple-800' :
                            app.status === 'offered' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        >
                          <option value="new">New</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="interviewing">Interviewing</option>
                          <option value="offered">Offered</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="p-4 text-sm text-gray-500 text-right">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Job Form Modal */}
      {showJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">{editingJob ? 'Edit Job Posting' : 'Create Job Posting'}</h3>
              <button onClick={() => setShowJobModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="jobForm" onSubmit={handleJobSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Job Title</label>
                    <input type="text" className="form-control" required value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <select className="form-control" required value={jobForm.department_id} onChange={e => setJobForm({...jobForm, department_id: e.target.value})}>
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label>Employment Type</label>
                    <select className="form-control" value={jobForm.employment_type} onChange={e => setJobForm({...jobForm, employment_type: e.target.value})}>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input type="text" className="form-control" placeholder="e.g. New York or Remote" value={jobForm.location} onChange={e => setJobForm({...jobForm, location: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="form-control" value={jobForm.status} onChange={e => setJobForm({...jobForm, status: e.target.value})}>
                      <option value="open">Open (Public)</option>
                      <option value="closed">Closed</option>
                      <option value="draft">Draft (Hidden)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" rows="4" required value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})}></textarea>
                </div>
                
                <div className="form-group">
                  <label>Requirements (Skills, Experience)</label>
                  <textarea className="form-control" rows="4" required value={jobForm.requirements} onChange={e => setJobForm({...jobForm, requirements: e.target.value})}></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button type="button" onClick={() => setShowJobModal(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" form="jobForm" className="btn btn-primary">
                {editingJob ? 'Update Job' : 'Post Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruitmentATS;

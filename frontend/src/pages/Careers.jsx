import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Briefcase, MapPin, Building, Upload, X } from 'lucide-react';
import './Careers.scss';

const Careers = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Application Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    cover_letter: ''
  });
  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      // Create a specific axios instance for public APIs if needed, 
      // but standard axios will work. No withCredentials needed here.
      const res = await axios.get('/api/careers/jobs');
      setJobs(res.data);
    } catch (err) {
      toast.error('Failed to load open positions.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      cover_letter: ''
    });
    setResume(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'application/pdf' || file.type.includes('word'))) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        e.target.value = null;
        return;
      }
      setResume(file);
    } else {
      toast.error("Please upload a PDF or Word document");
      e.target.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) {
      toast.error("Please upload your resume");
      return;
    }
    
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('job_id', selectedJob.id);
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      data.append('resume', resume);

      await axios.post('/api/careers/apply', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success("Application submitted successfully! Our HR team will reach out to you.");
      setSelectedJob(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-50"><div className="spinner"></div></div>;
  }

  return (
    <div className="careers-page min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <Building className="text-primary" />
            <span>TechCorp Careers</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-primary text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Join Our Incredible Team</h1>
          <p className="text-xl opacity-90 mb-8 text-white">
            We are looking for passionate individuals to help us build the future. 
            Explore our open positions and find your next great opportunity.
          </p>
        </div>
      </div>

      {/* Job Listings */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 border-b pb-4">Open Positions ({jobs.length})</h2>
        
        {jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
            <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No open positions right now</h3>
            <p className="text-gray-500 mt-2">Check back later for new opportunities.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {jobs.map(job => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1"><Building size={16} /> {job.department_name}</div>
                      <div className="flex items-center gap-1"><MapPin size={16} /> {job.location || 'Remote'}</div>
                      <div className="flex items-center gap-1 capitalize"><Briefcase size={16} /> {job.employment_type.replace('-', ' ')}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleApplyClick(job)}
                    className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
                  >
                    Apply Now
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap line-clamp-3">{job.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Apply for {selectedJob.title}</h3>
                <p className="text-sm text-gray-500">{selectedJob.department_name} • {selectedJob.location || 'Remote'}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-8">
                <h4 className="font-semibold text-gray-800 mb-2">Job Description</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap mb-4">{selectedJob.description}</p>
                
                <h4 className="font-semibold text-gray-800 mb-2">Requirements</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedJob.requirements}</p>
              </div>

              <hr className="my-6 border-gray-100" />
              
              <h4 className="font-semibold text-gray-800 mb-4">Submit Your Application</h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input 
                      type="text" required
                      className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                      value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input 
                      type="text" required
                      className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                      value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input 
                      type="email" required
                      className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resume / CV * (PDF, Word)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                    <input 
                      type="file" 
                      id="resume-upload" 
                      className="hidden" 
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      required
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
                      <Upload className="text-gray-400 mb-2" size={24} />
                      <span className="text-sm text-gray-600 font-medium">
                        {resume ? resume.name : 'Click to browse or drag and drop'}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">Max file size: 5MB</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter (Optional)</label>
                  <textarea 
                    rows="4" 
                    className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                    placeholder="Tell us why you are a great fit for this role..."
                    value={formData.cover_letter} onChange={e => setFormData({...formData, cover_letter: e.target.value})}
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                  <button type="button" onClick={() => setSelectedJob(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Careers;

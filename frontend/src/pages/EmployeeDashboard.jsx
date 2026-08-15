import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Edit2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import LeaveForm from "../components/LeaveForm";
import DateRange from "../components/DateRange";
import Pagination from "../components/Pagination";
import ClockInWidget from "../components/ClockInWidget";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import "./EmployeeDashboard.scss";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 5;

  const [formData, setFormData] = useState({
    type_id: 1,
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [documentFile, setDocumentFile] = useState(null);

  // Edit Form State
  const [editingRequest, setEditingRequest] = useState(null);
  const [editFormData, setEditFormData] = useState({
    type_id: 1,
    start_date: "",
    end_date: "",
    reason: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, requestsRes] = await Promise.all([
        axios.get("/api/user/leaves/profile"),
        axios.get(`/api/user/leaves/my-requests?page=${page}&limit=${limit}&search=${searchTerm}`),
      ]);
      setProfile(profileRes.data);
      setRequests(requestsRes.data.data);
      setTotalPages(requestsRes.data.totalPages);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, page, searchTerm]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (formData.type_id === 1 && !documentFile) {
        toast.error("Please upload a medical certificate for sick leave.");
        return;
    }
    
    try {
      const res = await axios.post("/api/user/leaves/apply", formData);
      const requestId = res.data.id;
      
      if (documentFile) {
          const uploadData = new FormData();
          uploadData.append("document", documentFile);
          uploadData.append("request_id", requestId);
          uploadData.append("doc_type", "Medical Certificate");
          
          await axios.post("/api/documents/upload", uploadData, {
              headers: { "Content-Type": "multipart/form-data" }
          });
      }
      
      toast.success("Leave applied successfully!");
      setFormData({ type_id: 1, start_date: "", end_date: "", reason: "" });
      setDocumentFile(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error applying for leave");
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm("Are you sure you want to cancel this request?")) {
      try {
        await axios.put(`/api/user/leaves/cancel/${id}`);
        toast.success("Leave request cancelled.");
        fetchData();
      } catch (error) {
        toast.error("Error cancelling request");
      }
    }
  };

  const openEditModal = (req) => {
    setEditingRequest(req);
    setEditFormData({
      type_id: req.type_id || 1,
      start_date: req.start_date.split("T")[0],
      end_date: req.end_date.split("T")[0],
      reason: req.reason,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `/api/user/leaves/edit/${editingRequest.id}`,
        editFormData,
      );
      toast.success("Leave request updated successfully!");
      setEditingRequest(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error editing request");
    }
  };

  return (
    <div className="dashboard-container">
      {/* Profile Header */}
      <div className="card profile-card">
        <div className="balance-info">
          <h3>Leave Balance</h3>
          <div className="balance-number">
            {profile?.total_leave_balance || 0}
          </div>
          <span className="balance-label">Days Remaining</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Clock In Widget */}
        <div className="clock-in-section">
          <ClockInWidget />
        </div>

        {/* Apply Form */}
        <div className="card apply-card">
          <h3>Apply for Leave</h3>
          <LeaveForm
            formData={formData}
            onChange={setFormData}
            onSubmit={handleApply}
            submitLabel="Submit Request"
            onFileChange={(e) => setDocumentFile(e.target.files[0])}
            file={documentFile}
          />
        </div>

        {/* Worktime Chart */}
        {profile?.worktime_stats && profile.worktime_stats.length > 0 && (
          <div className="card worktime-card" style={{ gridColumn: '1 / -1' }}>
            <h3>Weekly Work Time (Avg Hours)</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profile.worktime_stats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)'}} />
                  <Tooltip cursor={{fill: 'var(--bg-color)'}} contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  <Bar dataKey="avg_hours" fill="var(--accent-color)" radius={[4, 4, 0, 0]} name="Hours Worked" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="card history-card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>My Leave History</h3>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
            />
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center">
                      <div className="flex justify-center mt-2 mb-2"><div className="spinner spinner-sm"></div></div>
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">
                      No leave requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id}>
                      <td>{req.type_name}</td>
                      <td>
                        <DateRange start={req.start_date} end={req.end_date} />
                      </td>
                      <td>
                        <StatusBadge status={req.status} />
                      </td>
                      <td>
                        {req.status === "pending" && (
                          <div className="action-buttons">
                            <button
                              onClick={() => openEditModal(req)}
                              className="btn btn-outline btn-sm"
                              title="Edit Request"
                            >
                              <Edit2 size={16} /> Edit
                            </button>
                            <button
                              onClick={() => handleCancel(req.id)}
                              className="btn btn-outline btn-sm cancel-btn"
                              title="Cancel Request"
                            >
                              <XCircle size={16} /> Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
      <Modal
        isOpen={!!editingRequest}
        onClose={() => setEditingRequest(null)}
        title="Edit Leave Request"
      >
        <LeaveForm
          formData={editFormData}
          onChange={setEditFormData}
          onSubmit={handleEditSubmit}
          submitLabel="Update Request"
        />
      </Modal>
    </div>
  );
};

export default EmployeeDashboard;

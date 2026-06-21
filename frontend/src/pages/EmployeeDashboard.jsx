import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Edit2, XCircle } from "lucide-react";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import LeaveForm from "../components/LeaveForm";
import DateRange from "../components/DateRange";
import "./EmployeeDashboard.scss";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);

  // Apply Form State
  const [formData, setFormData] = useState({
    type_id: 1,
    start_date: "",
    end_date: "",
    reason: "",
  });

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
      const [profileRes, requestsRes] = await Promise.all([
        axios.get("/api/user/leaves/profile"),
        axios.get("/api/user/leaves/my-requests"),
      ]);
      setProfile(profileRes.data);
      setRequests(requestsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/user/leaves/apply", formData);
      alert("Leave applied successfully!");
      setFormData({ type_id: 1, start_date: "", end_date: "", reason: "" });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Error applying for leave");
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm("Are you sure you want to cancel this request?")) {
      try {
        await axios.put(`/api/user/leaves/cancel/${id}`);
        fetchData();
      } catch (error) {
        alert("Error cancelling request");
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
      alert("Leave request updated successfully!");
      setEditingRequest(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Error editing request");
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
        {/* Apply Form */}
        <div className="card apply-card">
          <h3>Apply for Leave</h3>
          <LeaveForm
            formData={formData}
            onChange={setFormData}
            onSubmit={handleApply}
            submitLabel="Submit Request"
          />
        </div>

        {/* History Table */}
        <div className="card history-card">
          <h3>My Leave History</h3>
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
                {requests.length === 0 ? (
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

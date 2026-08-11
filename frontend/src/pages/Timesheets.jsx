import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '../components/PageHeader';
import { Calendar, Clock } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import './Timesheets.scss';

const Timesheets = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await axios.get('/api/attendance/my-records');
        setRecords(res.data);
      } catch (error) {
        console.error("Error fetching timesheets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  const calculateHours = (start, end) => {
    if (!start || !end) return '-';
    const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
    return diff.toFixed(1) + ' hrs';
  };

  return (
    <div className="dashboard-container">
      <PageHeader
        title="My Timesheets"
        subtitle="Review your historical clock-in and clock-out logs."
      />

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Total Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    <div className="flex justify-center mt-2 mb-2"><div className="spinner spinner-sm"></div></div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">No attendance records found.</td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="font-medium">{formatDate(record.date)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-green-500" />
                        <span>{formatTime(record.clock_in)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-red-400" />
                        <span>{formatTime(record.clock_out)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-gray-700">
                        {calculateHours(record.clock_in, record.clock_out)}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={record.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Timesheets;

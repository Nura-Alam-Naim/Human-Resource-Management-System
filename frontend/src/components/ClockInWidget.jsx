import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Play, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import './ClockInWidget.scss';

const ClockInWidget = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState('loading'); // loading, not-clocked-in, clocked-in, completed, holiday
  const [clockInTime, setClockInTime] = useState(null);
  const [holidayName, setHolidayName] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const localDateStr = new Date().toLocaleDateString('en-CA'); // Gets YYYY-MM-DD in local time
      const res = await axios.get(`/api/attendance/status?date=${localDateStr}`);
      setStatus(res.data.status);
      if (res.data.holidayName) {
        setHolidayName(res.data.holidayName);
      }
      if (res.data.clockInTime) {
        setClockInTime(new Date(res.data.clockInTime));
      }
    } catch (error) {
      console.error("Error fetching attendance status:", error);
      setStatus('error');
    }
  };

  const handleClockIn = async () => {
    try {
      await axios.post('/api/attendance/clock-in');
      toast.success("You are now clocked in!");
      fetchStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to clock in");
    }
  };

  const handleClockOut = async () => {
    try {
      await axios.post('/api/attendance/clock-out');
      toast.success("You are now clocked out!");
      fetchStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to clock out");
    }
  };

  const handleResumeShift = async () => {
    try {
      await axios.post('/api/attendance/resume-shift');
      toast.success("Shift resumed successfully!");
      fetchStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resume shift");
    }
  };

  if (status === 'loading') {
    return <div className="clock-widget loading"><div className="spinner"></div></div>;
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const isWorkingHours = currentTime.getHours() >= 8 && currentTime.getHours() < 20;

  return (
    <div className={`clock-widget status-${status}`}>
      <div className="clock-header">
        <Clock size={24} />
        <h2>Time & Attendance</h2>
      </div>
      
      <div className="time-display">
        {formatTime(currentTime)}
      </div>
      
      <div className="clock-actions">
        {status === 'holiday' && (
          <div className="completed-shift">
            <p>It's {holidayName}!</p>
            <span>Enjoy your day off!</span>
          </div>
        )}

        {status === 'not-clocked-in' && (
          <div className="flex flex-col gap-2 align-center">
            <button 
              className="btn btn-punch-in" 
              onClick={handleClockIn}
              disabled={!isWorkingHours}
            >
              <Play size={20} fill="currentColor" /> Punch In
            </button>
            {!isWorkingHours && (
              <span className="text-xs text-muted text-center mt-2">
                Clock-in is only available between 8 AM and 8 PM.
              </span>
            )}
          </div>
        )}
        
        {status === 'clocked-in' && (
          <div className="active-shift">
            <p>Punched in at {formatTime(clockInTime)}</p>
            <button className="btn btn-punch-out" onClick={handleClockOut}>
              <Square size={16} fill="currentColor" /> Punch Out
            </button>
          </div>
        )}

        {status === 'completed' && (
          <div className="completed-shift flex flex-col gap-3">
            <div>
              <p>Shift Completed for Today</p>
              <span>Great job! See you tomorrow.</span>
            </div>
            <button className="btn btn-outline btn-sm mx-auto" onClick={handleResumeShift}>
              Resume Shift (Accidental Punch-out)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClockInWidget;

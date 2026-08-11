import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '../components/PageHeader';
import { Users, User, Shield } from 'lucide-react';
import './OrgChart.scss';

const OrgChart = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgData = async () => {
      try {
        const [deptRes, usersRes] = await Promise.all([
          axios.get('/api/departments'),
          axios.get('/api/admin/leaves/users?limit=1000') // get all users for chart
        ]);

        const depts = deptRes.data;
        const users = usersRes.data.data;

        // Attach users to their respective departments
        const structuredData = depts.map(dept => ({
          ...dept,
          employees: users.filter(u => u.department_id === dept.id && u.id !== dept.manager_id),
          manager: users.find(u => u.id === dept.manager_id)
        }));

        setDepartments(structuredData);
      } catch (error) {
        console.error("Error fetching org chart data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <PageHeader
        title="Organizational Chart"
        subtitle="Visual reporting hierarchy of the company by department."
      />

      <div className="org-chart-container">
        {departments.map(dept => (
          <div key={dept.id} className="org-department">
            <div className="dept-header">
              <Users size={20} className="icon" />
              <h3>{dept.name}</h3>
            </div>
            
            <div className="org-manager">
              <div className="avatar manager-avatar">
                <Shield size={20} />
              </div>
              <div className="info">
                <h4>{dept.manager?.name || 'Vacant'}</h4>
                <span>{dept.manager?.designation_title || 'Department Head'}</span>
              </div>
            </div>

            <div className="connector"></div>

            <div className="org-employees">
              {dept.employees.length === 0 ? (
                <div className="no-employees">No employees assigned</div>
              ) : (
                dept.employees.map(emp => (
                  <div key={emp.id} className="org-employee">
                    <div className="avatar">
                      <User size={16} />
                    </div>
                    <div className="info">
                      <h5>{emp.name}</h5>
                      <span>{emp.designation_title || 'Employee'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrgChart;

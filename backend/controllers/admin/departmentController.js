import db from '../../db.js';

export const getAllDepartments = async (req, res) => {
  try {
    const [departments] = await db.query(`
      SELECT d.*, u.name as manager_name, u.email as manager_email,
      (SELECT COUNT(*) FROM transfer_requests tr WHERE tr.target_department_id = d.id AND tr.status = 'pending') as pending_transfers,
      (SELECT COUNT(*) FROM member_requests mr WHERE mr.department_id = d.id AND mr.status = 'pending') as pending_member_requests
      FROM departments d
      LEFT JOIN users u ON d.manager_id = u.id
      ORDER BY d.name ASC
    `);
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

export const createDepartment = async (req, res) => {
  const { name, manager_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Department name is required' });

  try {
    const [result] = await db.query(
      'INSERT INTO departments (name, manager_id) VALUES (?, ?)',
      [name, manager_id || null]
    );

    if (manager_id) {
      // Automatically promote to manager if they are currently an employee
      await db.query('UPDATE users SET role = "manager" WHERE id = ? AND role = "employee"', [manager_id]);
    }

    res.status(201).json({ message: 'Department created successfully', departmentId: result.insertId });
  } catch (error) {
    console.error('Error creating department:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Department with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create department' });
  }
};

export const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, manager_id } = req.body;

  try {
    await db.query(
      'UPDATE departments SET name = ?, manager_id = ? WHERE id = ?',
      [name, manager_id || null, id]
    );

    if (manager_id) {
      // Automatically promote to manager if they are currently an employee
      await db.query('UPDATE users SET role = "manager" WHERE id = ? AND role = "employee"', [manager_id]);
    }

    res.json({ message: 'Department updated successfully' });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
};

export const getDepartmentDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const [[department]] = await db.query(`
      SELECT d.*, u.name as manager_name, u.email as manager_email 
      FROM departments d
      LEFT JOIN users u ON d.manager_id = u.id
      WHERE d.id = ?
    `, [id]);

    if (!department) return res.status(404).json({ error: 'Department not found' });

    const [employees] = await db.query(`
      SELECT u.id, u.name, u.email, u.role, des.title as designation_title
      FROM users u
      LEFT JOIN designations des ON u.designation_id = des.id
      WHERE u.department_id = ?
    `, [id]);

    const [transferRequests] = await db.query(`
      SELECT tr.id, tr.status, tr.created_at, u1.name as employee_name, u2.name as requester_name
      FROM transfer_requests tr
      JOIN users u1 ON tr.employee_id = u1.id
      JOIN users u2 ON tr.requested_by = u2.id
      WHERE tr.target_department_id = ? AND tr.status = 'pending'
      ORDER BY tr.created_at DESC
    `, [id]);

    const [memberRequests] = await db.query(`
      SELECT mr.id, mr.requested_role, mr.description, mr.status, mr.created_at, u.name as manager_name
      FROM member_requests mr
      JOIN users u ON mr.manager_id = u.id
      WHERE mr.department_id = ? AND mr.status = 'pending'
      ORDER BY mr.created_at DESC
    `, [id]);

    res.json({ department, employees, transferRequests, memberRequests });
  } catch (error) {
    console.error('Error fetching department details:', error);
    res.status(500).json({ error: 'Failed to fetch department details' });
  }
};

export const updateTransferStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const [[request]] = await db.query('SELECT * FROM transfer_requests WHERE id = ?', [id]);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    await db.query('UPDATE transfer_requests SET status = ? WHERE id = ?', [status, id]);

    if (status === 'approved') {
      await db.query('UPDATE users SET department_id = ? WHERE id = ?', [request.target_department_id, request.employee_id]);
    }

    res.json({ message: 'Transfer request updated successfully' });
  } catch (error) {
    console.error('Error updating transfer request:', error);
    res.status(500).json({ error: 'Failed to update transfer request' });
  }
};

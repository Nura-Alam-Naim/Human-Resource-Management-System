import db from '../../db.js';

export const getAllDepartments = async (req, res) => {
  try {
    const [departments] = await db.query(`
      SELECT d.*, u.name as manager_name, u.email as manager_email 
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
    res.json({ message: 'Department updated successfully' });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
};

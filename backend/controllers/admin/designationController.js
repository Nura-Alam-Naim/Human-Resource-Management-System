import db from '../../database/db.js';

export const getDesignationsByDepartment = async (req, res) => {
  const { departmentId } = req.params;
  try {
    const [designations] = await db.query(
      'SELECT * FROM designations WHERE department_id = ? AND company_id = ? ORDER BY title ASC',
      [departmentId, req.user.company_id]
    );
    res.json(designations);
  } catch (error) {
    console.error('Error fetching designations:', error);
    res.status(500).json({ error: 'Failed to fetch designations' });
  }
};

export const getAllDesignations = async (req, res) => {
  try {
    const [designations] = await db.query(`
      SELECT d.*, dept.name as department_name 
      FROM designations d
      JOIN departments dept ON d.department_id = dept.id
      WHERE d.company_id = ?
      ORDER BY dept.name ASC, d.title ASC
    `, [req.user.company_id]);
    res.json(designations);
  } catch (error) {
    console.error('Error fetching designations:', error);
    res.status(500).json({ error: 'Failed to fetch designations' });
  }
};

export const createDesignation = async (req, res) => {
  const { title, department_id } = req.body;
  if (!title || !department_id) {
    return res.status(400).json({ error: 'Title and department_id are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO designations (title, department_id, company_id) VALUES (?, ?, ?)',
      [title, department_id, req.user.company_id]
    );
    res.status(201).json({ message: 'Designation created successfully', designationId: result.insertId });
  } catch (error) {
    console.error('Error creating designation:', error);
    res.status(500).json({ error: 'Failed to create designation' });
  }
};

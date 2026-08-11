import db from '../../db.js';

export const clockIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already clocked in today
    const [existing] = await db.query(
      'SELECT id, clock_out FROM attendance WHERE user_id = ? AND date = ?',
      [userId, today]
    );

    if (existing.length > 0) {
      if (existing[0].clock_out) {
        return res.status(400).json({ message: "You have already completed your shift for today." });
      }
      return res.status(400).json({ message: "You are already clocked in." });
    }

    await db.query(
      'INSERT INTO attendance (user_id, date, clock_in) VALUES (?, ?, NOW())',
      [userId, today]
    );

    res.status(201).json({ message: "Successfully clocked in!" });
  } catch (error) {
    console.error("Clock In Error:", error);
    res.status(500).json({ message: "Server error during clock in." });
  }
};

export const clockOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if clocked in today
    const [existing] = await db.query(
      'SELECT id, clock_out FROM attendance WHERE user_id = ? AND date = ?',
      [userId, today]
    );

    if (existing.length === 0) {
      return res.status(400).json({ message: "You have not clocked in today." });
    }

    if (existing[0].clock_out) {
      return res.status(400).json({ message: "You have already clocked out today." });
    }

    await db.query(
      'UPDATE attendance SET clock_out = NOW() WHERE id = ?',
      [existing[0].id]
    );

    res.json({ message: "Successfully clocked out!" });
  } catch (error) {
    console.error("Clock Out Error:", error);
    res.status(500).json({ message: "Server error during clock out." });
  }
};

export const resumeShift = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if clocked in today
    const [existing] = await db.query(
      'SELECT id, clock_out FROM attendance WHERE user_id = ? AND date = ?',
      [userId, today]
    );

    if (existing.length === 0) {
      return res.status(400).json({ message: "No attendance record found for today." });
    }

    if (!existing[0].clock_out) {
      return res.status(400).json({ message: "You are already clocked in." });
    }

    await db.query(
      'UPDATE attendance SET clock_out = NULL WHERE id = ?',
      [existing[0].id]
    );

    res.json({ message: "Shift resumed successfully!" });
  } catch (error) {
    console.error("Resume Shift Error:", error);
    res.status(500).json({ message: "Server error while resuming shift." });
  }
};

export const getStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const dateQuery = req.query.date; // Expecting YYYY-MM-DD from frontend
    const today = dateQuery || new Date().toISOString().split('T')[0];
    
    // Check for weekends (Friday = 5, Saturday = 6)
    const dayOfWeek = new Date(today + 'T12:00:00Z').getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return res.json({ status: 'holiday', holidayName: 'Weekend' });
    }

    // Check for public holidays
    const [holidays] = await db.query('SELECT name FROM public_holidays WHERE date = ?', [today]);
    if (holidays.length > 0) {
      return res.json({ status: 'holiday', holidayName: holidays[0].name });
    }
    
    const [existing] = await db.query(
      'SELECT clock_in, clock_out FROM attendance WHERE user_id = ? AND date = ?',
      [userId, today]
    );

    if (existing.length === 0) {
      return res.json({ status: 'not-clocked-in' });
    }

    if (!existing[0].clock_out) {
      return res.json({ status: 'clocked-in', clockInTime: existing[0].clock_in });
    }

    return res.json({ 
      status: 'completed', 
      clockInTime: existing[0].clock_in,
      clockOutTime: existing[0].clock_out 
    });
  } catch (error) {
    console.error("Get Status Error:", error);
    res.status(500).json({ message: "Server error fetching status." });
  }
};

export const getMyRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 30;
    
    const [records] = await db.query(
      'SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC LIMIT ?',
      [userId, limit]
    );
    
    res.json(records);
  } catch (error) {
    console.error("Get My Records Error:", error);
    res.status(500).json({ message: "Server error fetching records." });
  }
};

export const getAllRecords = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const query = `
      SELECT a.*, u.name as employee_name, u.email as employee_email, 
             d.name as department_name, des.title as designation_title
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN designations des ON u.designation_id = des.id
      ORDER BY a.date DESC, a.clock_in DESC
      LIMIT ? OFFSET ?
    `;
    
    const [records] = await db.query(query, [limit, offset]);
    res.json(records);
  } catch (error) {
    console.error("Get All Records Error:", error);
    res.status(500).json({ message: "Server error fetching all records." });
  }
};

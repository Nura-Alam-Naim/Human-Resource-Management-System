import db from '../../db.js';
import axios from 'axios';

export const getHolidays = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM public_holidays ORDER BY date ASC');
    res.json(rows);
  } catch (error) {
    console.error("Error fetching holidays:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createHoliday = async (req, res) => {
  try {
    const { date, name } = req.body;
    await db.query('INSERT INTO public_holidays (date, name) VALUES (?, ?)', [date, name]);
    res.status(201).json({ message: "Holiday created successfully!" });
  } catch (error) {
    console.error("Error creating holiday:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "A holiday on this date already exists." });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM public_holidays WHERE id = ?', [id]);
    res.json({ message: "Holiday deleted successfully!" });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const syncHolidays = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const countryCode = process.env.HOLIDAY_COUNTRY_CODE || 'BD';
    
    console.log(`Syncing holidays for ${countryCode} in ${year}...`);
    const response = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
    const holidays = response.data;

    let insertedCount = 0;
    for (const h of holidays) {
      try {
        await db.query('INSERT IGNORE INTO public_holidays (date, name) VALUES (?, ?)', [h.date, h.name]);
        insertedCount++;
      } catch (err) {
        console.error("Error inserting holiday", h, err);
      }
    }

    res.json({ message: `Successfully synced ${insertedCount} holidays!` });
  } catch (error) {
    console.error("Error syncing holidays:", error.message);
    res.status(500).json({ message: "Failed to sync holidays from external API." });
  }
};

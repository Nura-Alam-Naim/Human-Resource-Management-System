import db from '../db.js';

export const calculateWorkingDays = async (startDateStr, endDateStr) => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  if (end < start) return 0;

  // Fetch all public holidays
  const [holidays] = await db.query('SELECT date FROM public_holidays');
  const holidayStrings = holidays.map(h => {
    // Format to YYYY-MM-DD
    const d = new Date(h.date);
    return d.toISOString().split('T')[0];
  });

  let workingDays = 0;
  let currentDate = new Date(start);

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    // 0 is Sunday, 6 is Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (!holidayStrings.includes(dateStr)) {
        workingDays++;
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
};

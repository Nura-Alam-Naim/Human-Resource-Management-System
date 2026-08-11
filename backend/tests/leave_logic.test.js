import request from 'supertest';
import app from '../index.js';
import db from '../db.js';
import { calculateWorkingDays } from '../utils/leaveUtils.js';

afterAll(async () => {
  await db.end();
});

describe('Phase 3 Advanced Leave Logic', () => {

  it('should exclude weekends from working days calculation', async () => {
    // Thursday to Tuesday = 6 days total. 
    // Thu, Fri, Sat(exclude), Sun(exclude), Mon, Tue = 4 working days
    const days = await calculateWorkingDays('2026-10-01', '2026-10-06');
    // Note: Assuming no public holidays in this random block unless seeded
    expect(days).toBe(4);
  });

  it('should exclude public holidays from working days calculation', async () => {
    // The DB migration seeds '2026-01-01' as New Year's Day.
    // Let's test a block that includes Jan 1, 2026 (Thursday).
    // Wed Dec 31 to Fri Jan 2 = 3 days total.
    // Working days should be 2 because Jan 1 is a holiday.
    const days = await calculateWorkingDays('2025-12-31', '2026-01-02');
    expect(days).toBe(2);
  });

});

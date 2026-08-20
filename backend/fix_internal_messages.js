import db from './db.js';

async function run() {
  try {
    console.log("Altering internal_messages table...");
    await db.query("ALTER TABLE internal_messages MODIFY COLUMN receiver_id INT NULL");
    
    const [cols] = await db.query("SHOW COLUMNS FROM internal_messages LIKE 'target_role'");
    if (cols.length === 0) {
      await db.query("ALTER TABLE internal_messages ADD COLUMN target_role ENUM('admin') DEFAULT NULL AFTER receiver_id");
    }
    
    console.log("Schema updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error updating schema:", error);
    process.exit(1);
  }
}

run();

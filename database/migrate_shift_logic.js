const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_aAxJbYU2SDm8@ep-delicate-thunder-acrhy0mr-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log("Starting migrations...");

    // 1. Add status to users
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';");
    await pool.query("UPDATE users SET status = 'approved' WHERE status = 'pending';"); // retroactively approve everyone existing

    // 2. Add calculation fields to shifts
    await pool.query("ALTER TABLE shifts ADD COLUMN IF NOT EXISTS calculation_type VARCHAR(50) DEFAULT 'hourly';");
    await pool.query("ALTER TABLE shifts ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 0;");
    await pool.query("ALTER TABLE shifts ADD COLUMN IF NOT EXISTS worked_hours DECIMAL(5,2) DEFAULT 0;");
    await pool.query("ALTER TABLE shifts ADD COLUMN IF NOT EXISTS patient_rate DECIMAL(10,2) DEFAULT 0;");
    await pool.query("ALTER TABLE shifts ADD COLUMN IF NOT EXISTS patients_scheduled INTEGER DEFAULT 0;");
    await pool.query("ALTER TABLE shifts ADD COLUMN IF NOT EXISTS patients_attended INTEGER DEFAULT 0;");
    await pool.query("ALTER TABLE shifts ADD COLUMN IF NOT EXISTS patients_returned INTEGER DEFAULT 0;");
    await pool.query("ALTER TABLE shifts ADD COLUMN IF NOT EXISTS lunch_break BOOLEAN DEFAULT false;");
    await pool.query("ALTER TABLE shifts ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT false;");
    await pool.query("ALTER TABLE shifts ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5,2) DEFAULT 0;");

    console.log("Migrations applied successfully!");
  } catch(e) {
    console.error("Migration Error:", e);
  } finally {
    process.exit();
  }
}
run();

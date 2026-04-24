const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_aAxJbYU2SDm8@ep-delicate-thunder-acrhy0mr-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const result = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users';");
  console.log('Columns:', result.rows);
  const result2 = await pool.query("SELECT id, email, role FROM users;");
  console.log('USERS:', result2.rows);
  process.exit();
}
run();

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_aAxJbYU2SDm8@ep-delicate-thunder-acrhy0mr-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  // Step 1: Insert new email into whitelist
  await pool.query("INSERT INTO whitelist (email, role) VALUES ('caiovieirac@gmail.com', 'admin') ON CONFLICT DO NOTHING;");
  
  // Step 2: Update users table where it points to the old admin email
  await pool.query("UPDATE users SET email = 'caiovieirac@gmail.com', password_hash = 'C@io18071997@', name = 'Caio Vieira' WHERE email = 'admin@medhub.com';");
  
  // Step 3: Delete old admin entry from whitelist
  await pool.query("DELETE FROM whitelist WHERE email = 'admin@medhub.com';");

  console.log('Admin account perfectly updated to caiovieirac@gmail.com');
  process.exit();
}
run();

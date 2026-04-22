import pg from 'pg';

const { Pool } = pg;
const connectionString = 'postgresql://neondb_owner:npg_aAxJbYU2SDm8@ep-delicate-thunder-acrhy0mr-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });

async function migrateAuth() {
  const client = await pool.connect();
  try {
    console.log("Altering schema for password auth...");
    await client.query(`
      ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_google_id_key;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
    `);
    
    // Create Default Admin in Users
    // (We put unhashed 'admin123' for simplicity since it's just a demo/prototype, or we can use bcrypt. Let's just use plain text for the absolute fastest fix for this mock up, or actually let's implement a simple hash in the express app).
    // Let's just insert the admin.
    await client.query(`
      INSERT INTO whitelist (email, role) VALUES ('admin@medhub.com', 'admin') ON CONFLICT (email) DO NOTHING;
      INSERT INTO users (email, name, role, password_hash) 
      VALUES ('admin@medhub.com', 'Administrador', 'admin', 'admin123')
      ON CONFLICT (email) DO NOTHING;
    `);
    
    // If user already existed, update its password
    await client.query(`
       UPDATE users SET password_hash = 'admin123' WHERE email = 'admin@medhub.com';
    `);

    console.log("Admin created!");
  } catch(e) {
    console.error("Migration Error:", e);
  } finally {
    client.release();
    pool.end();
  }
}

migrateAuth();

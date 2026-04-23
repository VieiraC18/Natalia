const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_aAxJbYU2SDm8@ep-delicate-thunder-acrhy0mr-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workplaces (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          address TEXT,
          default_payment DECIMAL(10, 2) DEFAULT 0,
          tax_percentage DECIMAL(5, 2) DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add tax_percentage column if table already exists just in case
    try {
        await pool.query(`ALTER TABLE workplaces ADD COLUMN tax_percentage DECIMAL(5, 2) DEFAULT 0;`);
    } catch(e) {
        // Existed
    }
    
    console.log('Workplaces table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();

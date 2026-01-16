/**
 * Database setup script
 * Run with: npm run db:setup
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('./connection');

async function setupDatabase() {
  console.log('Setting up database...');
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✓ Database schema created successfully');
    
    // Close connection
    await pool.end();
    
    console.log('✓ Database setup complete');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();

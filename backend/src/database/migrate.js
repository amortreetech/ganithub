const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const runMigration = async () => {
    try {
        console.log('🔄 Starting database migration...');

        // Read the schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split the schema into individual statements
        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        // Execute each statement
        for (const statement of statements) {
            try {
                await pool.execute(statement);
                console.log('✅ Executed statement successfully');
            } catch (error) {
                // Skip errors for statements that might already exist
                if (!error.message.includes('already exists')) {
                    console.error('❌ Error executing statement:', error.message);
                    console.error('Statement:', statement.substring(0, 100) + '...');
                }
            }
        }

        console.log('✅ Database migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
};

// Run migration if this file is executed directly
if (require.main === module) {
    runMigration();
}

module.exports = { runMigration };


import { AppDataSource } from '../config/data-source';
import seed from './seed-hierarchical';

async function migrateAndSeed() {
  try {
    console.log('🚀 Starting migration and seed process...');
    
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Run migrations
    await AppDataSource.runMigrations();
    console.log('✅ Migrations completed');

    // Close connection to allow seed to use its own connection
    await AppDataSource.destroy();

    // Run seed
    await seed();
    
    console.log('\n🎉 Migration and seed completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Test the new hierarchical structure');
    console.log('3. Use the seed users to test different roles and permissions');
    
  } catch (error) {
    console.error('❌ Error during migration and seed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  migrateAndSeed();
}

export default migrateAndSeed;

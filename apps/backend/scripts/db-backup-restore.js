const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prismaDir = path.join(__dirname, '..', 'prisma');
const dbFile = path.join(prismaDir, 'dev.db');
const backupDir = path.join(prismaDir, 'backups');

console.log('--- Starting SQLite Database Backup & Restore Validation Script (Prisma Version) ---');

// 1. Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// 2. Check if main database file exists
if (!fs.existsSync(dbFile)) {
  console.error(`Error: Core database file not found at: ${dbFile}`);
  process.exit(1);
}

// 3. Create Backup File
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `dev_backup_${timestamp}.db`);

try {
  fs.copyFileSync(dbFile, backupFile);
  const stats = fs.statSync(backupFile);
  console.log(`\n[BACKUP] Backup created successfully: ${path.basename(backupFile)}`);
  console.log(`[BACKUP] File Size: ${stats.size} bytes`);
  
  if (stats.size === 0) {
    throw new Error('Backup file size is 0 bytes!');
  }
} catch (err) {
  console.error('[BACKUP ERROR] Copying database failed:', err);
  process.exit(1);
}

// 4. Perform Restore Verification Test
console.log('\n[RESTORE TEST] Starting restore validation test...');
const tempRestoreFile = path.join(backupDir, 'dev_restore_test.db');

async function runRestoreTest() {
  try {
    // Simulate restore: copy backup file to temporary verification database path
    fs.copyFileSync(backupFile, tempRestoreFile);
    console.log('[RESTORE TEST] Restored backup file to temporary test location.');

    // Override the connection string dynamically for Prisma to target our temp file
    // Note: absolute path is needed
    const relativeRestoreDbPath = 'file:./backups/dev_restore_test.db';
    
    const prismaTest = new PrismaClient({
      datasources: {
        db: {
          url: relativeRestoreDbPath
        }
      }
    });

    console.log('[RESTORE TEST] Initializing test Prisma client...');
    const userCount = await prismaTest.user.count();
    
    console.log(`[RESTORE TEST] Success! Verified read on users table. User count: ${userCount}`);
    console.log('✅ DATABASE BACKUP AND RESTORE COMPLIANCE TEST PASSED SUCCESSFULLY!');
    
    await prismaTest.$disconnect();
    cleanupAndExit(0);
  } catch (err) {
    console.error('[RESTORE TEST ERROR] Restore validation failed:', err.message);
    cleanupAndExit(1);
  }
}

function cleanupAndExit(exitCode) {
  try {
    if (fs.existsSync(tempRestoreFile)) {
      fs.unlinkSync(tempRestoreFile);
      console.log('[CLEANUP] Stale temporary restore verification file cleaned up.');
    }
  } catch (err) {
    console.error('[CLEANUP ERROR] Failed to delete temporary restore file:', err);
  }
  process.exit(exitCode);
}

runRestoreTest();

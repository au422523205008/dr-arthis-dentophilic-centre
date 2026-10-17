const readline = require('readline');
const bcrypt = require('bcrypt');
const { db } = require('../db');
const { DEFAULT_PERMISSIONS } = require('../middleware/rbac');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function run() {
  console.log('====================================================');
  console.log("🦷 Dr. Arthi's Dentophilic Centre - Admin Setup CLI");
  console.log('====================================================\n');

  try {
    const username = (await question('Enter Admin Username (default: drarthi): ')).trim() || 'drarthi';
    const name = (await question('Enter Full Name (default: Dr. Arthi Mukeshkannan): ')).trim() || 'Dr. Arthi Mukeshkannan';
    const email = (await question('Enter Email (default: drarthidentophilic@gmail.com): ')).trim() || 'drarthidentophilic@gmail.com';
    const phone = (await question('Enter Phone (default: +91 95971 26248): ')).trim() || '+91 95971 26248';
    const password = (await question('Enter Admin Password: ')).trim();

    if (!password || password.length < 6) {
      console.error('\n❌ Password must be at least 6 characters long.');
      rl.close();
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const permissions = JSON.stringify(DEFAULT_PERMISSIONS.ADMIN);

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.toLowerCase());
    if (existing) {
      db.prepare(`
        UPDATE users 
        SET name = ?, email = ?, phone = ?, passwordHash = ?, role = 'ADMIN', status = 'ACTIVE', 
            permissions = ?, updatedAt = ?, isDeleted = 0
        WHERE id = ?
      `).run(name, email, phone, passwordHash, permissions, now, existing.id);
      console.log(`\n✅ Existing user '${username}' updated to active Administrator!`);
    } else {
      db.prepare(`
        INSERT INTO users (username, name, email, phone, passwordHash, role, status, permissions, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, 'ADMIN', 'ACTIVE', ?, ?, ?)
      `).run(username.toLowerCase(), name, email, phone, passwordHash, permissions, now, now);
      console.log(`\n✅ New Administrator '${username}' created successfully!`);
    }

    console.log('\nYou can now log in at http://localhost:3000 with your credentials.\n');
  } catch (err) {
    console.error('\n❌ Setup error:', err);
  } finally {
    rl.close();
  }
}

run();

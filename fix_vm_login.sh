#!/bin/bash
# ==============================================================================
# Fix Demo Users and Passwords in Docker MySQL
# ==============================================================================

echo "Creating and seeding all demo accounts with password Admin@123..."

sudo docker exec disaster_backend node -e "
const b = require('bcryptjs');
const d = require('./src/config/database');

(async () => {
  const h = b.hashSync('Admin@123', 10);
  const p = await d.getConnection();

  try {
    await p.query('ALTER TABLE warehouses ADD COLUMN manager_user_id BIGINT UNSIGNED NULL');
  } catch(e) {}

  const f = async (e, n, r, s) => {
    const [x] = await p.query('SELECT user_id FROM users WHERE email=?', [e]);
    if (x.length) {
      await p.query('UPDATE users SET full_name=?, role_id=?, state_id=?, password_hash=?, is_active=1 WHERE user_id=?', [n, r, s, h, x[0].user_id]);
      return x[0].user_id;
    }
    const [i] = await p.query('INSERT INTO users (role_id, state_id, full_name, email, password_hash, is_active) VALUES (?, ?, ?, ?, ?, 1)', [r, s, n, e, h]);
    return i.insertId;
  };

  const u1 = await f('national.head@disaster.local', 'National Disaster Management Head', 1, null);
  const u2 = await f('KeralaState.head@disaster.local', 'Kerala State Disaster Management Head', 2, 1);
  const u3 = await f('kerala.warehouse@disaster.local', 'Kerala Warehouse Manager', 4, 1);
  const u4 = await f('tn.warehouse@disaster.local', 'Tamil Nadu Warehouse Manager', 4, 2);
  const u5 = await f('dept.head@disaster.local', 'Kerala Disaster Department Head', 3, 1);
  const u6 = await f('field.officer@disaster.local', 'Kerala Field Response Officer', 5, 1);

  try {
    await p.query('UPDATE warehouses SET manager_user_id=? WHERE warehouse_id=1', [u3]);
    await p.query('UPDATE warehouses SET manager_user_id=? WHERE warehouse_id=2', [u4]);
  } catch(e) {}

  console.log('✅ ALL DEMO ACCOUNTS READY:');
  console.log('   - national.head@disaster.local     (Password: Admin@123)');
  console.log('   - KeralaState.head@disaster.local   (Password: Admin@123)');
  console.log('   - kerala.warehouse@disaster.local  (Password: Admin@123)');
  console.log('   - tn.warehouse@disaster.local      (Password: Admin@123)');
  console.log('   - dept.head@disaster.local         (Password: Admin@123)');
  console.log('   - field.officer@disaster.local     (Password: Admin@123)');
  
  p.release();
  process.exit(0);
})().catch(err => {
  console.error('Error seeding users:', err);
  process.exit(1);
});
"

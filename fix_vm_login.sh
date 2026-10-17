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

  await p.query(`
    INSERT IGNORE INTO roles (role_id, role_name, description) VALUES
    (1, 'NATIONAL_HEAD', 'Single national-level disaster management head'),
    (2, 'STATE_HEAD', 'Head responsible for a state'),
    (3, 'DEPARTMENT_HEAD', 'Head of a disaster/resource department'),
    (4, 'WAREHOUSE_MANAGER', 'Manages government resource warehouse'),
    (5, 'FIELD_OFFICER', 'Field-level disaster response officer')
  `);

  await p.query(`
    INSERT IGNORE INTO countries (country_id, country_name, country_code) VALUES
    (1, 'India', 'IN')
  `);

  await p.query(`
    INSERT IGNORE INTO states (state_id, country_id, state_name, state_code) VALUES
    (1, 1, 'Kerala', 'KL'),
    (2, 1, 'Tamil Nadu', 'TN'),
    (3, 1, 'Karnataka', 'KA')
  `);

  await p.query(`
    INSERT IGNORE INTO departments (department_id, state_id, department_name, department_code, description) VALUES
    (1, 1, 'Flood Management Department', 'FLOOD-KL', 'Handles flood preparedness and response'),
    (2, 1, 'Fire and Rescue Department', 'FIRE-KL', 'Handles fire and rescue operations'),
    (3, 2, 'Flood Management Department', 'FLOOD-TN', 'Handles flood preparedness and response'),
    (4, 2, 'Fire and Rescue Department', 'FIRE-TN', 'Handles fire and rescue operations')
  `);

  await p.query(`
    INSERT IGNORE INTO resource_categories (resource_category_id, category_name, description) VALUES
    (1, 'FOOD', 'Food and emergency ration resources'),
    (2, 'WATER', 'Drinking and water supply resources'),
    (3, 'MEDICAL', 'Medical and healthcare resources'),
    (4, 'RESCUE', 'Search and rescue resources')
  `);

  await p.query(`
    INSERT IGNORE INTO resources (resource_id, resource_category_id, resource_name, unit, description) VALUES
    (1, 1, 'Food Kit', 'KIT', 'Emergency food supply kit'),
    (2, 2, 'Drinking Water', 'LITRE', 'Emergency drinking water'),
    (3, 3, 'Medical Kit', 'KIT', 'Emergency medical kit'),
    (4, 4, 'Rescue Boat', 'UNIT', 'Emergency rescue boat')
  `);

  await p.query(`
    INSERT IGNORE INTO warehouses (warehouse_id, state_id, department_id, warehouse_name, latitude, longitude, address) VALUES
    (1, 1, 1, 'Kerala Central Emergency Warehouse', 10.8505169, 76.2710833, 'Kerala Emergency Resource Storage'),
    (2, 2, 3, 'Tamil Nadu Central Emergency Warehouse', 13.0826802, 80.2707184, 'Tamil Nadu Emergency Resource Storage')
  `);

  await p.query(`
    INSERT IGNORE INTO warehouse_resources (warehouse_id, resource_id, quantity_available, quantity_reserved) VALUES
    (1, 1, 50000, 0),
    (1, 2, 100000, 0),
    (1, 3, 10000, 0),
    (1, 4, 25, 0),
    (2, 1, 50000, 0),
    (2, 2, 100000, 0),
    (2, 3, 12000, 0)
  `);

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

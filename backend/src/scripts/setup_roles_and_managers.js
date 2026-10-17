const bcrypt = require("bcryptjs");
const pool = require("../config/database");

async function setup() {
  const connection = await pool.getConnection();
  try {
    console.log("=== Setting up Warehouse Managers and Roles ===");

    // 1. Check if manager_user_id column exists on warehouses
    const [cols] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'warehouses' 
        AND COLUMN_NAME = 'manager_user_id'
    `);

    if (cols.length === 0) {
      console.log("Adding manager_user_id column to warehouses table...");
      await connection.query(`
        ALTER TABLE warehouses 
        ADD COLUMN manager_user_id BIGINT UNSIGNED NULL,
        ADD CONSTRAINT fk_warehouses_manager 
          FOREIGN KEY (manager_user_id) REFERENCES users(user_id) 
          ON DELETE SET NULL
      `);
      console.log("Column manager_user_id added successfully.");
    } else {
      console.log("Column manager_user_id already exists.");
    }

    // 2. Ensure Core Reference Data (Roles, Countries, States, Departments) Exists
    console.log("Ensuring Core Reference Data (Roles, States, Resources)...");
    await connection.query(`
      INSERT IGNORE INTO roles (role_id, role_name, description) VALUES
      (1, 'NATIONAL_HEAD', 'Single national-level disaster management head'),
      (2, 'STATE_HEAD', 'Head responsible for a state'),
      (3, 'DEPARTMENT_HEAD', 'Head of a disaster/resource department'),
      (4, 'WAREHOUSE_MANAGER', 'Manages government resource warehouse'),
      (5, 'FIELD_OFFICER', 'Field-level disaster response officer');
    `);

    await connection.query(`
      INSERT IGNORE INTO countries (country_id, country_name, country_code) VALUES
      (1, 'India', 'IN');
    `);

    await connection.query(`
      INSERT IGNORE INTO states (state_id, country_id, state_name, state_code) VALUES
      (1, 1, 'Kerala', 'KL'),
      (2, 1, 'Tamil Nadu', 'TN'),
      (3, 1, 'Karnataka', 'KA');
    `);

    await connection.query(`
      INSERT IGNORE INTO departments (department_id, state_id, department_name, department_code, description) VALUES
      (1, 1, 'Flood Management Department', 'FLOOD-KL', 'Handles flood preparedness and response'),
      (2, 1, 'Fire and Rescue Department', 'FIRE-KL', 'Handles fire and rescue operations'),
      (3, 2, 'Flood Management Department', 'FLOOD-TN', 'Handles flood preparedness and response'),
      (4, 2, 'Fire and Rescue Department', 'FIRE-TN', 'Handles fire and rescue operations');
    `);

    await connection.query(`
      INSERT IGNORE INTO resource_categories (resource_category_id, category_name, description) VALUES
      (1, 'FOOD', 'Food and emergency ration resources'),
      (2, 'WATER', 'Drinking and water supply resources'),
      (3, 'MEDICAL', 'Medical and healthcare resources'),
      (4, 'RESCUE', 'Search and rescue resources');
    `);

    await connection.query(`
      INSERT IGNORE INTO resources (resource_id, resource_category_id, resource_name, unit, description) VALUES
      (1, 1, 'Food Kit', 'KIT', 'Emergency food supply kit'),
      (2, 2, 'Drinking Water', 'LITRE', 'Emergency drinking water'),
      (3, 3, 'Medical Kit', 'KIT', 'Emergency medical kit'),
      (4, 4, 'Rescue Boat', 'UNIT', 'Emergency rescue boat');
    `);

    await connection.query(`
      INSERT IGNORE INTO warehouses (warehouse_id, state_id, department_id, warehouse_name, latitude, longitude, address) VALUES
      (1, 1, 1, 'Kerala Central Emergency Warehouse', 10.8505169, 76.2710833, 'Kerala Emergency Resource Storage'),
      (2, 2, 3, 'Tamil Nadu Central Emergency Warehouse', 13.0826802, 80.2707184, 'Tamil Nadu Emergency Resource Storage');
    `);

    await connection.query(`
      INSERT IGNORE INTO warehouse_resources (warehouse_id, resource_id, quantity_available, quantity_reserved) VALUES
      (1, 1, 50000, 0),
      (1, 2, 100000, 0),
      (1, 3, 10000, 0),
      (1, 4, 25, 0),
      (2, 1, 50000, 0),
      (2, 2, 100000, 0),
      (2, 3, 12000, 0);
    `);

    const defaultPassword = "Admin@123";
    const passwordHash = bcrypt.hashSync(defaultPassword, 10);

    // Helper to ensure user exists
    async function ensureUser(email, fullName, roleId, stateId, districtId = null) {
      const [existing] = await connection.query("SELECT user_id FROM users WHERE email = ?", [email]);
      if (existing.length > 0) {
        await connection.query(
          "UPDATE users SET full_name = ?, role_id = ?, state_id = ?, district_id = ?, password_hash = ?, is_active = 1 WHERE user_id = ?",
          [fullName, roleId, stateId, districtId, passwordHash, existing[0].user_id]
        );
        return existing[0].user_id;
      } else {
        const [res] = await connection.query(
          `INSERT INTO users (role_id, state_id, district_id, full_name, email, password_hash, is_active)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [roleId, stateId, districtId, fullName, email, passwordHash]
        );
        return res.insertId;
      }
    }

    const nationalHeadId = await ensureUser(
      "national.head@disaster.local",
      "National Disaster Management Head",
      1, // NATIONAL_HEAD
      null,
      null
    );
    console.log("National Head user_id:", nationalHeadId);

    const stateHeadId = await ensureUser(
      "KeralaState.head@disaster.local",
      "Kerala State Disaster Management Head",
      2, // STATE_HEAD
      1, // Kerala
      null
    );
    console.log("State Head user_id:", stateHeadId);

    // Role IDs:
    // 1: NATIONAL_HEAD
    // 2: STATE_HEAD
    // 3: DEPARTMENT_HEAD
    // 4: WAREHOUSE_MANAGER
    // 5: FIELD_OFFICER

    const keralaWhManagerId = await ensureUser(
      "kerala.warehouse@disaster.local",
      "Kerala Warehouse Manager",
      4, // WAREHOUSE_MANAGER
      1, // Kerala
      null
    );
    console.log("Kerala Warehouse Manager user_id:", keralaWhManagerId);

    const tnWhManagerId = await ensureUser(
      "tn.warehouse@disaster.local",
      "Tamil Nadu Warehouse Manager",
      4, // WAREHOUSE_MANAGER
      2, // Tamil Nadu
      null
    );
    console.log("Tamil Nadu Warehouse Manager user_id:", tnWhManagerId);

    const deptHeadId = await ensureUser(
      "dept.head@disaster.local",
      "Kerala Disaster Department Head",
      3, // DEPARTMENT_HEAD
      1,
      null
    );
    console.log("Department Head user_id:", deptHeadId);

    const fieldOfficerId = await ensureUser(
      "field.officer@disaster.local",
      "Kerala Field Response Officer",
      5, // FIELD_OFFICER
      1,
      null
    );
    console.log("Field Officer user_id:", fieldOfficerId);

    // Assign managers to warehouses
    await connection.query(
      "UPDATE warehouses SET manager_user_id = ? WHERE warehouse_id = 1",
      [keralaWhManagerId]
    );
    await connection.query(
      "UPDATE warehouses SET manager_user_id = ? WHERE warehouse_id = 2",
      [tnWhManagerId]
    );
    console.log("Assigned warehouse managers to warehouses 1 and 2.");

    console.log("\n=== Setup completed successfully! ===");
    process.exit(0);
  } catch (error) {
    console.error("Setup error:", error);
    process.exit(1);
  } finally {
    connection.release();
  }
}

setup();

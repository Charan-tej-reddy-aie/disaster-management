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

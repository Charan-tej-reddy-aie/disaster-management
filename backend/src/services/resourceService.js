const pool = require("../config/database");

async function getAllResources() {
  const [rows] = await pool.query(`
    SELECT
      r.resource_id,
      r.resource_name,
      r.unit,
      r.description,

      rc.resource_category_id,
      rc.category_name,

      wr.warehouse_resource_id,
      wr.quantity_available,
      wr.quantity_reserved,

      w.warehouse_id,
      w.warehouse_name,

      s.state_id,
      s.state_name

    FROM resources r

    JOIN resource_categories rc
      ON rc.resource_category_id = r.resource_category_id

    LEFT JOIN warehouse_resources wr
      ON wr.resource_id = r.resource_id

    LEFT JOIN warehouses w
      ON w.warehouse_id = wr.warehouse_id

    LEFT JOIN states s
      ON s.state_id = w.state_id

    ORDER BY r.resource_id, w.warehouse_id
  `);

  return rows;
}

async function getResourceSummary() {
  const [rows] = await pool.query(`
    SELECT
      r.resource_id,
      r.resource_name,
      r.unit,
      rc.category_name,

      COALESCE(SUM(wr.quantity_available), 0) AS total_available,
      COALESCE(SUM(wr.quantity_reserved), 0) AS total_reserved

    FROM resources r

    JOIN resource_categories rc
      ON rc.resource_category_id = r.resource_category_id

    LEFT JOIN warehouse_resources wr
      ON wr.resource_id = r.resource_id

    GROUP BY
      r.resource_id,
      r.resource_name,
      r.unit,
      rc.category_name

    ORDER BY r.resource_id
  `);

  return rows;
}

module.exports = {
  getAllResources,
  getResourceSummary
};
const db = require('../config/database');

async function inspect() {
  try {
    console.log('--- WAREHOUSE_RESOURCES ---');
    const [whRes] = await db.query('SELECT * FROM warehouse_resources');
    console.table(whRes);

    console.log('\n--- RESOURCE_REQUESTS ---');
    const [reqs] = await db.query('SELECT * FROM resource_requests');
    console.table(reqs);

    console.log('\n--- RESOURCE_ALLOCATIONS ---');
    const [allocs] = await db.query('SELECT * FROM resource_allocations');
    console.table(allocs);

    console.log('\n--- RESOURCE_MOVEMENTS ---');
    const [movs] = await db.query('SELECT * FROM resource_movements');
    console.table(movs);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();

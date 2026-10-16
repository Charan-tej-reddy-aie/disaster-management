const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const outputDir = path.resolve(__dirname, "../../../presentation/images");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function capture() {
  console.log("Launching headless browser with system Chrome...");
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1920,1080"
    ],
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    }
  });

  const page = await browser.newPage();

  // 1. Capture Login Page
  console.log("Capturing 01_login.png...");
  await page.goto("http://localhost:5173/login", { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outputDir, "01_login.png") });

  // Perform Login
  console.log("Authenticating as National Head...");
  await page.type('input[type="email"]', "national.head@disaster.local");
  await page.type('input[type="password"]', "Admin@123");
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2000));

  // 2. Capture Dashboard
  console.log("Capturing 02_dashboard.png...");
  await page.goto("http://localhost:5173/dashboard", { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(outputDir, "02_dashboard.png") });

  // 3. Capture Predictions
  console.log("Capturing 03_predictions.png...");
  await page.goto("http://localhost:5173/predictions", { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outputDir, "03_predictions.png") });

  // 4. Capture Quantum Optimization
  console.log("Capturing 04_quantum.png...");
  await page.goto("http://localhost:5173/quantum", { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outputDir, "04_quantum.png") });

  // 5. Capture Blockchain Audit
  console.log("Capturing 05_blockchain.png...");
  await page.goto("http://localhost:5173/blockchain", { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outputDir, "05_blockchain.png") });

  // 6. Capture Resource Requests
  console.log("Capturing 06_requests.png...");
  await page.goto("http://localhost:5173/resource-requests", { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outputDir, "06_requests.png") });

  // 7. Capture Warehouse Dashboard
  console.log("Capturing 07_warehouse.png...");
  await page.goto("http://localhost:5173/warehouse-dashboard", { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outputDir, "07_warehouse.png") });

  // 8. Capture Movements
  console.log("Capturing 08_movements.png...");
  await page.goto("http://localhost:5173/movements", { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outputDir, "08_movements.png") });

  // 9. Capture Resources
  console.log("Capturing 09_resources.png...");
  await page.goto("http://localhost:5173/resources", { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outputDir, "09_resources.png") });

  await browser.close();
  console.log("All presentation screenshots captured successfully in:", outputDir);
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});

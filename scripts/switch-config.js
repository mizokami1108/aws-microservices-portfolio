#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const configType = process.argv[2];

if (!configType) {
  console.error("Usage: node scripts/switch-config.js [dev|demo]");
  process.exit(1);
}

const sourceFile = path.join(
  __dirname,
  `../config/portfolio-config.${configType}.json`
);
const targetFile = path.join(__dirname, "../config/portfolio-config.json");

if (!fs.existsSync(sourceFile)) {
  console.error(`Configuration file not found: ${sourceFile}`);
  process.exit(1);
}

fs.copyFileSync(sourceFile, targetFile);
console.log(`Configuration switched to: ${configType}`);

// 設定内容を表示
const config = JSON.parse(fs.readFileSync(targetFile, "utf8"));
console.log("Current configuration:");
console.log(`- Environment: ${config.environment}`);
console.log(
  `- User Service: ${config.services.userService.desiredCount} tasks`
);
console.log(
  `- Product Service: ${config.services.productService.desiredCount} tasks`
);
console.log(
  `- Order Service: ${config.services.orderService.desiredCount} tasks`
);

#!/usr/bin/env node
const required = 22;
const major = parseInt(process.versions.node.split('.')[0], 10);
if (Number.isNaN(major)) {
  console.error('Unable to determine Node.js version.');
  process.exit(1);
}
if (major < required) {
  console.error(`Node.js >= ${required} is required. Current: ${process.versions.node}`);
  process.exit(1);
}
console.log(`Node.js ${process.versions.node} OK`);


/**
 * Utility script to generate a bcrypt hash for the admin password.
 *
 * Usage:
 *   npx tsx scripts/hash-password.ts "your-secure-password"
 *
 * Copy the output hash to your .env.local file as ADMIN_PASSWORD_HASH.
 */

import { hashSync } from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npx tsx scripts/hash-password.ts <password>");
  console.error('Example: npx tsx scripts/hash-password.ts "my-secure-password"');
  process.exit(1);
}

if (password.length < 8) {
  console.error("Error: Password must be at least 8 characters.");
  process.exit(1);
}

const hash = hashSync(password, 12);
const escapedHash = hash.replace(/\$/g, "\\$");

console.log("\n--- Bcrypt Hash Generated ---");
console.log(`\nPassword: ${password}`);
console.log(`Hash:     ${hash}`);
console.log("\nAdd this to your .env.local ($ signs are escaped with \\$):");
console.log(`ADMIN_PASSWORD_HASH="${escapedHash}"`);
console.log("");

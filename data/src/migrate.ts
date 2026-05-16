import { db } from "./db.js";
import schemaSql from "./schema.sql";

await db.query(schemaSql);
console.log("schema applied");
await db.end();

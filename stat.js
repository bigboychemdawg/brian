import Database from "better-sqlite3";
import { table } from "table";

const db = new Database("data/wallets.db");

const rows = db.prepare("SELECT address, points FROM wallets ORDER BY points DESC").all();

if (rows.length === 0) {
    console.log("❌ В базе данных нет данных о кошельках!");
    process.exit(0);
}

const tableData = [["Address", "Points"], ...rows.map(row => [row.address, row.points])];

console.log(table(tableData));

db.close();

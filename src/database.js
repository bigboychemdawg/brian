import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.resolve(__dirname, "../data/wallets.db"));

db.exec(`CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY UNIQUE,
    address TEXT UNIQUE,
    is_dev TEXT,
    api_key TEXT UNIQUE,
    brian_id TEXT UNIQUE,
    points INTEGER DEFAULT 0,
    last_used TEXT,
    updated_at TEXT,
    created_at TEXT
);`);

export function getWallet(address) {
    return db.prepare("SELECT * FROM wallets WHERE address = ?").get(address);
}

export function insertWallet(address) {
    const isDev = Math.random() < 0.5 ? "1" : "0";
    const timestamp = new Date().toISOString();
    db.prepare("INSERT INTO wallets (address, is_dev, created_at, updated_at) VALUES (?, ?, ?, ?)")
        .run(address, isDev, timestamp, timestamp);
}

export function updateWallet(walletEntry, field, value) {
    db.prepare(`UPDATE wallets SET ${field} = ?, updated_at = ? WHERE address = ?`)
        .run(value, new Date().toISOString(), walletEntry.address);
}

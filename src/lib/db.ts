import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "apex90.db");

// Singleton db instance in development to avoid multiple open file descriptors
declare global {
  // eslint-disable-next-line no-var
  var __apex_db__: DatabaseSync | undefined;
}

function getDatabase(): DatabaseSync {
  if (!global.__apex_db__) {
    const db = new DatabaseSync(dbPath);
    // Enable WAL mode for high concurrency
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA foreign_keys = ON;");
    initSchema(db);
    global.__apex_db__ = db;
  }
  return global.__apex_db__;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      fixture_id TEXT NOT NULL,
      league_name TEXT NOT NULL,
      league_country TEXT NOT NULL,
      league_logo TEXT NOT NULL,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      home_logo TEXT NOT NULL,
      away_logo TEXT NOT NULL,
      kickoff_time TEXT NOT NULL,
      date TEXT NOT NULL,
      market TEXT NOT NULL,
      pick TEXT NOT NULL,
      odds REAL NOT NULL,
      confidence INTEGER NOT NULL,
      analysis TEXT NOT NULL,
      is_vip INTEGER NOT NULL DEFAULT 0,
      is_banker INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PENDING',
      home_score INTEGER DEFAULT NULL,
      away_score INTEGER DEFAULT NULL,
      match_status TEXT NOT NULL DEFAULT 'NS',
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fixtures_cache (
      id TEXT PRIMARY KEY,
      league_name TEXT NOT NULL,
      league_country TEXT NOT NULL,
      league_logo TEXT NOT NULL,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      home_logo TEXT NOT NULL,
      away_logo TEXT NOT NULL,
      kickoff_time TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NS',
      home_score INTEGER DEFAULT NULL,
      away_score INTEGER DEFAULT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      amount REAL NOT NULL,
      plan TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      payhero_reference TEXT UNIQUE,
      checkout_request_id TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(date);
    CREATE INDEX IF NOT EXISTS idx_predictions_market ON predictions(market);
    CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status);
    CREATE INDEX IF NOT EXISTS idx_predictions_published ON predictions(published);
    CREATE INDEX IF NOT EXISTS idx_predictions_is_vip ON predictions(is_vip);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_phone ON subscriptions(phone);
  `);
}

export const db = getDatabase();

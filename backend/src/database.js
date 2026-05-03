import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'data', 'lifehelp.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功:', dbPath);
    initTables();
  }
});

function initTables() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        unit TEXT,
        shelf_life INTEGER,
        barcode TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`ALTER TABLE items ADD COLUMN barcode TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('添加barcode字段失败:', err.message);
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        warehouse_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        batch_number TEXT NOT NULL DEFAULT '',
        quantity INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
        FOREIGN KEY (item_id) REFERENCES items(id),
        UNIQUE(warehouse_id, item_id, batch_number)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        warehouse_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        operator TEXT,
        remark TEXT,
        batch_number TEXT,
        shelf_life INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
        FOREIGN KEY (item_id) REFERENCES items(id)
      )
    `, (err) => {
      if (err) {
        console.error('创建表失败:', err.message);
      } else {
        console.log('所有表创建/检查完成');
      }
    });
  });
}

export default db;

// functions for indexing the filesystem
// using sqlite3 database for creating
// an index of the files
//============================================================
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const os = require('os');

// function to create an sqlite3 db file if not exists
function createDB() {
    console.log('[Indexer] Creating database');
    const dbPath = path.join(__dirname,'data', 'systemIndex.db');
    if (!fs.existsSync(dbPath)) {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Connected to the system database');
        });
        db.close();
    }
}

// function to create a table if not exists
function createTable() {
    console.log('[Indexer] Creating table');
    const dbPath = path.join(__dirname,'data', 'systemIndex.db');
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('[Indexer] Connected to the system database');
    });
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS systemIndex (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT,
            size INTEGER,
            lastModified TEXT
        )`);
    });
    console.log('[Indexer] Table created');
}
// function to delete the database
function deleteDB() {
    console.log('[Indexer] Deleting database');
    const dbPath = path.join(__dirname,'data', 'systemIndex.db');
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }
}
// function to recursively index filesystem and inserting into the database
function createIndex() {
    console.log('[Indexer] Creating index');
    const dbPath = path.join(__dirname,'data', 'systemIndex.db');
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('[Indexer] Connected to the system database');
    });
    const rootPath = path.join(os.homedir());
    const walk = (dir) => {
        fs.readdir(dir, (err, files) => {
            if (err) {
                console.error(err);
            }
            files.forEach(file => {
                const filePath = path.join(dir, file);
                fs.stat(filePath, (err, stats) => {
                    if (err) {
                        console.error(err);
                    }
                    if (stats.isDirectory()) {
                        walk(filePath);
                    } else {
                        db.run(`INSERT INTO systemIndex (path, size, lastModified) VALUES (?, ?, ?)`, [filePath, stats.size, stats.mtime]);
                    }
                });
            });
        });
    };
    walk(rootPath);
}

// function to reindex the filesystem
const reindexSystem = () => {
    deleteDB();
    createDB();
    createTable();
    createIndex();
};

// function to search the database
const searchSystem = (query) => {
    return new Promise((resolve, reject) => {
        const dbPath = path.join(__dirname, 'data', 'systemIndex.db');
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error(err.message);
                reject(err);
            }
        });
        db.serialize(() => {
            const results = [];
            db.all(`SELECT * FROM systemIndex WHERE path LIKE ? LIMIT 20`, [`%${query}%`], (err, rows) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                rows.forEach(row => {
                    results.push(row);
                });
                resolve(JSON.stringify(results));
            });
        });
        db.close((err) => {
            if (err) {
                console.error(err.message);
                reject(err);
            }
        });
    });
};

module.exports = {
    reindexSystem,
    searchSystem
};
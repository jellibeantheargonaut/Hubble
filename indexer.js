// functions for indexing the filesystem
// using sqlite3 database for creating
// an index of the files
//============================================================
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const os = require('os');

//============================================================
// creating a list of directories to ignore while indexing
// including hidden directories
//============================================================
const ignoreDirs = [
    path.join(os.homedir(), '.Trash'),
    path.join(os.homedir(), '.vscode'),
    path.join(os.homedir(), '.config'),
    path.join(os.homedir(), '.cache'),
    path.join(os.homedir(), '.npm'),
    path.join(os.homedir(), '.node_modules'),
    path.join(os.homedir(), '.local'),
    path.join(os.homedir(), '.mozilla'),
    path.join(os.homedir(), '.cache'),
    path.join(os.homedir(), '.config'),
    path.join(os.homedir(), '.wine'),
    path.join(os.homedir(), 'Library'),
];

// function to create an sqlite3 db file if not exists
function createDB() {
    return new Promise((resolve, reject) => {
        console.log('[Indexer] Creating database');
        const dbPath = path.join(__dirname,'data','cache', 'systemIndex.db');
        if (!fs.existsSync(dbPath)) {
            const db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    reject(err.message);
                }
                console.log('Connected to the system database');
            });
        }
        resolve();
    });
}

// function to create a table if not exists
function createTable() {
    return new Promise((resolve, reject) => {
        console.log('[Indexer] Creating table');
        const dbPath = path.join(__dirname,'data','cache', 'systemIndex.db');
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err.message);
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
        resolve();
    });
}
// function to delete the database
function deleteDB() {
    new Promise((resolve, reject) => {
        console.log('[Indexer] Deleting database');
        const dbPath = path.join(__dirname,'data','cache', 'systemIndex.db');
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
        }
        resolve();
    });
}
// function to recursively index filesystem and inserting into the database
// ignoring the directories in the ignoreDirs array
function createIndex() {
    return new Promise((resolve, reject) => {
        console.log('[Indexer] Creating index');
        const dbPath = path.join(__dirname, 'data','cache', 'systemIndex.db');
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                const rootPath = os.homedir();
                const walk = (dir) => {
                    fs.readdir(dir, (err, files) => {
                        if (ignoreDirs.includes(dir)) {
                            console.log(`[Indexer] Ignoring directory: ${dir}`);
                            return;
                        }
                        if (err) {
                            console.error(err);
                            reject(err);
                        } else {
                            files.forEach(file => {
                                if (file.startsWith('.')) {
                                    console.log(`[Indexer] Ignoring file: ${file}`);
                                    return;
                                }
                                const filePath = path.join(dir, file);
                                fs.stat(filePath, (err, stats) => {
                                    if (err) {
                                        console.error(err);
                                        reject(err);
                                    } else {
                                        if (stats.isDirectory()) {
                                            walk(filePath);
                                        } else {
                                            db.run(`INSERT INTO systemIndex (path, size, lastModified) VALUES (?, ?, ?)`, [filePath, stats.size, stats.mtime], (err) => {
                                                if (err) {
                                                    console.error(err.message);
                                                    reject(err);
                                                }
                                            });
                                        }
                                    }
                                });
                            });
                        }
                    });
                };
                walk(rootPath);
            }
        });
    });
}

// function to reindex the filesystem
const reindexSystem = async () => {
    try {
        console.log('[Indexer] Reindexing system');
        await deleteDB();
        await createDB();
        await createTable();
        await createIndex();
        console.log('[Indexer] System reindexed');
    } catch (error) {
        console.error(error);
    }
};

// function to search the database
const searchSystem = (query) => {
    return new Promise((resolve, reject) => {
        const dbPath = path.join(__dirname, 'data','cache', 'systemIndex.db');
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
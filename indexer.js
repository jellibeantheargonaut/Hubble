// functions for indexing the filesystem
// using sqlite3 database for creating
// an index of the files
//============================================================
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const os = require('os');
const yaml = require('yaml');
const chokidar = require('chokidar');

// read the settings from yaml file
const defaultSettingsPath = path.join(__dirname, 'data','settings.yaml');
const settingsPath = path.join(os.homedir(), '.hubble', 'settings.yaml');
if (!fs.existsSync(settingsPath)) {
    if (!fs.existsSync(path.dirname(settingsPath))) {
        fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    }
    fs.copyFileSync(defaultSettingsPath, settingsPath);
}  
const settings = yaml.parse(fs.readFileSync(settingsPath, 'utf8'));

// function to create an sqlite3 db file if not exists
function createDB() {
    return new Promise((resolve, reject) => {
        console.log('[Indexer] Creating database');
        const dbPath = settings.index_file;
        if (!dbPath) {
            reject('Database path is undefined in settings');
            return;
        }
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err.message);
            } else {
                console.log('Connected to the system database');
                resolve();
            }
        });
    });
}

// function to create a table if not exists
function createTable() {
    return new Promise((resolve, reject) => {
        console.log('[Indexer] Creating table');
        const dbPath = settings.index_file;
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err.message);
            }
            console.log('[Indexer] Connected to the system database');
        });

        const fields = settings.index_schema.map(field => `${field.name} ${field.type}`).join(', ');

        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS ${settings.index_table} (
                ${fields}
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
        const dbPath = settings.index_file;
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
        const dbPath = settings.index_file;
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                const rootPath = os.homedir();
                const walk = (dir) => {
                    fs.readdir(dir, (err, files) => {
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
                                            db.run(`INSERT INTO systemIndex (path, size, mtime, ctime, atime ) VALUES (?, ?, ?, ?, ?)`, [filePath, stats.size, stats.mtime, stats.ctime, stats.atime], (err) => {
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
                
                settings.index_scopes.forEach(scope => {
                    const scopePath = scope.path.replace('~', os.homedir());
                    walk(scopePath);
                });
            }
        });
        console.log('[Indexer] Index created');
        resolve();
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
        const dbPath = path.join(settings.index_file);
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


// functions for watchdog events
//=============================================

//const watcher = chokidar.watch(settings.index_scopes.map(scope => scope.path.replace('~',os.homedir())), {
//    ignored: /(^|[\/\\])\../,
//    persistent: true
//});
//// function to handle the creation of a file in directories
//// in the include_scopes in settings file
//
//watcher
//.on('add', path => console.log(`File ${path} has been added`))
//.on('change', path => console.log(`File ${path} has been changed`))
//.on('unlink', path => console.log(`File ${path} has been removed`))
//.on('addDir', path => console.log(`Directory ${path} has been added`))
//.on('unlinkDir', path => console.log(`Directory ${path} has been removed`))
//.on('error', error => console.error(`Watcher error: ${error}`));

module.exports = {
    reindexSystem,
    searchSystem,
    createDB,
    createTable
};
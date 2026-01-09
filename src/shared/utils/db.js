// src/renderer/utils/db.js

const DB_NAME = 'BlockIdeDB';
const DB_VERSION = 2;
const STORES = {
    PROJECTS: 'projects',
    WORKSPACES: 'workspaces',
    EXTENSIONS: 'extensions',
    LIBRARIES: 'libraries'
};

let dbPromise = null;

function getDb() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject("Error opening IndexedDB.");

            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
                    db.createObjectStore(STORES.PROJECTS, { keyPath: 'name' });
                }
                if (!db.objectStoreNames.contains(STORES.WORKSPACES)) {
                    db.createObjectStore(STORES.WORKSPACES, { keyPath: 'name' });
                }
                if (!db.objectStoreNames.contains(STORES.EXTENSIONS)) {
                    db.createObjectStore(STORES.EXTENSIONS, { keyPath: 'name' });
                }
                if (!db.objectStoreNames.contains(STORES.LIBRARIES)) {
                    db.createObjectStore(STORES.LIBRARIES, { keyPath: 'projectName' }); 
                }
            };
        });
    }
    return dbPromise;
}

// --- Project Metadata ---
export async function getAllProjects() {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.PROJECTS, 'readonly');
        const store = transaction.objectStore(STORES.PROJECTS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Failed to get projects.");
    });
}

export async function saveProject(projectData) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.PROJECTS, 'readwrite');
        const store = transaction.objectStore(STORES.PROJECTS);
        const request = store.put(projectData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject("Failed to save project.");
    });
}

export async function deleteProjectByName(projectName) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.PROJECTS, STORES.WORKSPACES, STORES.EXTENSIONS], 'readwrite');
        transaction.objectStore(STORES.PROJECTS).delete(projectName);
        transaction.objectStore(STORES.WORKSPACES).delete(projectName);
        transaction.objectStore(STORES.EXTENSIONS).delete(projectName);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject("Failed to delete project.");
    });
}

// --- Workspace Data ---
export async function getWorkspace(projectName) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.WORKSPACES, 'readonly');
        const store = transaction.objectStore(STORES.WORKSPACES);
        const request = store.get(projectName);
        request.onsuccess = () => resolve(request.result ? request.result.data : null);
        request.onerror = () => reject("Failed to get workspace.");
    });
}

export async function saveWorkspace(projectName, workspaceData) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.WORKSPACES, 'readwrite');
        const store = transaction.objectStore(STORES.WORKSPACES);
        const request = store.put({ name: projectName, data: workspaceData });
        request.onsuccess = () => resolve();
        request.onerror = () => reject("Failed to save workspace.");
    });
}

// --- Extensions Data --- (Similar to Workspace)
export async function getExtensions(projectName) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const req = db.transaction(STORES.EXTENSIONS, 'readonly').objectStore(STORES.EXTENSIONS).get(projectName);
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => reject("Failed to get extensions.");
    });
}

export async function saveExtensions(projectName, extensionsArray) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const req = db.transaction(STORES.EXTENSIONS, 'readwrite').objectStore(STORES.EXTENSIONS).put({ name: projectName, data: extensionsArray });
        req.onsuccess = () => resolve();
        req.onerror = () => reject("Failed to save extensions.");
    });
}

export async function getLibraries(projectName) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const req = db.transaction(STORES.LIBRARIES, 'readonly').objectStore(STORES.LIBRARIES).get(projectName);
        req.onsuccess = () => resolve(req.result ? req.result.data : []);
        req.onerror = () => reject("Failed to get libraries.");
    });
}

export async function saveLibraries(projectName, librariesArray) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const req = db.transaction(STORES.LIBRARIES, 'readwrite').objectStore(STORES.LIBRARIES).put({ projectName: projectName, data: librariesArray });
        req.onsuccess = () => resolve();
        req.onerror = () => reject("Failed to save libraries.");
    });
}
(function () {
  const DB_NAME = "recm_db";
  const DB_VERSION = 4;
  const STORES = ["settings", "deals", "contacts", "properties", "contracts", "templates", "clauses", "tasks", "emails", "activityLogs", "backups", "documents", "emailTemplates", "calendarEvents", "errors", "notifications", "drafts"];

  function open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        STORES.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, { keyPath: "id" });
        });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function withStore(storeName, mode, callback) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = callback(store);
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getAll(storeName) {
    return withStore(storeName, "readonly", (store) => new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    }));
  }

  async function putMany(storeName, records) {
    return withStore(storeName, "readwrite", (store) => {
      (records || []).forEach((record) => store.put(record));
    });
  }

  async function clear(storeName) {
    return withStore(storeName, "readwrite", (store) => store.clear());
  }

  async function get(storeName, id) {
    return withStore(storeName, "readonly", (store) => new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    }));
  }

  async function snapshot() {
    const out = {};
    for (const storeName of STORES) out[storeName] = await getAll(storeName);
    return out;
  }

  window.DatabaseManager = { DB_NAME, DB_VERSION, STORES, open, get, getAll, putMany, clear, snapshot };
})();

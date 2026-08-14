(function () {
  function validateSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") throw new Error("Invalid backup data.");
    if (!snapshot.settings || !Array.isArray(snapshot.deals) || !Array.isArray(snapshot.templates)) throw new Error("Backup file is missing required collections.");
    return true;
  }

  function prepareBackup(snapshot) {
    const payload = snapshot && Object.prototype.hasOwnProperty.call(snapshot, "snapshot") ? snapshot.snapshot : snapshot;
    return {
      id: snapshot?.id || Utils.uid("bak"),
      type: snapshot?.type || "manual",
      timestamp: snapshot?.timestamp || new Date().toISOString(),
      version: 1,
      createdAt: new Date().toISOString(),
      encrypted: false,
      snapshot: Utils.deepClone(payload),
    };
  }

  function sanitizeText(value) {
    return String(value ?? "").replace(/\0/g, "");
  }

  window.SecurityManager = { validateSnapshot, prepareBackup, sanitizeText };
})();

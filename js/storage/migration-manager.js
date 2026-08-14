(function () {
  const LEGACY_KEY = "recm_state_v1";

  function fromLegacyState(legacy) {
    return {
      settings: [legacy.settings || {}].map((s, i) => ({ id: "settings", ...s }))[0],
      deals: legacy.deals || [],
      contacts: legacy.contacts || [],
      properties: legacy.properties || [],
      contracts: legacy.generated || [],
      templates: legacy.templates || [],
      clauses: legacy.clauses || [],
      tasks: legacy.tasks || [],
      emails: legacy.emails || [],
      emailTemplates: legacy.emailTemplates || [],
      activityLogs: legacy.auditLog || [],
      backups: legacy.backups || [],
      documents: legacy.documents || [],
      calendarEvents: legacy.calendarEvents || [],
    };
  }

  async function migrateIfNeeded() {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return false;
    let legacy;
    try {
      legacy = JSON.parse(raw);
    } catch {
      return false;
    }
    const snapshot = fromLegacyState(legacy);
    await DatabaseManager.putMany("settings", [snapshot.settings]);
    await DatabaseManager.putMany("deals", snapshot.deals);
    await DatabaseManager.putMany("contacts", snapshot.contacts);
    await DatabaseManager.putMany("properties", snapshot.properties);
    await DatabaseManager.putMany("contracts", snapshot.contracts);
    await DatabaseManager.putMany("templates", snapshot.templates);
    await DatabaseManager.putMany("clauses", snapshot.clauses);
    await DatabaseManager.putMany("tasks", snapshot.tasks);
    await DatabaseManager.putMany("emails", snapshot.emails);
    await DatabaseManager.putMany("emailTemplates", snapshot.emailTemplates);
    await DatabaseManager.putMany("activityLogs", snapshot.activityLogs);
    await DatabaseManager.putMany("backups", snapshot.backups);
    await DatabaseManager.putMany("documents", snapshot.documents);
    await DatabaseManager.putMany("calendarEvents", snapshot.calendarEvents);
    return true;
  }

  window.MigrationManager = { migrateIfNeeded, fromLegacyState };
})();

(function () {
  const LEGACY_KEY = "recm_state_v1";

  function stableRecordId(prefix, record, index) {
    if (record && typeof record.id === "string" && record.id.trim()) return record.id.trim();
    const tokens = [
      record?.filename,
      record?.name,
      record?.title,
      record?.subject,
      record?.dealId,
      record?.createdAt,
      record?.lastModified,
      record?.modifiedAt,
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean);
    const suffix = tokens.length ? tokens.join("_").replace(/[^a-zA-Z0-9._-]+/g, "_") : `legacy_${index + 1}`;
    return `${prefix}_${suffix}`;
  }

  function normalizeRecord(storeName, record, index) {
    if (!record || typeof record !== "object") return null;
    switch (storeName) {
      case "settings":
        return { id: "settings", ...record };
      case "contracts":
        return {
          id: stableRecordId("contract", record, index),
          ...record,
        };
      case "templates":
        return {
          id: stableRecordId("template", record, index),
          ...record,
        };
      case "activityLogs":
        return {
          id: stableRecordId("activity", record, index),
          ...record,
        };
      case "backups":
        return {
          id: stableRecordId("backup", record, index),
          ...record,
        };
      case "documents":
        return {
          id: stableRecordId("document", record, index),
          ...record,
        };
      case "emailTemplates":
        return {
          id: stableRecordId("emailtpl", record, index),
          ...record,
        };
      case "calendarEvents":
        return {
          id: stableRecordId("event", record, index),
          ...record,
        };
      case "deals":
        return {
          id: stableRecordId("deal", record, index),
          ...record,
        };
      case "contacts":
        return {
          id: stableRecordId("contact", record, index),
          ...record,
        };
      case "properties":
        return {
          id: stableRecordId("prop", record, index),
          ...record,
        };
      case "clauses":
        return {
          id: stableRecordId("clause", record, index),
          ...record,
        };
      case "tasks":
        return {
          id: stableRecordId("task", record, index),
          ...record,
        };
      case "emails":
        return {
          id: stableRecordId("email", record, index),
          ...record,
        };
      case "drafts":
        return record.id ? record : { id: "active_contract_draft", ...record };
      default:
        return record.id ? record : { id: stableRecordId(storeName, record, index), ...record };
    }
  }

  function normalizeRecords(storeName, records) {
    return (records || [])
      .map((record, index) => normalizeRecord(storeName, record, index))
      .filter(Boolean);
  }

  function fromLegacyState(legacy) {
    return {
      settings: [legacy.settings || {}].map((s, i) => ({ id: "settings", ...s }))[0],
      deals: normalizeRecords("deals", legacy.deals),
      contacts: normalizeRecords("contacts", legacy.contacts),
      properties: normalizeRecords("properties", legacy.properties),
      contracts: normalizeRecords("contracts", legacy.generated),
      templates: normalizeRecords("templates", legacy.templates),
      clauses: normalizeRecords("clauses", legacy.clauses),
      tasks: normalizeRecords("tasks", legacy.tasks),
      emails: normalizeRecords("emails", legacy.emails),
      emailTemplates: normalizeRecords("emailTemplates", legacy.emailTemplates),
      activityLogs: normalizeRecords("activityLogs", legacy.auditLog),
      backups: normalizeRecords("backups", legacy.backups),
      documents: normalizeRecords("documents", legacy.documents),
      calendarEvents: normalizeRecords("calendarEvents", legacy.calendarEvents),
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
    await DatabaseManager.putMany("settings", normalizeRecords("settings", [snapshot.settings]));
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

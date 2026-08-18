(function () {
  const KEY = "recm_state_v1";

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

  function normalizeStoreRecords(storeName, records) {
    const prefixMap = {
      deals: "deal",
      contacts: "contact",
      properties: "prop",
      clauses: "clause",
      emails: "email",
      emailTemplates: "emailtpl",
      tasks: "task",
      calendarEvents: "event",
      activityLogs: "activity",
      errors: "error",
      notifications: "notification",
      templates: "template",
      backups: "backup",
      contracts: "contract",
      documents: "document",
      drafts: "draft",
    };
    const prefix = prefixMap[storeName] || storeName.replace(/s$/, "") || "record";
    return (records || [])
      .map((record, index) => {
        if (!record || typeof record !== "object") return null;
        if (storeName === "settings") return { id: "settings", ...record };
        if (storeName === "drafts" && !record.id) return { id: "active_contract_draft", ...record };
        if (record.id && String(record.id).trim()) return record;
        return { id: stableRecordId(prefix, record, index), ...record };
      })
      .filter(Boolean);
  }

  const defaultState = () => ({
    settings: {
      darkMode: false,
      companyName: "Same Day Home Solutions",
      companyAddress: "",
      companyPhone: "",
      companyEmail: "",
      emailSignature: "",
      defaultEmailTemplates: {},
      reminderSettings: { enabled: true, daysBefore: 3 },
      calendarSettings: { weekStart: "Monday" },
      notificationPreferences: { inApp: true, email: false },
      defaultTitleCompany: "Preferred Title Company",
      currency: "USD",
      filenameFormat: "{contractType}_{buyer}_{property}_{price}_{date}.docx",
      defaultClosingPeriod: "30",
      validationConfig: {
        defaultRequiredFields: ["sellerName", "buyerName", "propertyAddress"],
        templateRequiredFields: {},
      },
    },
    deals: [],
    contacts: [],
    properties: [],
    clauses: [],
    emails: [],
    emailTemplates: [],
    tasks: [],
    reminders: [],
    calendarEvents: [],
    analytics: [],
      auditLog: [],
      errorHistory: [],
      notifications: [],
      templates: [],
      backups: [],
      generated: [],
    documents: [],
    drafts: [],
    ui: { activeDealId: null, activeTemplateId: null, draftContractType: "psa", activeContactId: null, activePropertyId: null, activeClauseId: null, activeEmailTemplateId: null, activeTaskId: null },
  });

  function loadLegacy() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed(defaultState());
    try {
      const parsed = JSON.parse(raw);
      return seed({ ...defaultState(), ...parsed });
    } catch {
      return seed(defaultState());
    }
  }

  async function initialize() {
    const migrated = await MigrationManager.migrateIfNeeded();
    if (migrated) localStorage.removeItem(KEY);
    const dbState = await load();
    return dbState;
  }

  async function load() {
    try {
      const snapshot = await DatabaseManager.snapshot();
      const state = defaultState();
      state.settings = snapshot.settings[0] || state.settings;
      state.deals = normalizeStoreRecords("deals", snapshot.deals);
      state.contacts = normalizeStoreRecords("contacts", snapshot.contacts);
      state.properties = normalizeStoreRecords("properties", snapshot.properties);
      state.clauses = normalizeStoreRecords("clauses", snapshot.clauses);
      state.emails = normalizeStoreRecords("emails", snapshot.emails);
      state.emailTemplates = normalizeStoreRecords("emailTemplates", snapshot.emailTemplates);
      state.tasks = normalizeStoreRecords("tasks", snapshot.tasks);
      state.reminders = state.reminders || [];
      state.calendarEvents = normalizeStoreRecords("calendarEvents", snapshot.calendarEvents);
      state.analytics = state.analytics || [];
      state.auditLog = normalizeStoreRecords("activityLogs", snapshot.activityLogs);
      state.errorHistory = normalizeStoreRecords("errors", snapshot.errors);
      state.notifications = normalizeStoreRecords("notifications", snapshot.notifications);
      state.templates = normalizeStoreRecords("templates", snapshot.templates);
      state.backups = normalizeStoreRecords("backups", snapshot.backups);
      state.generated = normalizeStoreRecords("contracts", snapshot.contracts);
      state.documents = normalizeStoreRecords("documents", snapshot.documents);
      state.drafts = normalizeStoreRecords("drafts", snapshot.drafts);
      return seed(state);
    } catch {
      return loadLegacy();
    }
  }

  function seed(state) {
    const definitionMap = Object.fromEntries((window.ContractDefinitions?.list() || []).map((contract) => [contract.id, contract]));
    state.deals = (state.deals || []).map((deal) => {
      const mappedType = window.ContractDefinitions?.resolveId(deal.contractType) || deal.contractType || "psa";
      const mappedLabel = definitionMap[mappedType]?.label || deal.contractTypeLabel || mappedType;
      return { ...deal, contractType: mappedType, contractTypeLabel: mappedLabel };
    });
    if (!state.templates || !state.templates.length) {
      const now = new Date().toISOString();
      state.templates = (window.ContractDefinitions?.list() || []).map((contract) => ({
        id: `tpl_${contract.id}`,
        type: contract.id,
        name: contract.label,
        version: 1,
        master: true,
        fileName: contract.templateFile,
        content: window.TemplateLibrary[contract.id === "psa_marketing" ? "psaMarketing" : contract.id](),
        createdAt: now,
        modifiedAt: now,
        archived: false,
        status: "Active",
        versions: [],
        backups: [],
      }));
    } else {
      state.templates = (state.templates || []).map((template) => {
        const contract = window.ContractDefinitions?.contractFromTemplateRef(template);
        if (!contract) return template;
        return { ...template, type: contract.id, name: contract.label, fileName: contract.templateFile, masterFile: contract.templateFile, content: template.content };
      });
      const now = new Date().toISOString();
      (window.ContractDefinitions?.list() || []).forEach((contract) => {
        if (!state.templates.some((item) => item.type === contract.id)) {
          const contentFactory = contract.id === "psa_marketing" ? "psaMarketing" : contract.id;
          state.templates.push({ id: `tpl_${contract.id}`, type: contract.id, name: contract.label, fileName: contract.templateFile, content: window.TemplateLibrary[contentFactory](), version: 1, master: true, createdAt: now, modifiedAt: now, archived: false, status: "Active", versions: [], backups: [] });
        }
      });
    }
    state.generated = normalizeStoreRecords("contracts", state.generated);
    state.documents = normalizeStoreRecords("documents", state.documents);
    state.backups = normalizeStoreRecords("backups", state.backups);
    state.templates = normalizeStoreRecords("templates", state.templates);
    state.emailTemplates = normalizeStoreRecords("emailTemplates", state.emailTemplates);
    state.drafts = normalizeStoreRecords("drafts", state.drafts);
    return state;
  }

  async function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
    await DatabaseManager.clear("settings");
    await DatabaseManager.putMany("settings", normalizeStoreRecords("settings", [{ id: "settings", ...state.settings }]));
    await Promise.all([
      DatabaseManager.putMany("deals", normalizeStoreRecords("deals", state.deals)),
      DatabaseManager.putMany("contacts", normalizeStoreRecords("contacts", state.contacts)),
      DatabaseManager.putMany("properties", normalizeStoreRecords("properties", state.properties)),
      DatabaseManager.putMany("clauses", normalizeStoreRecords("clauses", state.clauses)),
      DatabaseManager.putMany("emails", normalizeStoreRecords("emails", state.emails)),
      DatabaseManager.putMany("emailTemplates", normalizeStoreRecords("emailTemplates", state.emailTemplates)),
      DatabaseManager.putMany("tasks", normalizeStoreRecords("tasks", state.tasks)),
      DatabaseManager.putMany("calendarEvents", normalizeStoreRecords("calendarEvents", state.calendarEvents)),
      DatabaseManager.putMany("activityLogs", normalizeStoreRecords("activityLogs", state.auditLog)),
      DatabaseManager.putMany("errors", normalizeStoreRecords("errors", state.errorHistory)),
      DatabaseManager.putMany("notifications", normalizeStoreRecords("notifications", state.notifications)),
      DatabaseManager.putMany("templates", normalizeStoreRecords("templates", state.templates)),
      DatabaseManager.putMany("backups", normalizeStoreRecords("backups", state.backups)),
      DatabaseManager.putMany("contracts", normalizeStoreRecords("contracts", state.generated)),
      DatabaseManager.putMany("documents", normalizeStoreRecords("documents", state.documents)),
      DatabaseManager.putMany("drafts", normalizeStoreRecords("drafts", state.drafts)),
    ]);
  }

  function validateDraftRecord(record) {
    if (!record || typeof record !== "object") throw new Error("Draft data is missing.");
    if (record.id !== "active_contract_draft") throw new Error("Unknown draft record.");
    if (record.status === "completed" || record.status === "cleared" || record.status === "corrupted") return null;
    if (!record.deal || typeof record.deal !== "object") throw new Error("Draft deal data is invalid.");
    const allowedTypes = (window.ContractDefinitions?.list() || []).map((contract) => contract.id);
    const contractType = allowedTypes.includes(record.contractType) ? record.contractType : "psa";
    return {
      ...record,
      contractType,
      deal: DealEngine.normalize({ ...record.deal, contractType }),
      status: record.status || "draft",
      outputOptions: record.outputOptions || {},
      lastModified: record.lastModified || new Date().toISOString(),
    };
  }

  async function loadDraft() {
    const record = await DatabaseManager.get("drafts", "active_contract_draft");
    console.debug("[Autosave] Loaded draft record from IndexedDB", {
      store: "drafts",
      found: !!record,
      status: record?.status || "none",
      contractType: record?.contractType || "",
      lastModified: record?.lastModified || "",
    });
    if (!record) return null;
    return validateDraftRecord(record);
  }

  async function saveDraft(deal, outputOptions = {}) {
    const normalized = DealEngine.normalize(deal);
    const record = {
      id: "active_contract_draft",
      schemaVersion: 1,
      status: "draft",
      dealId: normalized.id,
      contractType: normalized.contractType,
      deal: normalized,
      outputOptions,
      lastModified: new Date().toISOString(),
    };
    await DatabaseManager.putMany("drafts", [record]);
    console.debug("[Autosave] Saved draft record to IndexedDB", {
      store: "drafts",
      id: record.id,
      dealId: record.dealId,
      contractType: record.contractType,
      lastModified: record.lastModified,
    });
    return record;
  }

  async function clearDraft(status = "cleared") {
    const record = {
      id: "active_contract_draft",
      schemaVersion: 1,
      status,
      lastModified: new Date().toISOString(),
    };
    await DatabaseManager.putMany("drafts", [record]);
    console.debug("[Autosave] Updated draft status in IndexedDB", {
      store: "drafts",
      id: record.id,
      status: record.status,
      lastModified: record.lastModified,
    });
    return record;
  }

  async function pushBackup(type, item) {
    const state = await load();
    const backup = SecurityManager.prepareBackup({
      id: Utils.uid("bak"),
      type,
      timestamp: new Date().toISOString(),
      snapshot: Utils.deepClone(item),
    });
    state.backups.unshift(backup);
    state.backups = state.backups.slice(0, 100);
    await save(state);
    return backup;
  }

  window.StorageService = { load, loadLegacy, save, defaultState, pushBackup, initialize, loadDraft, saveDraft, clearDraft };
})();

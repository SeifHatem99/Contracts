(function () {
  const KEY = "recm_state_v1";

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
      state.deals = snapshot.deals || [];
      state.contacts = snapshot.contacts || [];
      state.properties = snapshot.properties || [];
      state.clauses = snapshot.clauses || [];
      state.emails = snapshot.emails || [];
      state.emailTemplates = snapshot.emailTemplates || [];
      state.tasks = snapshot.tasks || [];
      state.reminders = state.reminders || [];
      state.calendarEvents = snapshot.calendarEvents || [];
      state.analytics = state.analytics || [];
      state.auditLog = snapshot.activityLogs || [];
      state.errorHistory = snapshot.errors || [];
      state.notifications = snapshot.notifications || [];
      state.templates = snapshot.templates || [];
      state.backups = snapshot.backups || [];
      state.generated = snapshot.contracts || [];
      state.documents = snapshot.documents || [];
      state.drafts = snapshot.drafts || [];
      return seed(state);
    } catch {
      return loadLegacy();
    }
  }

  function seed(state) {
    const templateAlias = {
      [`${"purchase"}_${"agreement"}`]: { type: "psa", name: "PSA", fileName: "PSA.docx", content: window.TemplateLibrary.psa() },
      [`${"cancellation"}_${"agreement"}`]: { type: "cancellation", name: "Cancellation Agreement", fileName: "Cancellation.docx", content: window.TemplateLibrary.cancellation() },
      [`${"price"}_${"addendum"}`]: { type: "addendum", name: "Addendum", fileName: "Addendum.docx", content: window.TemplateLibrary.addendum() },
      [`${"assignment"}_${"agreement"}`]: { type: "novation", name: "Novation", fileName: "Novation.docx", content: window.TemplateLibrary.novation() },
      addendum: { type: "addendum", name: "Addendum", fileName: "Addendum.docx", content: window.TemplateLibrary.addendum() },
      cancellation: { type: "cancellation", name: "Cancellation Agreement", fileName: "Cancellation.docx", content: window.TemplateLibrary.cancellation() },
    };
    state.deals = (state.deals || []).map((deal) => {
      const mappedType = templateAlias[deal.contractType]?.type || deal.contractType || "psa";
      const mappedLabel = templateAlias[deal.contractType]?.name || deal.contractTypeLabel || mappedType;
      return { ...deal, contractType: mappedType, contractTypeLabel: mappedLabel };
    });
    if (!state.templates || !state.templates.length) {
      const now = new Date().toISOString();
      state.templates = [
        { id: "tpl_psa", type: "psa", name: "PSA", version: 1, master: true, content: window.TemplateLibrary.psa(), createdAt: now, modifiedAt: now, archived: false, status: "Active", versions: [], backups: [] },
        { id: "tpl_psa_marketing", type: "psa_marketing", name: "PSA (with marketing)", version: 1, master: true, content: window.TemplateLibrary.psaMarketing(), createdAt: now, modifiedAt: now, archived: false, status: "Active", versions: [], backups: [] },
        { id: "tpl_aif", type: "aif", name: "AIF", version: 1, master: true, content: window.TemplateLibrary.aif(), createdAt: now, modifiedAt: now, archived: false, status: "Active", versions: [], backups: [] },
        { id: "tpl_novation", type: "novation", name: "Novation", version: 1, master: true, content: window.TemplateLibrary.novation(), createdAt: now, modifiedAt: now, archived: false, status: "Active", versions: [], backups: [] },
        { id: "tpl_addendum", type: "addendum", name: "Addendum", version: 1, master: true, fileName: "Addendum.docx", content: window.TemplateLibrary.addendum(), createdAt: now, modifiedAt: now, archived: false, status: "Active", versions: [], backups: [] },
        { id: "tpl_cancellation", type: "cancellation", name: "Cancellation Agreement", version: 1, master: true, fileName: "Cancellation.docx", content: window.TemplateLibrary.cancellation(), createdAt: now, modifiedAt: now, archived: false, status: "Active", versions: [], backups: [] },
      ];
    } else {
      state.templates = (state.templates || []).map((template) => {
        const mapped = templateAlias[template.type] || templateAlias[template.name];
        if (!mapped) return template;
        return { ...template, type: mapped.type, name: mapped.name, fileName: mapped.fileName, masterFile: mapped.fileName, content: mapped.content || template.content };
      });
      const now = new Date().toISOString();
      [
        { id: "tpl_addendum", type: "addendum", name: "Addendum", fileName: "Addendum.docx", content: window.TemplateLibrary.addendum() },
        { id: "tpl_cancellation", type: "cancellation", name: "Cancellation Agreement", fileName: "Cancellation.docx", content: window.TemplateLibrary.cancellation() },
      ].forEach((template) => {
        if (!state.templates.some((item) => item.type === template.type)) {
          state.templates.push({ ...template, version: 1, master: true, createdAt: now, modifiedAt: now, archived: false, status: "Active", versions: [], backups: [] });
        }
      });
    }
    return state;
  }

  async function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
    await DatabaseManager.clear("settings");
    await DatabaseManager.putMany("settings", [{ id: "settings", ...state.settings }]);
    await Promise.all([
      DatabaseManager.putMany("deals", state.deals || []),
      DatabaseManager.putMany("contacts", state.contacts || []),
      DatabaseManager.putMany("properties", state.properties || []),
      DatabaseManager.putMany("clauses", state.clauses || []),
      DatabaseManager.putMany("emails", state.emails || []),
      DatabaseManager.putMany("emailTemplates", state.emailTemplates || []),
      DatabaseManager.putMany("tasks", state.tasks || []),
      DatabaseManager.putMany("calendarEvents", state.calendarEvents || []),
      DatabaseManager.putMany("activityLogs", state.auditLog || []),
      DatabaseManager.putMany("errors", state.errorHistory || []),
      DatabaseManager.putMany("notifications", state.notifications || []),
      DatabaseManager.putMany("templates", state.templates || []),
      DatabaseManager.putMany("backups", state.backups || []),
      DatabaseManager.putMany("contracts", state.generated || []),
      DatabaseManager.putMany("documents", state.documents || []),
      DatabaseManager.putMany("drafts", state.drafts || []),
    ]);
  }

  function validateDraftRecord(record) {
    if (!record || typeof record !== "object") throw new Error("Draft data is missing.");
    if (record.id !== "active_contract_draft") throw new Error("Unknown draft record.");
    if (record.status === "completed" || record.status === "cleared" || record.status === "corrupted") return null;
    if (!record.deal || typeof record.deal !== "object") throw new Error("Draft deal data is invalid.");
    const allowedTypes = ["psa", "psa_marketing", "aif", "novation", "addendum", "cancellation"];
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

(function () {
  function ensureTemplates(state) {
    state.templates = (state.templates || []).map((template) => VersionManager.ensureTemplateShape(template));
    return state;
  }

  async function loadMasterText(template) {
    if (!template?.fileName || !window.TemplateLoader || !window.DocxZip) {
      return String(template?.content || "");
    }
    const buffer = await TemplateLoader.load(template);
    const entries = await DocxZip.parse(buffer);
    const xml = new TextDecoder().decode(entries["word/document.xml"]?.data || new Uint8Array());
    const text = xml.replace(/<[^>]+>/g, " ");
    return text.replace(/\{\{([^{}]+)\}\}/g, (_, token) => `{{${String(token || "").replace(/\s+/g, "")}}}`);
  }

  function classifyAgainstMap(placeholders, tokenMap) {
    return placeholders.map((placeholder) => ({
      ...placeholder,
      required: !!tokenMap[placeholder.name],
      missingData: tokenMap[placeholder.name] ? !tokenMap[placeholder.name].present : false,
      unknown: !tokenMap[placeholder.name],
      duplicate: placeholder.occurrences > 1,
      status: !tokenMap[placeholder.name] ? "Unknown" : !tokenMap[placeholder.name].present ? "Missing Data" : placeholder.occurrences > 1 ? "Duplicate" : "OK",
    }));
  }

  async function scanMasterTemplate(template, settings) {
    const text = await loadMasterText(template);
    const placeholders = PlaceholderScanner.scan(text);
    const normalizedDeal = DealEngine.normalize({
      contractType: template?.type || "psa",
      sellerName: "x",
      propertyAddress: "x",
      purchasePrice: 1,
      earnestMoneyDeposit: 1,
      cashAtCloseOfEscrow: 1,
      closeOfEscrowDays: "30",
      inspectionPeriodDays: "7",
      companyId: "",
      companyName: "",
      companyOwner: "",
      sellerSignature1: "x",
      sellerSignature2: "",
      name: "x",
      property: "x",
      date: "2026-07-16",
      body: "x",
    }, settings);
    const tokenMap = DealEngine.editableFieldMap(template?.type, normalizedDeal, settings);
    return classifyAgainstMap(placeholders, Object.fromEntries(Object.entries(tokenMap).map(([key, value]) => [key, { present: String(value || "").trim() !== "" }])));
  }

  function getTemplate(state, id) {
    return (state.templates || []).find((template) => template.id === id) || null;
  }

  function replaceMaster(state, templateId, newContent, changeNotes = "Replaced master template") {
    const template = getTemplate(state, templateId);
    if (!template) throw new Error("Missing template.");
    BackupManager.createBackup(template, "Backup before replace");
    VersionManager.archive(template, "Replaced with newer version");
    const copy = TemplateUtils.clone(template);
    copy.id = Utils.uid("tpl");
    copy.archived = false;
    copy.name = template.name;
    copy.content = newContent;
    copy.version = 1;
    copy.modifiedAt = TemplateUtils.now().iso;
    copy.createdAt = TemplateUtils.now().iso;
    copy.versions = [{
      version: 1,
      createdAt: copy.createdAt,
      createdTime: TemplateUtils.now().time,
      changeNotes,
      content: newContent,
      name: copy.name,
    }];
    copy.backups = [];
    state.templates.unshift(copy);
    return copy;
  }

  function deleteTemplate(state, templateId) {
    const template = getTemplate(state, templateId);
    if (!template) return false;
    BackupManager.createBackup(template, "Backup before delete");
    template.archived = true;
    template.status = "Deleted (Archived)";
    template.modifiedAt = TemplateUtils.now().iso;
    return true;
  }

  function scanTemplateContent(template, settings) {
    const requiredMap = PlaceholderProcessor.buildMap({ sellerName: "x", buyerName: "x", propertyAddress: "x", purchasePrice: 1, earnestMoney: 1, closingDate: "2026-07-16", contractDate: "2026-07-16" }, settings);
    const placeholders = PlaceholderScanner.scan(template.content);
    return PlaceholderScanner.classify(placeholders, Object.fromEntries(Object.entries(requiredMap).map(([key, value]) => [key, { present: value !== "" && value !== null && value !== undefined }])));
  }

  async function refreshTemplateMetadata(template, settings) {
    const scan = await scanMasterTemplate(template, settings);
    template.placeholderScan = scan;
    template.placeholderCount = scan.length;
    template.placeholderSource = "docx-master";
    template.placeholderRefreshedAt = TemplateUtils.now().iso;
    return scan;
  }

  window.TemplateManagerEngine = { ensureTemplates, getTemplate, replaceMaster, deleteTemplate, scanTemplate: scanTemplateContent, refreshTemplateMetadata };
})();

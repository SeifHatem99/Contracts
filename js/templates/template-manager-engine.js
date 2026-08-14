(function () {
  function ensureTemplates(state) {
    state.templates = (state.templates || []).map((template) => VersionManager.ensureTemplateShape(template));
    return state;
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

  function scanTemplate(template, settings) {
    const requiredMap = PlaceholderProcessor.buildMap({ sellerName: "x", buyerName: "x", propertyAddress: "x", purchasePrice: 1, earnestMoney: 1, closingDate: "2026-07-16", contractDate: "2026-07-16" }, settings);
    const placeholders = PlaceholderScanner.scan(template.content);
    return PlaceholderScanner.classify(placeholders, Object.fromEntries(Object.entries(requiredMap).map(([key, value]) => [key, { present: value !== "" && value !== null && value !== undefined }])));
  }

  window.TemplateManagerEngine = { ensureTemplates, getTemplate, replaceMaster, deleteTemplate, scanTemplate };
})();

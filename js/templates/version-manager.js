(function () {
  function ensureTemplateShape(template) {
    const now = TemplateUtils.now().iso;
    template.createdAt = template.createdAt || now;
    template.modifiedAt = template.modifiedAt || now;
    template.version = template.version || 1;
    template.archived = !!template.archived;
    template.status = template.status || "Active";
    template.versions = template.versions || [{
      version: template.version,
      createdAt: template.createdAt,
      createdTime: new Date(template.createdAt).toTimeString().slice(0, 8),
      changeNotes: "Initial template",
      content: template.content,
      name: template.name,
    }];
    template.backups = template.backups || [];
    return template;
  }

  function summarize(template) {
    const versions = template.versions || [];
    const backups = template.backups || [];
    return {
      currentVersion: template.version || 1,
      previousVersions: Math.max(0, versions.length - 1),
      backupCount: backups.length,
      placeholderCount: template.placeholderCount ?? PlaceholderScanner.scan(template.content).length,
      wordCount: TemplateUtils.wordCount(template.content),
      pageCount: TemplateUtils.pageCount(template.content),
    };
  }

  function recordVersion(template, changeNotes, contentOverride) {
    const current = TemplateUtils.now();
    const newVersion = (template.version || 1) + 1;
    template.versions = template.versions || [];
    template.versions.unshift({
      version: newVersion,
      createdAt: current.iso,
      createdTime: current.time,
      changeNotes: changeNotes || "Template updated",
      content: contentOverride ?? template.content,
      name: template.name,
    });
    template.version = newVersion;
    template.modifiedAt = current.iso;
    template.content = contentOverride ?? template.content;
    return template;
  }

  function restoreVersion(template, versionNumber) {
    const found = (template.versions || []).find((v) => String(v.version) === String(versionNumber));
    if (!found) throw new Error("Version not found.");
    template.content = found.content;
    template.name = found.name || template.name;
    template = recordVersion(template, `Restored version ${versionNumber}`, found.content);
    return template;
  }

  function duplicate(template) {
    const copy = TemplateUtils.clone(template);
    copy.id = Utils.uid("tpl");
    copy.name = `${template.name} Copy`;
    copy.version = 1;
    copy.createdAt = TemplateUtils.now().iso;
    copy.modifiedAt = copy.createdAt;
    copy.archived = false;
    copy.versions = [{
      version: 1,
      createdAt: copy.createdAt,
      createdTime: TemplateUtils.now().time,
      changeNotes: "Duplicated template",
      content: copy.content,
      name: copy.name,
    }];
    copy.backups = [];
    return copy;
  }

  function archive(template, reason = "Replaced template") {
    template.archived = true;
    template.status = `Archived`;
    template.modifiedAt = TemplateUtils.now().iso;
    template.archiveNote = reason;
    return template;
  }

  window.VersionManager = { ensureTemplateShape, summarize, recordVersion, restoreVersion, duplicate, archive };
})();

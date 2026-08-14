(function () {
  function createBackup(template, reason = "Backup") {
    template.backups = template.backups || [];
    const now = TemplateUtils.now();
    const backup = {
      id: Utils.uid("bak"),
      createdAt: now.iso,
      createdDate: now.date,
      createdTime: now.time,
      reason,
      version: template.version || 1,
      name: template.name,
      content: template.content,
    };
    template.backups.unshift(backup);
    return backup;
  }

  function restoreBackup(template, backupId) {
    const backup = (template.backups || []).find((b) => b.id === backupId);
    if (!backup) throw new Error("Backup not found.");
    template.content = backup.content;
    template.name = backup.name;
    VersionManager.recordVersion(template, `Restored backup ${backup.version}`, backup.content);
    return template;
  }

  window.BackupManager = { createBackup, restoreBackup };
})();

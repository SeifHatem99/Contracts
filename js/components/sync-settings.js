(function () {
  function renderSync(state) {
    const sync = SyncManager.status(state);
    const view = Utils.query("#viewContainer");
    view.innerHTML = `
      <div class="section-title"><h3>Sync Settings</h3></div>
      <div class="grid cols-2">
        <div class="card">
          <div class="review-grid">
            <div class="review-row"><span>Sync Status</span><strong>${sync.lastSync ? "Synced" : "Not synced"}</strong></div>
            <div class="review-row"><span>Last Backup</span><strong>${Utils.formatDate(sync.lastBackup)}</strong></div>
            <div class="review-row"><span>Last Sync</span><strong>${Utils.formatDate(sync.lastSync)}</strong></div>
            <div class="review-row"><span>Data Size</span><strong>${Math.round(sync.dataSize / 1024)} KB</strong></div>
          </div>
          <div class="toolbar" style="margin-top:16px;">
            <button class="btn btn-primary" id="syncNow">Sync Now</button>
            <button class="btn btn-secondary" id="createBackupNow">Create Backup</button>
          </div>
        </div>
        <div class="card">
          <div class="section-title"><h3>Future Providers</h3></div>
          <div class="review-grid">
            ${Object.values(sync.providers).map((p) => `<div class="review-row"><span>${Utils.escapeHtml(p.name)}</span><strong>${p.connected ? "Ready" : "Prepared"}</strong></div>`).join("")}
          </div>
          <div class="muted" style="margin-top:12px;">Google Drive, Dropbox, OneDrive, and Custom API sync providers are prepared for future integration.</div>
        </div>
      </div>
      <div class="card" style="margin-top:18px;">
        <div class="section-title"><h3>Conflict Management</h3></div>
        <div class="muted">Conflicts can be detected and resolved as Keep Local, Keep Remote, or Create Copy when future remote sync sources are connected.</div>
      </div>
    `;
  }

  window.SyncSettingsView = { renderSync };
})();

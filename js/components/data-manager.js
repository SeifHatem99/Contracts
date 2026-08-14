(function () {
  function renderData(state) {
    const view = Utils.query("#viewContainer");
    view.innerHTML = `
      <div class="section-title"><h3>Data Management</h3></div>
      <div class="grid cols-2">
        <div class="card">
          <div class="section-title"><h3>Import / Export</h3></div>
          <div class="toolbar">
            <button class="btn btn-primary" id="exportAllData">Export All Data</button>
            <button class="btn btn-secondary" id="exportContacts">Export Contacts</button>
            <button class="btn btn-secondary" id="exportDeals">Export Deals</button>
            <button class="btn btn-secondary" id="exportTemplates">Export Templates</button>
            <button class="btn btn-secondary" id="exportReports">Export Reports</button>
          </div>
          <div class="toolbar" style="margin-top:12px;">
            <input type="file" id="importDataFile" accept="application/json" />
            <button class="btn btn-secondary" id="importDataBtn">Import Backup</button>
          </div>
        </div>
      <div class="card">
          <div class="section-title"><h3>Backup System</h3></div>
          <div class="toolbar">
            <button class="btn btn-primary" id="manualBackup">Manual Backup</button>
            <button class="btn btn-secondary" id="restoreLatestBackup">Restore Latest</button>
          </div>
          <div class="review-grid" style="margin-top:14px;">
            ${(state.backups || []).slice(0, 10).map((b) => `
              <div class="card" style="box-shadow:none;">
                <div class="review-row"><span>${Utils.escapeHtml(b.type)}</span><strong>${Utils.formatDate(b.timestamp)}</strong></div>
                <div class="muted">Backup ID: ${Utils.escapeHtml(b.id)}</div>
                <div class="toolbar" style="justify-content:flex-end; margin-top:10px;">
                  <button class="btn btn-secondary" data-backup-download="${b.id}">Download</button>
                  <button class="btn btn-secondary" data-backup-restore="${b.id}">Restore</button>
                  <button class="btn btn-secondary" data-backup-delete="${b.id}">Delete</button>
                </div>
              </div>
            `).join("") || `<div class="muted">No backups yet.</div>`}
          </div>
        </div>
      </div>
    `;
  }

  window.DataManagerView = { renderData };
})();

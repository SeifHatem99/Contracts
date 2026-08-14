(function () {
  function renderDiagnostics(state) {
    const view = Utils.query("#viewContainer");
    const snapshotSize = new Blob([JSON.stringify(state)]).size;
    const backups = (state.backups || []).slice(0, 5);
    const errors = ErrorManager.list(state).slice(0, 10);
    const issues = [];
    if (!window.indexedDB) issues.push("IndexedDB is unavailable in this browser.");
    if (!state.templates || !state.templates.length) issues.push("No templates are loaded.");
    if (!state.deals || !state.deals.length) issues.push("No deals exist yet.");
    if (!state.settings?.companyName) issues.push("Company name is missing.");
    if (!state.backups || !state.backups.length) issues.push("No backups have been created.");
    if (errors.length) issues.push(`There are ${errors.length} recent error records that should be reviewed.`);

    view.innerHTML = `
      <div class="section-title">
        <h3>Application Health</h3>
        <div class="toolbar">
          <button class="btn btn-secondary" id="refreshDiagnostics">Refresh</button>
          <button class="btn btn-secondary" id="clearErrorHistory">Clear Error History</button>
        </div>
      </div>
      <div class="grid cols-4">
        <div class="card stat"><div><h3>Database</h3><strong>${window.indexedDB ? "Ready" : "Unavailable"}</strong></div></div>
        <div class="card stat"><div><h3>Storage</h3><strong>${Math.round(snapshotSize / 1024)} KB</strong></div></div>
        <div class="card stat"><div><h3>Deals</h3><strong>${(state.deals || []).length}</strong></div></div>
        <div class="card stat"><div><h3>Templates</h3><strong>${(state.templates || []).length}</strong></div></div>
      </div>
      <div class="grid cols-2" style="margin-top:18px;">
        <div class="card">
          <div class="section-title"><h3>System Status</h3></div>
          <div class="review-grid">
            <div class="review-row"><span>Last Backup</span><strong>${Utils.formatDate(backups[0]?.timestamp || "")}</strong></div>
            <div class="review-row"><span>Recent Errors</span><strong>${errors.length}</strong></div>
            <div class="review-row"><span>Generated Documents</span><strong>${(state.generated || []).length}</strong></div>
          </div>
        </div>
        <div class="card">
          <div class="section-title"><h3>Potential Problems</h3></div>
          <div class="review-grid">
            ${issues.length ? issues.map((issue) => `<div class="review-row"><span>${Utils.escapeHtml(issue)}</span><strong>Review</strong></div>`).join("") : `<div class="muted">No current issues detected.</div>`}
          </div>
        </div>
      </div>
      <div class="grid cols-2" style="margin-top:18px;">
        <div class="card">
          <div class="section-title"><h3>Backup History</h3></div>
          <div class="review-grid">
            ${backups.map((backup) => `<div class="review-row"><span>${Utils.escapeHtml(backup.type || "backup")}</span><strong>${Utils.formatDate(backup.timestamp)}</strong></div>`).join("") || `<div class="muted">No backups available.</div>`}
          </div>
        </div>
        <div class="card">
          <div class="section-title"><h3>Error History</h3></div>
          <div class="review-grid">
            ${errors.map((error) => `
              <div class="card" style="box-shadow:none;">
                <div class="review-row"><span>${Utils.escapeHtml(error.context)}</span><strong>${Utils.escapeHtml(`${error.date} ${error.time}`)}</strong></div>
                <div>${Utils.escapeHtml(error.message)}</div>
                <div class="muted" style="margin-top:6px;">${Utils.escapeHtml(error.suggestion)}</div>
              </div>
            `).join("") || `<div class="muted">No errors recorded.</div>`}
          </div>
        </div>
      </div>
    `;
  }

  window.DiagnosticsView = { renderDiagnostics };
})();

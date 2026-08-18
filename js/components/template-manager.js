(function () {
  function renderTemplateManager(state) {
    TemplateManagerEngine.ensureTemplates(state);
    const view = Utils.query("#viewContainer");
    view.innerHTML = `
      <div class="card"><h3>Refreshing template metadata...</h3><p class="muted">Scanning current DOCX masters.</p></div>
    `;
    void renderTemplateManagerAsync(state, view);
  }

  async function renderTemplateManagerAsync(state, view) {
    const templates = state.templates.filter((template) => !template.archived);
    await Promise.all(templates.map((template) => TemplateManagerEngine.refreshTemplateMetadata(template, state.settings).catch(() => null)));
    view.innerHTML = `
      <div class="section-title">
        <h3>Template Manager</h3>
        <div class="toolbar">
          <button class="btn btn-secondary" id="backupTemplates">Backup All</button>
          <button class="btn btn-primary" id="newTemplate">Duplicate Template</button>
        </div>
      </div>
      <div class="grid cols-2">
        ${templates.map((template) => {
          const summary = VersionManager.summarize(template);
          return `
            <div class="card">
              <div class="section-title">
                <div>
                  <h3>${Utils.escapeHtml(template.name)}</h3>
                  <div class="muted">${Utils.escapeHtml(template.type)}</div>
                </div>
                <span class="pill">${Utils.escapeHtml(template.status || "Active")}</span>
              </div>
              <div class="review-grid">
                <div class="review-row"><span>Current Version</span><strong>${summary.currentVersion}</strong></div>
                <div class="review-row"><span>Previous Versions</span><strong>${summary.previousVersions}</strong></div>
                <div class="review-row"><span>Last Modified</span><strong>${Utils.formatDate(template.modifiedAt || template.createdAt)}</strong></div>
                <div class="review-row"><span>Placeholder Count</span><strong>${summary.placeholderCount}</strong></div>
                <div class="review-row"><span>Word Count</span><strong>${summary.wordCount}</strong></div>
                <div class="review-row"><span>Page Count</span><strong>${summary.pageCount}</strong></div>
                <div class="review-row"><span>Backups</span><strong>${(template.backups || []).length}</strong></div>
              </div>
              <div class="toolbar" style="margin-top:16px; justify-content:space-between; flex-wrap:wrap;">
                <button class="btn btn-secondary" data-open-template="${template.id}">Open</button>
                <button class="btn btn-secondary" data-edit-template="${template.id}">Edit</button>
                <button class="btn btn-secondary" data-version-history="${template.id}">Version History</button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
      <div class="grid cols-2" style="margin-top:18px;">
        <div class="card">
          <div class="section-title"><h3>Placeholder Scanner</h3></div>
          <div class="muted">Open a template to inspect placeholder usage and validation flags.</div>
        </div>
        <div class="card">
          <div class="section-title"><h3>Archive</h3></div>
          <div class="review-grid">
            ${(state.templates.filter((t) => t.archived) || []).map((t) => `<div class="review-row"><span>${Utils.escapeHtml(t.name)}</span><strong>${Utils.escapeHtml(t.status || "Archived")}</strong></div>`).join("") || `<div class="muted">No archived templates.</div>`}
          </div>
        </div>
      </div>
    `;
  }

  async function openTemplate(template, state) {
    const scanner = await TemplateManagerEngine.refreshTemplateMetadata(template, state.settings).catch(() => TemplateManagerEngine.scanTemplate(template, state.settings));
    UI.modal(`
      <div class="modal-header">
        <div>
          <h3>${Utils.escapeHtml(template.name)}</h3>
          <p class="muted">Contract Type: ${Utils.escapeHtml(template.type)}</p>
        </div>
        <button class="btn btn-secondary" data-close-modal>Close</button>
      </div>
      <div class="grid cols-2">
        <div class="card">
          <div class="review-grid">
            ${scanner.map((p) => `<div class="review-row"><span>${Utils.escapeHtml(p.name)}</span><strong>${p.occurrences} / ${Utils.escapeHtml(p.status)}</strong></div>`).join("") || `<div class="muted">No placeholders detected.</div>`}
          </div>
        </div>
        <div class="card">
          <div class="section-title"><h3>Template Preview</h3></div>
          <pre style="white-space:pre-wrap; margin:0;">${Utils.escapeHtml(template.content)}</pre>
        </div>
      </div>
    `);
  }

  async function editTemplate(template, state) {
    const scanner = await TemplateManagerEngine.refreshTemplateMetadata(template, state.settings).catch(() => TemplateManagerEngine.scanTemplate(template, state.settings));
    UI.modal(`
      <div class="modal-header">
        <div>
          <h3>Edit Template</h3>
          <p class="muted">Versioning is automatic. Backups are created before save.</p>
        </div>
        <button class="btn btn-secondary" data-close-modal>Close</button>
      </div>
      <div class="form-layout">
        <div class="field"><label>Name</label><input id="tplName" value="${Utils.escapeHtml(template.name)}"></div>
        <div class="field"><label>Change Notes</label><input id="tplNotes" value="Template edited"></div>
        <div class="field"><label>Content</label><textarea id="tplContent" rows="18">${Utils.escapeHtml(template.content)}</textarea></div>
      </div>
      <div class="grid cols-2" style="margin-top:18px;">
        <div class="card">
          <div class="section-title"><h3>Placeholder Manager</h3></div>
          <div class="review-grid">
            ${scanner.map((p) => `<div class="review-row"><span>${Utils.escapeHtml(p.name)}</span><strong>${p.occurrences} • ${Utils.escapeHtml(p.status)}</strong></div>`).join("") || `<div class="muted">No placeholders detected.</div>`}
          </div>
        </div>
        <div class="card">
          <div class="section-title"><h3>Version Info</h3></div>
          <div class="review-grid">
            <div class="review-row"><span>Current Version</span><strong>${template.version}</strong></div>
            <div class="review-row"><span>Last Modified</span><strong>${Utils.formatDate(template.modifiedAt || template.createdAt)}</strong></div>
            <div class="review-row"><span>Status</span><strong>${Utils.escapeHtml(template.status || "Active")}</strong></div>
          </div>
        </div>
      </div>
      <div class="toolbar" style="margin-top:18px; justify-content:flex-end; flex-wrap:wrap;">
        <button class="btn btn-secondary" id="duplicateTemplate">Duplicate</button>
        <button class="btn btn-secondary" id="replaceTemplate">Replace Template</button>
        <button class="btn btn-secondary" id="restoreTemplate">Restore Previous Version</button>
        <button class="btn btn-secondary" id="deleteTemplate">Delete</button>
        <button class="btn btn-primary" id="saveTemplate">Save Template</button>
      </div>
    `);
  }

  function versionHistory(template, state) {
    const versions = template.versions || [];
    UI.modal(`
      <div class="modal-header">
        <div>
          <h3>Version History</h3>
          <p class="muted">${Utils.escapeHtml(template.name)}</p>
        </div>
        <button class="btn btn-secondary" data-close-modal>Close</button>
      </div>
      <div class="form-layout">
        <div class="card">
          <div class="section-title"><h3>Versions</h3></div>
          <div class="review-grid">
            ${versions.map((version) => `
              <div class="card" style="box-shadow:none;">
                <div class="review-row"><span>Version ${version.version}</span><strong>${Utils.formatDate(version.createdAt)} ${version.createdTime || ""}</strong></div>
                <div class="muted" style="margin-bottom:10px;">${Utils.escapeHtml(version.changeNotes || "No notes")}</div>
                <div class="toolbar" style="justify-content:flex-end; flex-wrap:wrap;">
                  <button class="btn btn-secondary" data-version-restore="${version.version}">Restore</button>
                  <button class="btn btn-secondary" data-version-download="${version.version}">Download</button>
                  <button class="btn btn-secondary" data-version-delete="${version.version}">Delete</button>
                </div>
              </div>
            `).join("") || `<div class="muted">No version history.</div>`}
          </div>
        </div>
        <div class="card">
          <div class="section-title"><h3>Compare Versions</h3></div>
          <div class="fields">
            <div class="field"><label>Version A</label><select id="compareVersionA">${versions.map((v) => `<option value="${v.version}">${v.version}</option>`).join("")}</select></div>
            <div class="field"><label>Version B</label><select id="compareVersionB">${versions.map((v) => `<option value="${v.version}">${v.version}</option>`).join("")}</select></div>
          </div>
          <div class="toolbar" style="margin-top:16px; justify-content:flex-end;">
            <button class="btn btn-primary" id="compareVersions">Compare</button>
          </div>
        </div>
      </div>
    `);
  }

  window.TemplateManagerView = { renderTemplateManager, editTemplate, openTemplate, versionHistory };
})();

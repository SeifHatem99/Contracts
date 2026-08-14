(function () {
  function render(state) {
    const files = [
      ...((state.templates || []).map((item) => ({ type: "Template", name: item.name, date: item.modifiedAt || item.createdAt, status: item.status || "Active", id: item.id }))),
      ...((state.generated || []).map((item) => ({ type: "Generated", name: item.filename, date: item.createdAt, status: item.status || "Generated", id: item.id }))),
      ...((state.backups || []).map((item) => ({ type: "Backup", name: item.id, date: item.timestamp || item.createdAt, status: item.type || "backup", id: item.id }))),
      ...((state.documents || []).map((item) => ({ type: "Archive", name: item.filename, date: item.createdAt, status: item.status || "Archived", id: item.id }))),
    ];
    const view = Utils.query("#viewContainer");
    view.innerHTML = `
      <div class="section-title">
        <h3>File Center</h3>
        <div class="toolbar">
          <input id="fileSearch" placeholder="Search files" class="input-search" />
        </div>
      </div>
      <div class="card">
        <table class="table">
          <thead><tr><th>Type</th><th>Name</th><th>Date</th><th>Status</th></tr></thead>
          <tbody id="fileResults">
            ${renderRows(files)}
          </tbody>
        </table>
      </div>
    `;
    const input = Utils.query("#fileSearch");
    const results = Utils.query("#fileResults");
    if (input) input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      const filtered = !q ? files : files.filter((file) => [file.type, file.name, file.status].join(" ").toLowerCase().includes(q));
      results.innerHTML = renderRows(filtered);
    });
  }

  function renderRows(files) {
    return files.map((file) => `
      <tr>
        <td>${Utils.escapeHtml(file.type)}</td>
        <td>${Utils.escapeHtml(file.name)}</td>
        <td>${Utils.formatDate(file.date)}</td>
        <td>${Utils.escapeHtml(file.status)}</td>
      </tr>
    `).join("") || `<tr><td colspan="4" class="muted">No files found.</td></tr>`;
  }

  window.FileCenterView = { render, renderRows };
})();

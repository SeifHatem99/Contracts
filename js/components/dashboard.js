(function () {
  function renderDashboard(state) {
    const view = Utils.query("#viewContainer");
    const deals = state.deals || [];
    const templates = state.templates || [];
    const recent = SearchEngine.sortByRecent(deals).slice(0, 5);
    view.innerHTML = `
      <div class="grid cols-2">
        <div class="card">
          <div class="section-title"><h3>Create Contract</h3></div>
          <p class="muted">Start a focused contract workflow using the current master templates.</p>
          <div class="toolbar" style="margin-top:18px;">
            <button class="btn btn-primary" data-view="contract">Create Contract</button>
            <button class="btn btn-secondary" data-view="templates">Templates</button>
            <button class="btn btn-secondary" data-view="settings">Settings</button>
          </div>
        </div>
        <div class="card">
          <div class="section-title"><h3>Open Recent</h3><span class="pill">${deals.length} total</span></div>
          <div class="review-grid">
            ${recent.map((deal) => `
              <div class="review-row" data-open-deal="${deal.id}">
                <span>${Utils.escapeHtml(deal.propertyAddress || deal.property || "Untitled Deal")}<div class="muted">${Utils.escapeHtml(deal.sellerName || deal.name || "No seller")} - ${Utils.escapeHtml(deal.contractTypeLabel || deal.contractType || "")}</div></span>
                <strong>${Utils.escapeHtml(deal.status || "Draft")}</strong>
              </div>
            `).join("") || `<div class="muted">No recent deals yet.</div>`}
          </div>
        </div>
      </div>
      <div class="grid cols-2" style="margin-top:18px;">
        <div class="card">
          <div class="section-title"><h3>Templates</h3><span class="pill">${templates.length}</span></div>
          <div class="review-grid">
            ${templates.slice(0, 4).map((template) => `<div class="review-row"><span>${Utils.escapeHtml(template.name)}</span><strong>${Utils.escapeHtml(template.status || "Active")}</strong></div>`).join("") || `<div class="muted">No templates configured.</div>`}
          </div>
        </div>
        <div class="card">
          <div class="section-title"><h3>Settings</h3></div>
          <p class="muted">Company name, title company, defaults, and launch preferences.</p>
          <div class="toolbar" style="margin-top:18px;">
            <button class="btn btn-secondary" data-view="settings">Open Settings</button>
          </div>
        </div>
      </div>
    `;
  }

  window.DashboardView = { renderDashboard };
})();

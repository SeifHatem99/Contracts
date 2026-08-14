(function () {
  function renderSearch(state) {
    const view = Utils.query("#viewContainer");
    view.innerHTML = `
      <div class="section-title">
        <h3>Search Deals</h3>
        <div class="toolbar">
          <select id="searchStatus"><option value="">All Statuses</option>${DealEngine.statuses().map((s) => `<option value="${s}">${s}</option>`).join("")}</select>
          <input id="searchInput" class="input-search" placeholder="Seller, buyer, property, price, date, type" />
        </div>
      </div>
      <div class="card">
        <table class="table">
          <thead><tr><th>Status</th><th>Seller</th><th>Buyer</th><th>Property</th><th>Date</th><th>Type</th></tr></thead>
          <tbody id="searchResults">
            ${renderRows(state.deals)}
          </tbody>
        </table>
      </div>
      <div id="globalSearchResults" class="grid cols-2" style="margin-top:18px;">
        ${renderGlobalSections(state, "")}
      </div>
    `;
  }

  function renderRows(deals) {
    return deals.map((d) => `<tr data-open-deal="${d.id}"><td>${WorkflowManager.statusPill(d.status)}</td><td>${Utils.escapeHtml(d.sellerName)}</td><td>${Utils.escapeHtml(d.buyerName)}</td><td>${Utils.escapeHtml(d.propertyAddress)}</td><td>${Utils.formatDate(d.contractDate)}</td><td>${Utils.escapeHtml(d.contractTypeLabel)}</td></tr>`).join("") || `<tr><td colspan="6" class="muted">No matches found.</td></tr>`;
  }

  function renderGlobalSections(state, term) {
    const results = SearchEngine.queryAll(state, term);
    const section = (title, items, renderItem, empty = "No matches found.") => `
      <div class="card">
        <div class="section-title"><h3>${title}</h3><span class="pill">${items.length}</span></div>
        <div class="review-grid">
          ${items.slice(0, 5).map(renderItem).join("") || `<div class="muted">${empty}</div>`}
        </div>
      </div>
    `;
    return [
      section("Contacts", results.contacts, (c) => `<div class="review-row"><span>${Utils.escapeHtml(c.fullName)}</span><strong>${Utils.escapeHtml(c.category)}</strong></div>`),
      section("Properties", results.properties, (p) => `<div class="review-row"><span>${Utils.escapeHtml(p.propertyAddress)}</span><strong>${Utils.escapeHtml(p.city || "")}</strong></div>`),
      section("Templates", results.templates, (t) => `<div class="review-row"><span>${Utils.escapeHtml(t.name)}</span><strong>${Utils.escapeHtml(t.type)}</strong></div>`),
      section("Emails", results.emails || [], (e) => `<div class="review-row"><span>${Utils.escapeHtml(e.subject)}</span><strong>${Utils.formatDate(e.createdAt || "")}</strong></div>`),
    ].join("");
  }

  window.SearchView = { renderSearch, renderRows, renderGlobalSections };
})();

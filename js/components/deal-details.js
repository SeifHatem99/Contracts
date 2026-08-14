(function () {
  function renderDealDetails(state, deal) {
    const view = Utils.query("#viewContainer");
    const documents = DocumentManager.list(deal).filter((doc) => !doc.archived);
    const activities = ActivityLogger.list(deal);
    const notes = deal.notes || [];
    const emails = (state.emails || []).filter((email) => email.dealId === deal.id);
    const timeline = buildTimeline(activities, documents, notes, emails);
    view.innerHTML = `
      <div class="section-title">
        <div>
          <h3>${Utils.escapeHtml(deal.propertyAddress || "Deal Details")}</h3>
          <div class="muted">Deal ID: ${Utils.escapeHtml(deal.id)}</div>
        </div>
        <div class="toolbar">
          ${WorkflowManager.statusPill(deal.status)}
          <select id="dealStatusSelect">${DealEngine.statuses().map((status) => `<option value="${status}" ${status === deal.status ? "selected" : ""}>${status}</option>`).join("")}</select>
          <button class="btn btn-secondary" id="dealQuickGenerate">Generate</button>
          <button class="btn btn-secondary" id="dealGenerateEmail">Copy Email</button>
          <button class="btn btn-primary" id="openDealContract">Open Contract</button>
          <button class="btn btn-secondary" id="duplicateDeal">Duplicate Deal</button>
        </div>
      </div>
      <div class="grid cols-2">
        <div class="card">
          <div class="section-title"><h3>Deal Information</h3></div>
          <div class="review-grid">
            ${row("Seller", deal.sellerName)}
            ${row("Property", deal.propertyAddress || deal.property)}
            ${row("Status", deal.status)}
            ${row("Contract Type", deal.contractTypeLabel)}
          </div>
        </div>
        <div class="card">
          <div class="section-title"><h3>Financial Information</h3></div>
          <div class="review-grid">
            ${row("Purchase Price", FormattingEngine.currency(deal.purchasePrice, state.settings.currency))}
            ${row("Earnest Money", FormattingEngine.currency(deal.earnestMoneyDeposit || deal.earnestMoney, state.settings.currency))}
            ${row("Cash at Close", FormattingEngine.currency(deal.cashAtCloseOfEscrow, state.settings.currency))}
          </div>
        </div>
      </div>
      <div class="grid cols-3" style="margin-top:18px;">
        <div class="card">
          <div class="section-title"><h3>Contracts Generated</h3></div>
          <div class="review-grid">
            ${documents.map((doc) => `
              <div class="card" style="box-shadow:none;">
                <div class="review-row"><span>${Utils.escapeHtml(doc.filename)}</span><strong>${Utils.escapeHtml(doc.status || "Generated")}</strong></div>
                <div class="toolbar" style="justify-content:flex-end;">
                  <button class="btn btn-secondary" data-doc-compare-template="${doc.id}">Compare Template</button>
                  <button class="btn btn-secondary" data-doc-compare-previous="${doc.id}">Compare Previous</button>
                  <button class="btn btn-secondary" data-doc-rename="${doc.id}">Rename</button>
                  <button class="btn btn-secondary" data-doc-duplicate="${doc.id}">Duplicate</button>
                  <button class="btn btn-secondary" data-doc-archive="${doc.id}">Archive</button>
                  <button class="btn btn-secondary" data-doc-delete="${doc.id}">Delete</button>
                </div>
              </div>
            `).join("") || `<div class="muted">No generated documents yet.</div>`}
          </div>
        </div>
        <div class="card">
          <div class="section-title"><h3>Activity History</h3></div>
          <div class="review-grid">
            ${activities.map((act) => `<div class="review-row"><span>${Utils.escapeHtml(act.action)}<div class="muted">${Utils.escapeHtml(act.description)}</div></span><strong>${Utils.escapeHtml(act.date)} ${Utils.escapeHtml(act.time)}</strong></div>`).join("") || `<div class="muted">No activity yet.</div>`}
          </div>
        </div>
        <div class="card">
          <div class="section-title"><h3>Notes</h3></div>
          <div class="toolbar" style="margin-bottom:12px;">
            <select id="noteType"><option>Internal Notes</option><option>Important Warnings</option><option>Follow-up Notes</option></select>
            <input id="noteText" placeholder="Add a note" style="flex:1; min-width:200px;" />
            <button class="btn btn-primary" id="addNote">Add</button>
          </div>
          <div class="review-grid">
            ${notes.map((note) => `<div class="card" style="box-shadow:none;"><div class="review-row"><span>${Utils.escapeHtml(note.type)}</span><strong>${Utils.formatDate(note.timestamp)}</strong></div><div>${Utils.escapeHtml(note.text)}</div></div>`).join("") || `<div class="muted">No notes yet.</div>`}
          </div>
        </div>
      </div>
      <div class="grid cols-2" style="margin-top:18px;">
        <div class="card">
          <div class="section-title"><h3>Quick Actions</h3></div>
          <div class="toolbar" style="flex-wrap:wrap;">
            <button class="btn btn-secondary" id="openDealContractQuick">Open Contract</button>
            <button class="btn btn-secondary" id="jumpToEmails">Emails</button>
            <button class="btn btn-secondary" id="jumpToFiles">Files</button>
          </div>
        </div>
        <div class="card">
          <div class="section-title"><h3>Emails</h3></div>
          <div class="review-grid">
            ${emails.map((email) => `<div class="review-row"><span>${Utils.escapeHtml(email.subject)}</span><strong>${Utils.escapeHtml(email.status || email.type || "")}</strong></div>`).join("") || `<div class="muted">No emails linked to this deal.</div>`}
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:18px;">
        <div class="section-title"><h3>Timeline</h3></div>
        <div class="review-grid">
          ${timeline.map((event) => `<div class="review-row"><span>${Utils.escapeHtml(event.label)}<div class="muted">${Utils.escapeHtml(event.detail)}</div></span><strong>${Utils.escapeHtml(event.when)}</strong></div>`).join("") || `<div class="muted">No timeline events yet.</div>`}
        </div>
      </div>
    `;
  }

  function buildTimeline(activities, documents, notes, emails) {
    return [
      ...activities.map((entry) => ({ label: entry.action, detail: entry.description, when: `${entry.date} ${entry.time}` })),
      ...documents.map((doc) => ({ label: "Document", detail: doc.filename, when: Utils.formatDate(doc.createdAt) })),
      ...notes.map((note) => ({ label: `Note: ${note.type}`, detail: note.text, when: Utils.formatDate(note.timestamp) })),
      ...emails.map((email) => ({ label: `Email: ${email.subject}`, detail: email.status || "Draft", when: Utils.formatDate(email.createdAt) })),
    ].sort((a, b) => String(b.when).localeCompare(String(a.when))).slice(0, 20);
  }

  function row(label, value) {
    return `<div class="review-row"><span>${label}</span><strong>${Utils.escapeHtml(value || "-")}</strong></div>`;
  }

  window.DealDetailsView = { renderDealDetails };
})();

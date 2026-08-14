(function () {
  function renderEmails(state) {
    const view = Utils.query("#viewContainer");
    const templates = state.emailTemplates || [];
    const deals = state.deals || [];
    view.innerHTML = `
      <div class="section-title">
        <h3>Email Center</h3>
        <div class="toolbar">
          <select id="emailAssistantDeal">
            <option value="">Select deal for email</option>
            ${deals.map((deal) => `<option value="${deal.id}">${Utils.escapeHtml(deal.propertyAddress || deal.sellerName || deal.id)}</option>`).join("")}
          </select>
          <button class="btn btn-secondary" id="generateEmail">Copy Email</button>
          <button class="btn btn-primary" id="newEmailTemplate">New Email Template</button>
        </div>
      </div>
      <div class="grid cols-2">
        <div class="card">
          <table class="table">
            <thead><tr><th>Name</th><th>Version</th><th>Actions</th></tr></thead>
            <tbody>
              ${templates.map((t) => `<tr data-email-template-id="${t.id}"><td>${Utils.escapeHtml(t.name)}</td><td>${t.version}</td><td><button class="btn btn-secondary" data-edit-email-template="${t.id}">Edit</button></td></tr>`).join("") || `<tr><td colspan="3" class="muted">No email templates yet.</td></tr>`}
            </tbody>
          </table>
        </div>
        <div class="card">
          <div class="section-title"><h3>Recent Emails</h3></div>
          <div class="review-grid">
            ${(state.emails || []).slice(0, 10).map((e) => `<div class="review-row"><span>${Utils.escapeHtml(e.subject)}</span><strong>${Utils.formatDate(e.createdAt)}</strong></div>`).join("") || `<div class="muted">No emails created yet.</div>`}
          </div>
        </div>
      </div>
    `;
  }

  function editEmailTemplate(template = EmailManagerEngine.normalize({})) {
    UI.modal(`
      <div class="modal-header"><div><h3>Email Template</h3><p class="muted">Templates drive professional contract communication.</p></div><button class="btn btn-secondary" data-close-modal>Close</button></div>
      <div class="form-layout">
        <div class="fields">
          <div class="field"><label>Name</label><input id="emailTemplateName" value="${Utils.escapeHtml(template.name)}"></div>
          <div class="field"><label>Subject</label><input id="emailTemplateSubject" value="${Utils.escapeHtml(template.subject)}"></div>
          <div class="field full"><label>Body</label><textarea id="emailTemplateBody" rows="12">${Utils.escapeHtml(template.body)}</textarea></div>
        </div>
        <div class="toolbar" style="justify-content:flex-end;">
          <button class="btn btn-secondary" id="duplicateEmailTemplate">Duplicate</button>
          <button class="btn btn-primary" id="saveEmailTemplate">Save Template</button>
        </div>
      </div>
    `);
  }

  function composeEmail(deal, template, settings) {
    return EmailManagerEngine.render(template, deal, settings);
  }

  async function copyAssistantEmail(deal, settings) {
    const sellerName = String(deal?.sellerName || deal?.name || "").trim();
    if (!sellerName) {
      UI.notify("Seller Name is required before copying the email.", "error");
      return false;
    }
    const email = EmailManagerEngine.generateAssistantEmail(deal, "formal", settings);
    const text = `Subject: ${email.subject}\n\n${email.body}`;
    try {
      await navigator.clipboard.writeText(text);
      UI.notify("Email copied", "success");
      return true;
    } catch {
      UI.notify("Copy failed. Please copy the email manually.", "error");
      return false;
    }
  }

  window.EmailCenterView = { renderEmails, editEmailTemplate, composeEmail, copyAssistantEmail };
})();

(function () {
  function renderContacts(state) {
    const view = Utils.query("#viewContainer");
    const contacts = state.contacts || [];
    view.innerHTML = `
      <div class="section-title"><h3>Contacts</h3><button class="btn btn-primary" id="addContactBtn">New Contact</button></div>
      <div class="grid cols-2">
        <div class="card">
          <table class="table">
            <thead><tr><th>Name</th><th>Category</th><th>Phone</th><th>Email</th></tr></thead>
            <tbody>
              ${contacts.map((c) => `<tr data-contact-id="${c.id}"><td>${Utils.escapeHtml(c.fullName)}</td><td>${Utils.escapeHtml(c.category)}</td><td>${Utils.escapeHtml(c.phone)}</td><td>${Utils.escapeHtml(c.email)}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">No contacts yet.</td></tr>`}
            </tbody>
          </table>
        </div>
        <div class="card">
          <div class="muted">Select a contact to edit, or use this page to keep frequently used sellers, buyers, title companies, and investors ready for reuse.</div>
        </div>
      </div>
    `;
  }

  function editContact(contact = ContactManagerEngine.create()) {
    UI.modal(`
      <div class="modal-header"><div><h3>Contact</h3><p class="muted">Saved contacts can autofill future deals.</p></div><button class="btn btn-secondary" data-close-modal>Close</button></div>
      <div class="form-layout">
        <div class="fields">
          <div class="field"><label>Category</label><select id="contactCategory">${ContactManagerEngine.categories.map((c) => `<option value="${c}" ${c === contact.category ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div class="field"><label>Full Name</label><input id="contactName" value="${Utils.escapeHtml(contact.fullName)}"></div>
          <div class="field"><label>Company Name</label><input id="contactCompany" value="${Utils.escapeHtml(contact.companyName)}"></div>
          <div class="field"><label>Phone</label><input id="contactPhone" value="${Utils.escapeHtml(contact.phone)}"></div>
          <div class="field"><label>Email</label><input id="contactEmail" value="${Utils.escapeHtml(contact.email)}"></div>
          <div class="field"><label>Address</label><input id="contactAddress" value="${Utils.escapeHtml(contact.address)}"></div>
          <div class="field full"><label>Notes</label><textarea id="contactNotes" rows="4">${Utils.escapeHtml(contact.notes)}</textarea></div>
        </div>
        <div class="toolbar" style="justify-content:flex-end;">
          <button class="btn btn-primary" id="saveContact">Save Contact</button>
        </div>
      </div>
    `);
  }

  window.ContactManagerView = { renderContacts, editContact };
})();

(function () {
  function renderProperties(state) {
    const view = Utils.query("#viewContainer");
    const properties = state.properties || [];
    view.innerHTML = `
      <div class="section-title"><h3>Properties</h3><button class="btn btn-primary" id="addPropertyBtn">New Property</button></div>
      <div class="card">
        <table class="table">
          <thead><tr><th>Address</th><th>City</th><th>County</th><th>APN</th></tr></thead>
          <tbody>
            ${properties.map((p) => `<tr data-property-id="${p.id}"><td>${Utils.escapeHtml(p.propertyAddress)}</td><td>${Utils.escapeHtml(p.city)}</td><td>${Utils.escapeHtml(p.county)}</td><td>${Utils.escapeHtml(p.apn)}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">No properties yet.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }

  function editProperty(property = PropertyManagerEngine.create()) {
    UI.modal(`
      <div class="modal-header"><div><h3>Property</h3><p class="muted">Reuse property records across deals.</p></div><button class="btn btn-secondary" data-close-modal>Close</button></div>
      <div class="form-layout">
        <div class="fields">
          <div class="field full"><label>Property Address</label><input id="propertyAddress" value="${Utils.escapeHtml(property.propertyAddress)}"></div>
          <div class="field"><label>City</label><input id="propertyCity" value="${Utils.escapeHtml(property.city)}"></div>
          <div class="field"><label>State</label><input id="propertyState" value="${Utils.escapeHtml(property.state)}"></div>
          <div class="field"><label>ZIP</label><input id="propertyZip" value="${Utils.escapeHtml(property.zipCode)}"></div>
          <div class="field"><label>County</label><input id="propertyCounty" value="${Utils.escapeHtml(property.county)}"></div>
          <div class="field"><label>APN</label><input id="propertyAPN" value="${Utils.escapeHtml(property.apn)}"></div>
          <div class="field full"><label>Legal Description</label><textarea id="propertyLegal" rows="4">${Utils.escapeHtml(property.legalDescription)}</textarea></div>
          <div class="field full"><label>Notes</label><textarea id="propertyNotes" rows="4">${Utils.escapeHtml(property.notes)}</textarea></div>
        </div>
        <div class="toolbar" style="justify-content:flex-end;">
          <button class="btn btn-primary" id="saveProperty">Save Property</button>
        </div>
      </div>
    `);
  }

  window.PropertyManagerView = { renderProperties, editProperty };
})();

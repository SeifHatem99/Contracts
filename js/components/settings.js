(function () {
  function renderSettings(state) {
    const s = state.settings;
    const view = Utils.query("#viewContainer");
    view.innerHTML = `
      <div class="section-title"><h3>Settings</h3></div>
      <div class="card">
        <div class="fields">
          ${input("Company Name", "companyName", s.companyName)}
          ${input("Company Address", "companyAddress", s.companyAddress || "")}
          ${input("Company Phone", "companyPhone", s.companyPhone || "")}
          ${input("Company Email", "companyEmail", s.companyEmail || "")}
          <div class="field full"><label>Email Signature</label><textarea name="emailSignature" rows="4">${Utils.escapeHtml(s.emailSignature || "")}</textarea></div>
          ${input("Logo URL", "logoUrl", s.logoUrl || "")}
          ${input("Default Contract Folder", "defaultContractFolder", s.defaultContractFolder || "/generated")}
          ${input("Filename Format", "filenameFormat", s.filenameFormat || "{contractType}_{buyer}_{property}_{price}_{date}.docx")}
          ${input("Default Title Company", "defaultTitleCompany", s.defaultTitleCompany)}
          ${input("Default Template", "defaultTemplate", s.defaultTemplate || "psa")}
          ${input("Default Closing Period", "defaultClosingPeriod", s.defaultClosingPeriod || "30")}
          ${input("Reminder Days Before", "reminderDaysBefore", s.reminderSettings?.daysBefore ?? 3)}
          ${select("Calendar Week Start", "calendarWeekStart", s.calendarSettings?.weekStart || "Monday", ["Monday", "Sunday"])}
          ${select("Currency", "currency", s.currency, ["USD", "EUR", "GBP"])}
          <div class="field"><label>Theme</label><button class="btn btn-secondary" id="toggleTheme">${s.darkMode ? "Switch to Light" : "Switch to Dark"}</button></div>
          <div class="field"><label>Notification Preferences</label><input name="notificationPreferences" value="${Utils.escapeHtml(JSON.stringify(s.notificationPreferences || { inApp: true, email: false }))}"></div>
          <div class="field"><label>Backup Settings</label><input name="backupSettings" value="${Utils.escapeHtml(s.backupSettings || "Enabled")}"></div>
        </div>
        <div class="toolbar" style="margin-top:18px; justify-content:flex-end;">
          <button class="btn btn-primary" id="saveSettings">Save Settings</button>
        </div>
      </div>
    `;
  }

  function input(label, name, value) { return `<div class="field"><label>${label}</label><input name="${name}" value="${Utils.escapeHtml(value)}"></div>`; }
  function select(label, name, value, options) { return `<div class="field"><label>${label}</label><select name="${name}">${options.map(o => `<option value="${o}" ${o===value ? "selected" : ""}>${o}</option>`).join("")}</select></div>`; }
  window.SettingsView = { renderSettings };
})();

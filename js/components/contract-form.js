(function () {
  const CONTRACT_TYPES = () => (window.ContractDefinitions?.labels() || [["psa", "PSA"]]);
  const BODY_BULLETS = {
    cancellation: ["Inspection contingency", "Mutual agreement", "Financing issue", "Title issue"],
    addendum: ["Price adjustment", "Extension of closing", "Change in terms", "Additional agreement"],
  };

  function blankDeal(type = "psa") {
    return DealEngine.create(type);
  }

  function renderContractForm(state, deal = blankDeal(state.ui.draftContractType)) {
    const view = Utils.query("#viewContainer");
    const formDeal = DealEngine.normalize({ ...deal, titleCompany: deal.titleCompany || state.settings.defaultTitleCompany }, state.settings);
    applyCashAtClose(formDeal, deal);
    const errors = ValidationEngine.validate(formDeal, formDeal.contractType);
    const sellerContacts = (state.contacts || []).filter((c) => c.category === "Seller Contacts");
    const buyerContacts = (state.contacts || []).filter((c) => c.category === "Buyer Contacts");
    const titleContacts = (state.contacts || []).filter((c) => c.category === "Title Companies");
    const propertyRecords = state.properties || [];
    const contractDef = window.ContractDefinitions?.get(formDeal.contractType) || window.ContractDefinitions?.get("psa");
    const sections = contractDef.formSections || [];
    view.innerHTML = `
      <div class="section-title">
        <h3>Create Contract</h3>
        <div class="toolbar">
          <select id="contractTypeSelect">
            ${CONTRACT_TYPES().map(([value, label]) => `<option value="${value}" ${formDeal.contractType === value ? "selected" : ""}>${label}</option>`).join("")}
          </select>
          <span class="muted" id="draftSaveStatus">Saved</span>
          <button class="btn btn-secondary" id="startNewContract" type="button">Start New Contract</button>
          <button class="btn btn-secondary" id="clearDraft" type="button">Clear Draft</button>
          <button class="btn btn-secondary" id="previewContract">Final Review</button>
          <button class="btn btn-primary" id="saveDeal">Save Draft</button>
        </div>
      </div>
      <form id="dealForm" class="form-layout">
        <div class="card section-card">
          <h3>Quick Create</h3>
          <div class="fields">
            <div class="field"><label>Select Seller</label><select id="sellerContactSelect"><option value="">Select seller contact</option>${sellerContacts.map((c) => `<option value="${c.id}">${Utils.escapeHtml(c.fullName)}</option>`).join("")}</select></div>
            <div class="field"><label>Select Buyer</label><select id="buyerContactSelect"><option value="">Select buyer contact</option>${buyerContacts.map((c) => `<option value="${c.id}">${Utils.escapeHtml(c.fullName)}</option>`).join("")}</select></div>
            <div class="field"><label>Select Property</label><select id="propertyRecordSelect"><option value="">Select property</option>${propertyRecords.map((p) => `<option value="${p.id}">${Utils.escapeHtml(p.propertyAddress)}</option>`).join("")}</select></div>
          </div>
        </div>
        ${sections.map((group) => section(group.title, group.fields.map(([name, label, type, autoCurrency = false, readonly = false]) => field(label, name, formDeal[name], "", errors, type, autoCurrency, readonly, formDeal.contractType)).join(""))).join("")}
      </form>
    `;
    const sellerSelect = Utils.query("#sellerContactSelect");
    if (sellerSelect) sellerSelect.value = formDeal.sellerName ? (sellerContacts.find((c) => c.fullName === formDeal.sellerName)?.id || "") : "";
    const form = Utils.query("#dealForm");
    if (form) applyValidationState(form, errors);
    if (form) syncCashAtClose(form, state.settings.currency);
  }

  function section(title, children) {
    let content = "";
    if (Array.isArray(children)) content = children.join("");
    else if (typeof children === "string") content = children;
    return `<div class="card section-card"><h3>${title}</h3><div class="fields">${content}</div></div>`;
  }

  function field(label, name, value, extraClass, errors, type = "text", autoCurrency = false, readonly = false, contractType = "") {
    const cls = ["field", extraClass, errors[name] ? "error" : ""].filter(Boolean).join(" ");
    const common = `id="${name}" name="${name}" data-field-key="${name}" data-auto-currency="${autoCurrency}"`;
    const displayValue = autoCurrency && value !== "" && value !== null && value !== undefined
      ? FormattingEngine.currency(value)
      : value;
    const readonlyAttr = readonly ? "readonly" : "";
    const control = type === "textarea"
      ? `<textarea ${common} ${readonlyAttr} rows="4">${Utils.escapeHtml(displayValue)}</textarea>`
      : `<input ${common} ${readonlyAttr} type="${type}" value="${Utils.escapeHtml(displayValue)}" />`;
    const bullets = name === "body" ? bodyBulletOptions(contractType, value) : "";
    return `<div class="${cls}"><label>${label}</label>${control}${bullets}${errors[name] ? `<div class="error-message">${errors[name]}</div>` : ""}</div>`;
  }

  function bodyBulletOptions(contractType, value = "") {
    const bullets = BODY_BULLETS[contractType] || [];
    if (!bullets.length) return "";
    const currentLines = String(value || "").split("\n").map((line) => line.trim());
    return `
      <div class="toolbar body-bullets" data-body-bullets="${contractType}">
        ${bullets.map((sentence) => {
          const line = `- ${sentence}`;
          return `<label class="pill"><input type="checkbox" data-body-bullet="${Utils.escapeHtml(sentence)}" ${currentLines.includes(line) ? "checked" : ""}> ${Utils.escapeHtml(sentence)}</label>`;
        }).join("")}
      </div>
    `;
  }

  function syncBodyBullets(form) {
    const body = form?.querySelector('[name="body"]');
    if (!body) return;
    const contractType = Utils.query("[data-body-bullets]", form)?.dataset.bodyBullets || "";
    const managedBullets = BODY_BULLETS[contractType] || [];
    const manualLines = String(body.value || "")
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        return !managedBullets.some((sentence) => trimmed === `- ${sentence}`);
      });
    const selected = Utils.queryAll("[data-body-bullet]", form)
      .filter((input) => input.checked)
      .map((input) => `- ${input.dataset.bodyBullet}`);
    body.value = [...manualLines.filter((line) => line.trim()), ...selected].join("\n");
  }

  function dealFromForm(form, existing = blankDeal()) {
    const data = new FormData(form);
    const deal = DealEngine.normalize(existing);
    for (const [key, val] of data.entries()) deal[key] = val;
    const calculation = calculateCashAtClose(deal.purchasePrice, deal.earnestMoneyDeposit, deal.contractType);
    deal.cashAtCloseOfEscrow = calculation.ok ? calculation.amount : "";
    const normalized = DealEngine.normalize(deal);
    if (["psa", "psa_marketing"].includes(normalized.contractType)) {
      normalized.cashAtCloseOfEscrow = calculation.ok ? calculation.amount : "";
    }
    return normalized;
  }

  function parseCurrencyInput(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return { empty: true, valid: true, amount: null };
    const cleaned = raw.replace(/[^0-9.-]/g, "");
    if (!/\d/.test(cleaned)) return { empty: false, valid: false, amount: null };
    const amount = Number(cleaned);
    return Number.isFinite(amount)
      ? { empty: false, valid: true, amount }
      : { empty: false, valid: false, amount: null };
  }

  function calculateCashAtClose(purchasePrice, earnestMoney, contractType = "psa") {
    if (!["psa", "psa_marketing"].includes(contractType)) return { ok: false, amount: "" };
    const purchase = parseCurrencyInput(purchasePrice);
    const earnest = parseCurrencyInput(earnestMoney);
    if (purchase.empty || earnest.empty) return { ok: false, amount: "", message: "" };
    if (!purchase.valid || !earnest.valid) return { ok: false, amount: "", message: "Enter valid currency amounts to calculate COE." };
    const amount = Math.round(purchase.amount) - Math.round(earnest.amount);
    if (amount < 0) return { ok: false, amount: "", message: "Cash at Close cannot be negative." };
    return { ok: true, amount, message: "" };
  }

  function applyCashAtClose(normalizedDeal, sourceDeal = normalizedDeal) {
    const calculation = calculateCashAtClose(sourceDeal.purchasePrice, sourceDeal.earnestMoneyDeposit, normalizedDeal.contractType);
    if (["psa", "psa_marketing"].includes(normalizedDeal.contractType)) {
      normalizedDeal.cashAtCloseOfEscrow = calculation.ok ? calculation.amount : "";
    }
    return calculation;
  }

  function syncCashAtClose(form, currency = "USD") {
    if (!form) return { ok: false };
    const contractType = Utils.query("#contractTypeSelect")?.value || "psa";
    const cashInput = form.querySelector('[name="cashAtCloseOfEscrow"]');
    if (!cashInput || !["psa", "psa_marketing"].includes(contractType)) return { ok: false };
    const calculation = calculateCashAtClose(
      form.querySelector('[name="purchasePrice"]')?.value,
      form.querySelector('[name="earnestMoneyDeposit"]')?.value,
      contractType
    );
    cashInput.value = calculation.ok ? FormattingEngine.currency(calculation.amount, currency) : "";
    const field = cashInput.closest(".field");
    let message = field?.querySelector(".coe-message");
    if (calculation.message && field) {
      if (!message) {
        message = document.createElement("div");
        message.className = "help coe-message";
        field.appendChild(message);
      }
      message.textContent = calculation.message;
    } else if (message) {
      message.remove();
    }
    return calculation;
  }

  function applyValidationState(form, errors = {}) {
    if (!form) return;
    Object.entries(DealEngine.fieldMeta()).forEach(([fieldName, meta]) => {
      const input = form.querySelector(`[name="${fieldName}"]`);
      if (!input) return;
      const field = input.closest(".field");
      if (!field) return;
      const hasError = !!errors[fieldName];
      field.classList.toggle("error", hasError);
      let message = field.querySelector(".error-message");
      if (hasError) {
        if (!message) {
          message = document.createElement("div");
          message.className = "error-message";
          field.appendChild(message);
        }
        message.textContent = errors[fieldName];
      } else if (message) {
        message.remove();
      }
      input.setAttribute("aria-invalid", hasError ? "true" : "false");
      input.setAttribute("aria-describedby", hasError ? `${fieldName}-error` : "");
      if (message) message.id = `${fieldName}-error`;
    });
  }

  function autosaveDraft(form, state) {
    const deal = dealFromForm(form, activeDealOrDraft(state));
    state.ui.activeDealId = deal.id;
    const idx = state.deals.findIndex((d) => d.id === deal.id);
    if (idx >= 0) state.deals[idx] = deal; else state.deals.unshift(deal);
    return deal;
  }

  function activeDealOrDraft(state) {
    return state.deals.find((d) => d.id === state.ui.activeDealId) || blankDeal(state.ui.draftContractType);
  }

  function finalReview(deal, template, settings, preview = {}) {
    const normalized = DealEngine.normalize(deal, settings);
    const checklist = preview.checklist || [];
    const report = preview.report || null;
    const reviewFields = DealEngine.editableFields(template.type).map((field) => {
      const meta = DealEngine.fieldMeta()[field] || { label: field };
      return review(meta.label, normalized[field]);
    });
    const html = `
      <div class="modal-header"><div><h3>Final Review</h3><p class="muted">Review the deal before generating the document.</p></div><button class="btn btn-secondary" data-close-modal>Close</button></div>
      <div class="review-grid">
        ${review("Template", preview.templateName || template.name)}
        ${review("Status", preview.status || "Ready")}
        ${review("Generated Filename", preview.filename || "Pending")}
        ${review("Contract Type", template.name)}
        ${reviewFields.join("")}
      </div>
      ${report ? `
        <div class="card" style="margin-top:18px;">
          <div class="section-title"><h3>QA Report</h3><span class="pill">${report.ready ? "Ready" : "Review Required"}</span></div>
          <div class="muted">${Utils.escapeHtml(report.summary)}</div>
        </div>
      ` : ""}
      <div class="card" style="margin-top:18px;">
        <div class="section-title"><h3>Optional QA Checklist</h3></div>
        <div class="review-grid">
          ${checklist.map((item) => `<div class="review-row"><span>${item.ok ? "✓" : "•"} ${Utils.escapeHtml(item.label)}</span><strong>${item.ok ? "Complete" : "Missing"}</strong></div>`).join("") || `<div class="muted">Checklist will appear when export is prepared.</div>`}
        </div>
      </div>
      <div class="toolbar" style="margin-top:18px; justify-content:flex-end;">
        <label class="output-selector">Output
          <select id="generationOutputType">
            <option value="word">Word only</option>
            <option value="word_pdf">Word + PDF</option>
          </select>
        </label>
        <button class="btn btn-secondary" data-close-modal>Edit More</button>
        <button class="btn btn-primary" id="confirmGenerate">Generate</button>
      </div>
    `;
    UI.modal(html);
  }

  function review(label, value) {
    return `<div class="review-row"><span>${label}</span><strong>${Utils.escapeHtml(value || "—")}</strong></div>`;
  }

  window.ContractFormView = { renderContractForm, dealFromForm, blankDeal, finalReview, CONTRACT_TYPES, autosaveDraft, activeDealOrDraft, applyValidationState, syncCashAtClose, calculateCashAtClose, syncBodyBullets };
})();

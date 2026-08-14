(function () {
  let state = StorageService.defaultState();

  function migrateState() {
    state.deals = (state.deals || []).map((deal) => DealEngine.normalize(deal, state.settings));
    state.contacts = (state.contacts || []).map((contact) => ContactManagerEngine.normalize(contact));
    state.properties = (state.properties || []).map((property) => PropertyManagerEngine.normalize(property));
    state.templates = (state.templates || []).map((template) => VersionManager.ensureTemplateShape({
      ...template,
      version: template.version || 1,
      master: template.master !== false,
    }));
    state.emailTemplates = (state.emailTemplates || []).map((template) => EmailManagerEngine.normalize(template));
    state = { ...state, ...EmailManagerEngine.seed({ ...state }) };
    state.reminders = state.reminders || [];
    state.calendarEvents = state.calendarEvents || [];
    state.analytics = state.analytics || [];
    state.auditLog = state.auditLog || [];
    state.errorHistory = state.errorHistory || [];
    state.notifications = state.notifications || [];
    state.generated = state.generated || [];
    state.backups = state.backups || [];
    state.documents = state.documents || [];
    if (!state.settings.companyName || state.settings.companyName === "Real Estate Contracts") {
      state.settings.companyName = "Same Day Home Solutions";
    }
  }

  function persist() {
    StorageService.save(state);
    console.debug("[Autosave] Persisted application state to IndexedDB/localStorage", {
      deals: state.deals?.length || 0,
      activeDealId: state.ui?.activeDealId || null,
      activeDraftStatus: state.drafts?.[0]?.status || "none",
    });
    document.body.classList.toggle("dark", !!state.settings.darkMode);
    Utils.query("#companyNameDisplay").textContent = state.settings.companyName;
  }

  async function saveActiveDraft(deal, source = "autosave") {
    console.debug("[Autosave] Saving draft", {
      source,
      dealId: deal?.id,
      contractType: deal?.contractType,
      sellerName: deal?.sellerName || deal?.name || "",
      propertyAddress: deal?.propertyAddress || deal?.property || "",
    });
    const draft = await StorageService.saveDraft(deal);
    state.drafts = [draft];
    console.debug("[Autosave] Draft saved to IndexedDB store drafts", {
      draftId: draft.id,
      dealId: draft.dealId,
      contractType: draft.contractType,
      lastModified: draft.lastModified,
    });
    persist();
    return draft;
  }

  async function markActiveDraft(status) {
    const draft = await StorageService.clearDraft(status);
    state.drafts = [draft];
    console.debug("[Autosave] Draft marked", { status, lastModified: draft.lastModified });
    persist();
    return draft;
  }

  function setDraftStatus(message, status = "") {
    const el = Utils.query("#draftSaveStatus");
    if (!el) return;
    el.textContent = message;
    el.dataset.status = status;
  }

  function formatSaveTime(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function showGenerationResult(result) {
    const pdfLine = result.pdf?.ok
      ? `<div class="review-row"><span>PDF filename</span><strong>${Utils.escapeHtml(result.pdf.filename)}</strong></div>`
      : result.pdf
        ? `<div class="review-row"><span>PDF filename</span><strong>Not created</strong></div>`
        : "";
    const pdfStatus = result.pdf?.ok
      ? `Created with ${Utils.escapeHtml(result.pdf.engine || "local converter")}`
      : result.pdf
        ? Utils.escapeHtml(result.pdf.message || "PDF conversion is unavailable on this device.")
        : "Not requested";
    UI.modal(`
      <div class="modal-header"><div><h3>Generation Complete</h3><p class="muted">Generated files are ready.</p></div><button class="btn btn-secondary" data-close-modal>Close</button></div>
      <div class="review-grid">
        <div class="review-row"><span>DOCX filename</span><strong>${Utils.escapeHtml(result.docx.filename)}</strong></div>
        ${pdfLine}
        <div class="review-row"><span>Local save status</span><strong>Browser download started</strong></div>
        <div class="review-row"><span>PDF conversion status</span><strong>${pdfStatus}</strong></div>
      </div>
      <div class="toolbar" style="margin-top:18px; justify-content:flex-end;">
        <button class="btn btn-secondary" id="downloadGeneratedDocx">Download Word</button>
        ${result.pdf?.ok ? `<button class="btn btn-secondary" id="downloadGeneratedPdf">Download PDF</button>` : ""}
        <button class="btn btn-secondary" type="button" disabled title="Generated files are saved through your browser downloads.">Open generated folder</button>
        <button class="btn btn-primary" data-close-modal>Done</button>
      </div>
    `);
    const docxBtn = Utils.query("#downloadGeneratedDocx");
    if (docxBtn) docxBtn.addEventListener("click", () => FileManager.downloadBlob(result.docx.blob, result.docx.filename));
    const pdfBtn = Utils.query("#downloadGeneratedPdf");
    if (pdfBtn && result.pdf?.blob) pdfBtn.addEventListener("click", () => FileManager.downloadBlob(result.pdf.blob, result.pdf.filename));
  }

  function setView(view) {
    state.ui.view = view;
    const titles = {
      dashboard: ["Same Day Home Solutions", "Create contracts, reopen recent deals, and manage templates."],
      contract: ["Create Contract", "Enter deal data once and reuse it across every generated contract."],
      deal: ["Deal Details", "Workflow status, notes, documents, and activity history."],
      contacts: ["Contacts", "Reusable sellers, buyers, title companies, and parties."],
      properties: ["Properties", "Reusable property records and history."],
      templates: ["Template Manager", "Versioned master templates with backups before every change."],
      data: ["Data", "Import, export, and backup management."],
      emails: ["Email Center", "Contract emails, templates, and communication workflows."],
      notifications: ["Notifications", "Alert history and system messages."],
      diagnostics: ["Diagnostics", "Application health, errors, and recovery status."],
      files: ["File Center", "Templates, documents, backups, and archives."],
      reports: ["Reports", "Business reporting and exportable summaries."],
      sync: ["Sync Settings", "Backup, restore, and cloud sync preparation."],
      search: ["Search", "Search by seller, buyer, property, date, and contract type."],
      settings: ["Settings", "Control branding, theme, title company, and currency."],
    };
    const [title, subtitle] = titles[view];
    Utils.query("#viewTitle").textContent = title;
    Utils.query("#viewSubtitle").textContent = subtitle;
    const crumbs = {
      dashboard: "Dashboard",
      contract: "Dashboard / Create Contract",
      deal: `Dashboard / Deal Details${activeDeal() ? ` / ${activeDeal().propertyAddress || activeDeal().id}` : ""}`,
      templates: "Dashboard / Template Manager",
      search: "Dashboard / Search",
      emails: "Dashboard / Email Center",
      notifications: "Dashboard / Notifications",
      diagnostics: "Dashboard / Diagnostics",
      files: "Dashboard / File Center",
      reports: "Dashboard / Reports",
      sync: "Dashboard / Sync Settings",
      settings: "Dashboard / Settings",
    };
    Utils.query("#breadcrumbs").textContent = crumbs[view] || "Dashboard";
    Utils.queryAll(".nav-item").forEach((btn) => btn.classList.toggle("active", btn.dataset.view === view));
    if (view === "dashboard") DashboardView.renderDashboard(state);
    if (view === "contract") ContractFormView.renderContractForm(state, activeDeal() || ContractFormView.blankDeal(state.ui.draftContractType));
    if (view === "deal" && activeDeal()) DealDetailsView.renderDealDetails(state, activeDeal());
    if (view === "deal" && !activeDeal()) {
      Utils.query("#viewContainer").innerHTML = `<div class="card"><h3>Select a deal</h3><p class="muted">Open a deal from the dashboard or search results.</p></div>`;
    }
    if (view === "contacts") ContactManagerView.renderContacts(state);
    if (view === "properties") PropertyManagerView.renderProperties(state);
    if (view === "templates") TemplateManagerView.renderTemplateManager(state);
    if (view === "data") DataManagerView.renderData(state);
    if (view === "emails") EmailCenterView.renderEmails(state);
    if (view === "notifications") NotificationsView.renderNotifications(state);
    if (view === "diagnostics") DiagnosticsView.renderDiagnostics(state);
    if (view === "files") FileCenterView.render(state);
    if (view === "reports") ReportsView.renderReports(state);
    if (view === "sync") SyncSettingsView.renderSync(state);
    if (view === "search") SearchView.renderSearch(state);
    if (view === "settings") SettingsView.renderSettings(state);
    bindViewHandlers();
    persist();
  }

  function activeDeal() {
    return state.deals.find((d) => d.id === state.ui.activeDealId);
  }

  function saveDealFromForm() {
    const form = Utils.query("#dealForm");
    const existing = activeDeal() || ContractFormView.blankDeal();
    const deal = ContractFormView.dealFromForm(form, existing);
    ValidationEngine.debugRequiredFields(deal);
    deal.titleCompany = deal.titleCompany || state.settings.defaultTitleCompany;
    const errors = ValidationEngine.validate(deal, deal.contractType);
    ContractFormView.applyValidationState(form, errors);
    if (ValidationEngine.hasErrors(errors)) {
      UI.notify("Please complete the required fields before saving.", "error");
      return null;
    }
    const idx = state.deals.findIndex((d) => d.id === deal.id);
    if (idx >= 0) state.deals[idx] = deal; else state.deals.unshift(deal);
    state.ui.activeDealId = deal.id;
    StorageService.pushBackup("deal", deal);
    ActivityLogger.log(deal, idx >= 0 ? "Contract Updated" : "Deal Created", `Saved ${deal.contractTypeLabel}`);
    persist();
    setDraftStatus("Saving...", "saving");
    saveActiveDraft(deal, "manual-save")
      .then((draft) => {
        setDraftStatus(`Last saved at ${formatSaveTime(draft.lastModified)}`, "saved");
      })
      .catch((error) => {
        console.warn("Manual draft save failed", error);
        setDraftStatus("Save failed", "error");
      });
    UI.notify("Draft saved.", "success");
    return deal;
  }

  const autosaveDeal = Utils.debounce(() => {
    const form = Utils.query("#dealForm");
    if (!form) return;
    const deal = ContractFormView.autosaveDraft(form, state);
    setDraftStatus("Saving...", "saving");
    saveActiveDraft(deal, "field-change")
      .then((draft) => {
        setDraftStatus(`Last saved at ${formatSaveTime(draft.lastModified)}`, "saved");
      })
      .catch((error) => {
        console.warn("Autosave failed", error);
        setDraftStatus("Save failed", "error");
      });
    return deal;
  }, 500);

  function openFinalReview() {
    const deal = saveDealFromForm();
    if (!deal) return;
    const template = state.templates.find((t) => t.type === deal.contractType || t.name === deal.contractTypeLabel || TemplateLoader.resolveFileName(t) === TemplateLoader.resolveFileName(deal.contractType));
    if (!template) {
      UI.notify("No template exists for the selected contract type.", "error");
      return;
    }
    const templateName = TemplateLoader.filename(template.type);
    const existingFilenames = [...(state.generated || []), ...(state.documents || [])].map((item) => item.filename || item.name);
    const filenameLabel = ContractDefinitions.getFilenameLabel(template.type);
    const filename = DocumentGenerator.buildFilename(deal, filenameLabel, state.settings, existingFilenames);
    ValidationEngine.debugRequiredFields(deal);
    const validationErrors = ValidationEngine.validate(deal, deal.contractType);
    const checklist = ContractValidator.checklist(deal, template, state.settings);
    const canGenerate = !ValidationEngine.hasErrors(validationErrors);
    const report = ValidationEngine.reviewReport(deal, template, state.settings);
    WorkflowManager.setStatus(deal, canGenerate ? "Under Review" : "Draft", "Ready for generation review");

    ContractFormView.finalReview(deal, template, state.settings, {
      templateName,
      filename,
      checklist,
      report,
      status: canGenerate ? "Ready to Generate" : "Fix Required",
    });
    const btn = Utils.query("#confirmGenerate");
    if (btn) btn.addEventListener("click", async () => {
      if (!canGenerate) {
        const firstField = ValidationEngine.firstErrorField(validationErrors);
        UI.notify(firstField ? validationErrors[firstField] : "Complete the required fields before exporting.", "error");
        return;
      }
      btn.disabled = true;
      btn.textContent = "Generating...";
      try {
        const outputType = Utils.query("#generationOutputType")?.value || "word";
        const generated = await DocumentGenerator.generateDocx(deal, template, { ...state.settings, existingFilenames });
        let pdfResult = null;
        if (outputType === "pdf" || outputType === "word_pdf") {
          pdfResult = await PdfConverter.convert(generated.blob, generated.filename);
        }
        const record = {
          ...generated,
          dealId: deal.id,
          contractType: template.type,
          createdAt: new Date().toISOString(),
          templateVersion: template.version,
          outputType,
          pdfFilename: pdfResult?.ok ? pdfResult.filename : "",
          pdfStatus: pdfResult ? (pdfResult.ok ? "Created" : "Unavailable") : "Not requested",
          pdfEngine: pdfResult?.engine || "",
        };
        FileManager.saveGenerated(state, record);
        DocumentManager.add(deal, record);
        WorkflowManager.setStatus(deal, "Ready for Signature", "Contract generated");
        ActivityLogger.log(deal, "Template Used", `${template.name} v${template.version}`);
        if (outputType !== "pdf") {
          FileManager.downloadBlob(generated.blob, generated.filename);
        }
        if (pdfResult?.ok) {
          FileManager.downloadBlob(pdfResult.blob, pdfResult.filename);
        } else if (pdfResult) {
          UI.notify(`Word document generated successfully. PDF failed: ${pdfResult.message}`, "error");
        }
        await markActiveDraft("completed");
        showGenerationResult({ docx: generated, pdf: pdfResult });
        const successMessage = outputType === "pdf"
          ? (pdfResult?.ok ? "PDF generated." : "PDF conversion was unavailable.")
          : (pdfResult?.ok ? "Word and PDF generated." : "Word document generated successfully.");
        UI.notify(successMessage, pdfResult?.ok || outputType === "word" ? "success" : "warning");
      } catch (error) {
        UI.notify(error.message || "Document generation failed.", "error");
        btn.disabled = false;
        btn.textContent = "Generate";
      }
    });
  }

  function bindViewHandlers() {
    Utils.queryAll("[data-open-deal]").forEach((row) => {
      row.addEventListener("click", () => {
        state.ui.activeDealId = row.dataset.openDeal;
        setView("deal");
      });
    });

    const form = Utils.query("#dealForm");
    if (form) {
      form.addEventListener("change", (e) => {
        if (e.target.matches("[data-body-bullet]")) {
          ContractFormView.syncBodyBullets(form);
          autosaveDeal();
        }
      });
      form.addEventListener("input", (e) => {
        if (e.target.dataset.autoCurrency === "true") {
          const rawCurrency = e.target.value.trim();
          if (rawCurrency === "" || /[0-9]/.test(rawCurrency)) {
            const numeric = Utils.parseCurrency(e.target.value);
            e.target.value = rawCurrency === "" ? "" : Utils.formatCurrency(numeric, state.settings.currency);
          }
        }
        ContractFormView.syncCashAtClose(form, state.settings.currency);
        const liveDeal = ContractFormView.dealFromForm(form, activeDeal() || ContractFormView.blankDeal(state.ui.draftContractType));
        const liveErrors = ValidationEngine.validate(liveDeal, liveDeal.contractType);
        ContractFormView.applyValidationState(form, liveErrors);
        autosaveDeal();
      });
    }

    const contractTypeSelect = Utils.query("#contractTypeSelect");
    if (contractTypeSelect) {
      contractTypeSelect.addEventListener("change", (e) => {
        const form = Utils.query("#dealForm");
        const draft = form ? ContractFormView.dealFromForm(form, activeDeal() || ContractFormView.blankDeal(state.ui.draftContractType)) : ContractFormView.blankDeal();
        ValidationEngine.debugRequiredFields(draft);
        draft.contractType = e.target.value;
        draft.contractTypeLabel = ContractDefinitions.getLabel(e.target.value);
        draft.titleCompany = draft.titleCompany || state.settings.defaultTitleCompany;
        state.ui.draftContractType = e.target.value;
        state.ui.activeDealId = draft.id;
        const idx = state.deals.findIndex((d) => d.id === draft.id);
        if (idx >= 0) state.deals[idx] = draft; else state.deals.unshift(draft);
        ContractFormView.renderContractForm(state, draft);
        bindViewHandlers();
        persist();
        setDraftStatus("Saving...", "saving");
        saveActiveDraft(draft, "contract-type-change")
          .then((savedDraft) => {
            setDraftStatus(`Last saved at ${formatSaveTime(savedDraft.lastModified)}`, "saved");
          })
          .catch((error) => {
            console.warn("Autosave failed after contract type change", error);
            setDraftStatus("Save failed", "error");
          });
      });
    }

    const saveDeal = Utils.query("#saveDeal");
    if (saveDeal) saveDeal.addEventListener("click", saveDealFromForm);
    const clearDraft = Utils.query("#clearDraft");
    if (clearDraft) clearDraft.addEventListener("click", async () => {
      if (!confirm("Clear the current unfinished draft? Completed deals and generated contracts will not be deleted.")) return;
      const currentId = state.ui.activeDealId;
      await markActiveDraft("cleared");
      state.deals = (state.deals || []).filter((deal) => deal.id !== currentId || deal.status !== "Draft" || (deal.documents || []).length);
      state.ui.activeDealId = null;
      persist();
      ContractFormView.renderContractForm(state, ContractFormView.blankDeal(state.ui.draftContractType));
      bindViewHandlers();
      setDraftStatus("Saved", "saved");
      UI.notify("Draft cleared.", "success");
    });
    const startNewContract = Utils.query("#startNewContract");
    if (startNewContract) startNewContract.addEventListener("click", async () => {
      const form = Utils.query("#dealForm");
      const hasData = form && Array.from(new FormData(form).values()).some((value) => String(value || "").trim());
      if (hasData && !confirm("Start a new contract and clear the current unfinished draft?")) return;
      await markActiveDraft("cleared");
      const currentId = state.ui.activeDealId;
      state.deals = (state.deals || []).filter((deal) => deal.id !== currentId || deal.status !== "Draft" || (deal.documents || []).length);
      state.ui.activeDealId = null;
      state.ui.draftContractType = state.settings.defaultTemplate || "psa";
      persist();
      ContractFormView.renderContractForm(state, ContractFormView.blankDeal(state.ui.draftContractType));
      bindViewHandlers();
      setDraftStatus("Saved", "saved");
    });
    const preview = Utils.query("#previewContract");
    if (preview) preview.addEventListener("click", openFinalReview);
    const dealQuickGenerate = Utils.query("#dealQuickGenerate");
    if (dealQuickGenerate) dealQuickGenerate.addEventListener("click", openFinalReview);
    const openDealContractQuick = Utils.query("#openDealContractQuick");
    if (openDealContractQuick) openDealContractQuick.addEventListener("click", () => setView("contract"));
    const jumpToEmails = Utils.query("#jumpToEmails");
    if (jumpToEmails) jumpToEmails.addEventListener("click", () => setView("emails"));
    const jumpToFiles = Utils.query("#jumpToFiles");
    if (jumpToFiles) jumpToFiles.addEventListener("click", () => setView("files"));
    const dealGenerateEmail = Utils.query("#dealGenerateEmail");
    if (dealGenerateEmail && activeDeal()) {
      dealGenerateEmail.addEventListener("click", () => EmailCenterView.copyAssistantEmail(activeDeal(), state.settings));
    }

    Utils.queryAll("[data-edit-template]").forEach((btn) => btn.addEventListener("click", () => {
      const template = state.templates.find((t) => t.id === btn.dataset.editTemplate);
      TemplateManagerView.editTemplate(template, state);
      bindModalHandlers(template);
    }));

    Utils.queryAll("[data-open-template]").forEach((btn) => btn.addEventListener("click", () => {
      const template = state.templates.find((t) => t.id === btn.dataset.openTemplate);
      if (template) TemplateManagerView.openTemplate(template, state);
    }));

    Utils.queryAll("[data-version-history]").forEach((btn) => btn.addEventListener("click", () => {
      const template = state.templates.find((t) => t.id === btn.dataset.versionHistory);
      if (template) TemplateManagerView.versionHistory(template, state);
      bindModalHandlers(template);
    }));

    const backupTemplates = Utils.query("#backupTemplates");
    if (backupTemplates) backupTemplates.addEventListener("click", () => {
      state.templates.forEach((template) => StorageService.pushBackup("template", template));
      persist();
      UI.notify("Templates backed up.", "success");
    });

    const saveSettings = Utils.query("#saveSettings");
    if (saveSettings) saveSettings.addEventListener("click", () => {
      const container = Utils.query("#viewContainer");
      state.settings.companyName = container.querySelector('[name="companyName"]').value.trim();
      state.settings.companyAddress = container.querySelector('[name="companyAddress"]').value.trim();
      state.settings.companyPhone = container.querySelector('[name="companyPhone"]').value.trim();
      state.settings.companyEmail = container.querySelector('[name="companyEmail"]').value.trim();
      state.settings.logoUrl = container.querySelector('[name="logoUrl"]').value.trim();
      state.settings.defaultContractFolder = container.querySelector('[name="defaultContractFolder"]').value.trim();
      state.settings.filenameFormat = container.querySelector('[name="filenameFormat"]').value.trim();
      state.settings.defaultTitleCompany = container.querySelector('[name="defaultTitleCompany"]').value.trim();
      state.settings.defaultTemplate = container.querySelector('[name="defaultTemplate"]').value.trim();
      state.settings.defaultClosingPeriod = container.querySelector('[name="defaultClosingPeriod"]').value.trim();
      state.settings.currency = container.querySelector('[name="currency"]').value;
      state.settings.backupSettings = container.querySelector('[name="backupSettings"]').value;
      persist();
      UI.notify("Settings saved.", "success");
      setView("settings");
    });
    const newTemplate = Utils.query("#newTemplate");
    if (newTemplate) newTemplate.addEventListener("click", () => {
      const source = state.templates.find((tpl) => !tpl.archived);
      if (!source) return UI.notify("No template available to duplicate.", "error");
      const copy = VersionManager.duplicate(source);
      state.templates.unshift(copy);
      StorageService.pushBackup("template", copy);
      persist();
      UI.notify("Template duplicated.", "success");
      setView("templates");
    });
    const toggleTheme = Utils.query("#toggleTheme");
    if (toggleTheme) toggleTheme.addEventListener("click", () => {
      state.settings.darkMode = !state.settings.darkMode;
      persist();
      setView("settings");
    });

    const searchInput = Utils.query("#searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const statusFilter = Utils.query("#searchStatus")?.value || "";
        let filtered = SearchEngine.queryDeals(state.deals, searchInput.value);
        if (statusFilter) filtered = filtered.filter((deal) => deal.status === statusFilter);
        Utils.query("#searchResults").innerHTML = SearchView.renderRows(filtered);
        const globalResults = Utils.query("#globalSearchResults");
        if (globalResults) globalResults.innerHTML = SearchView.renderGlobalSections(state, searchInput.value);
        bindViewHandlers();
      });
    }
    const searchStatus = Utils.query("#searchStatus");
    if (searchStatus) {
      searchStatus.addEventListener("change", () => {
        const term = Utils.query("#searchInput")?.value || "";
        let filtered = SearchEngine.queryDeals(state.deals, term);
        if (searchStatus.value) filtered = filtered.filter((deal) => deal.status === searchStatus.value);
        Utils.query("#searchResults").innerHTML = SearchView.renderRows(filtered);
        bindViewHandlers();
      });
    }

    const dealStatusSelect = Utils.query("#dealStatusSelect");
    if (dealStatusSelect && activeDeal()) {
      dealStatusSelect.addEventListener("change", () => {
        WorkflowManager.setStatus(activeDeal(), dealStatusSelect.value, "Manually changed");
        persist();
        setView("deal");
      });
    }

    const addNote = Utils.query("#addNote");
    if (addNote && activeDeal()) {
      addNote.addEventListener("click", () => {
        const type = Utils.query("#noteType")?.value || "Internal Notes";
        const text = Utils.query("#noteText")?.value.trim();
        if (!text) return UI.notify("Enter a note first.", "error");
        NotesManager.add(activeDeal(), type, text);
        persist();
        setView("deal");
      });
    }

    Utils.queryAll("[data-doc-rename]").forEach((btn) => btn.addEventListener("click", () => {
      const name = prompt("Rename document to:", "");
      if (!name || !activeDeal()) return;
      try {
        DocumentManager.rename(activeDeal(), btn.dataset.docRename, name);
        persist();
        setView("deal");
      } catch (error) {
        UI.notify(error.message, "error");
      }
    }));
    Utils.queryAll("[data-doc-duplicate]").forEach((btn) => btn.addEventListener("click", () => {
      if (!activeDeal()) return;
      try {
        DocumentManager.duplicate(activeDeal(), btn.dataset.docDuplicate);
        persist();
        setView("deal");
      } catch (error) {
        UI.notify(error.message, "error");
      }
    }));
    Utils.queryAll("[data-doc-archive]").forEach((btn) => btn.addEventListener("click", () => {
      if (!activeDeal()) return;
      if (!confirm("Archive this document?")) return;
      try {
        DocumentManager.archive(activeDeal(), btn.dataset.docArchive);
        persist();
        setView("deal");
      } catch (error) {
        UI.notify(error.message, "error");
      }
    }));
    Utils.queryAll("[data-doc-delete]").forEach((btn) => btn.addEventListener("click", () => {
      if (!activeDeal()) return;
      if (!confirm("Delete this document? This cannot be undone.")) return;
      try {
        DocumentManager.remove(activeDeal(), btn.dataset.docDelete);
        persist();
        setView("deal");
      } catch (error) {
        UI.notify(error.message, "error");
      }
    }));
    const openDealContract = Utils.query("#openDealContract");
    if (openDealContract && activeDeal()) {
      openDealContract.addEventListener("click", () => setView("contract"));
    }

    const duplicateDeal = Utils.query("#duplicateDeal");
    if (duplicateDeal && activeDeal()) {
      duplicateDeal.addEventListener("click", () => {
        if (!confirm("Duplicate this deal into a new record?")) return;
        const copy = DealEngine.normalize({ ...Utils.deepClone(activeDeal()), id: Utils.uid("deal"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: "Draft", activities: [], notes: [], documents: [] }, state.settings);
        state.deals.unshift(copy);
        state.ui.activeDealId = copy.id;
        ActivityLogger.log(copy, "Deal Created", `Duplicated from ${activeDeal().id}`);
        persist();
        setView("deal");
      });
    }

    Utils.queryAll("[data-doc-compare-template]").forEach((btn) => btn.addEventListener("click", () => {
      const deal = activeDeal();
      if (!deal) return;
      const doc = DocumentManager.list(deal).find((item) => item.id === btn.dataset.docCompareTemplate);
      const template = state.templates.find((t) => t.type === deal.contractType);
      if (!doc || !template) return UI.notify("Comparison data unavailable.", "error");
      UI.modal(`
        <div class="modal-header"><div><h3>Compare to Template</h3><p class="muted">${Utils.escapeHtml(doc.filename)}</p></div><button class="btn btn-secondary" data-close-modal>Close</button></div>
        <div class="card"><pre style="white-space:pre-wrap; margin:0;">${ComparisonEngine.renderDiff(doc.renderedText || "", template.content || "")}</pre></div>
      `);
    }));
    Utils.queryAll("[data-doc-compare-previous]").forEach((btn) => btn.addEventListener("click", () => {
      const deal = activeDeal();
      if (!deal) return;
      const docs = DocumentManager.list(deal);
      const index = docs.findIndex((item) => item.id === btn.dataset.docComparePrevious);
      const current = docs[index];
      const previous = docs[index + 1];
      if (!current || !previous) return UI.notify("No previous document available.", "error");
      UI.modal(`
        <div class="modal-header"><div><h3>Compare Documents</h3><p class="muted">${Utils.escapeHtml(current.filename)}</p></div><button class="btn btn-secondary" data-close-modal>Close</button></div>
        <div class="card"><pre style="white-space:pre-wrap; margin:0;">${DocumentManager.compare(current, previous)}</pre></div>
      `);
    }));

    const addContactBtn = Utils.query("#addContactBtn");
    if (addContactBtn) addContactBtn.addEventListener("click", () => {
      ContactManagerView.editContact();
      bindContactModalHandlers();
    });
    Utils.queryAll("[data-contact-id]").forEach((row) => row.addEventListener("click", () => {
      const contact = state.contacts.find((c) => c.id === row.dataset.contactId);
      if (!contact) return;
      ContactManagerView.editContact(contact);
      bindContactModalHandlers(contact);
    }));

    const addPropertyBtn = Utils.query("#addPropertyBtn");
    if (addPropertyBtn) addPropertyBtn.addEventListener("click", () => {
      PropertyManagerView.editProperty();
      bindPropertyModalHandlers();
    });
    Utils.queryAll("[data-property-id]").forEach((row) => row.addEventListener("click", () => {
      const property = state.properties.find((p) => p.id === row.dataset.propertyId);
      if (!property) return;
      PropertyManagerView.editProperty(property);
      bindPropertyModalHandlers(property);
    }));

    const newEmailTemplate = Utils.query("#newEmailTemplate");
    if (newEmailTemplate) newEmailTemplate.addEventListener("click", () => {
      EmailCenterView.editEmailTemplate();
      bindEmailModalHandlers();
    });
    const generateEmail = Utils.query("#generateEmail");
    if (generateEmail) generateEmail.addEventListener("click", () => {
      const dealId = Utils.query("#emailAssistantDeal")?.value;
      const deal = state.deals.find((item) => item.id === dealId) || activeDeal();
      if (!deal) return UI.notify("Select a deal first.", "error");
      EmailCenterView.copyAssistantEmail(deal, state.settings);
    });
    Utils.queryAll("[data-edit-email-template]").forEach((btn) => btn.addEventListener("click", () => {
      const template = state.emailTemplates.find((t) => t.id === btn.dataset.editEmailTemplate);
      if (!template) return;
      EmailCenterView.editEmailTemplate(template);
      bindEmailModalHandlers(template);
    }));

    const importDataBtn = Utils.query("#importDataBtn");
    if (importDataBtn) importDataBtn.addEventListener("click", async () => {
      const file = Utils.query("#importDataFile")?.files?.[0];
      if (!file) return UI.notify("Choose a backup file first.", "error");
      try {
        const imported = await ImportExportManager.fileToJson(file);
        SecurityManager.validateSnapshot(imported);
        state = { ...state, ...imported };
        migrateState();
        persist();
        AuditLoggerEngine.log(state, "Import Data", "backup", null, file.name);
        UI.notify("Backup imported successfully.", "success");
        setView("dashboard");
      } catch (error) {
        UI.notify(error.message || "Import failed.", "error");
      }
    });
    const manualBackup = Utils.query("#manualBackup");
    if (manualBackup) manualBackup.addEventListener("click", () => {
      StorageService.pushBackup("manual", ImportExportManager.snapshot(state));
      AuditLoggerEngine.log(state, "Manual Backup", "backup", null, "created");
      persist();
      UI.notify("Manual backup created.", "success");
    });
    const restoreLatestBackup = Utils.query("#restoreLatestBackup");
    if (restoreLatestBackup) restoreLatestBackup.addEventListener("click", () => {
      const latest = state.backups[0];
      if (!latest) return UI.notify("No backups available.", "error");
      state = { ...state, ...Utils.deepClone(latest.snapshot) };
      migrateState();
      persist();
      AuditLoggerEngine.log(state, "Restore Backup", "backup", null, latest.id);
      UI.notify("Latest backup restored.", "success");
      setView("dashboard");
    });
    const exportAllData = Utils.query("#exportAllData");
    if (exportAllData) exportAllData.addEventListener("click", () => ImportExportManager.downloadJson(`recm_all_data_${Utils.nowISO()}.json`, ImportExportManager.snapshot(state)));
    const exportContacts = Utils.query("#exportContacts");
    if (exportContacts) exportContacts.addEventListener("click", () => ImportExportManager.downloadJson(`recm_contacts_${Utils.nowISO()}.json`, { contacts: state.contacts || [] }));
    const exportDeals = Utils.query("#exportDeals");
    if (exportDeals) exportDeals.addEventListener("click", () => ImportExportManager.downloadJson(`recm_deals_${Utils.nowISO()}.json`, { deals: state.deals || [] }));
    const exportTemplates = Utils.query("#exportTemplates");
    if (exportTemplates) exportTemplates.addEventListener("click", () => ImportExportManager.downloadJson(`recm_templates_${Utils.nowISO()}.json`, { templates: state.templates || [] }));
    const exportReports = Utils.query("#exportReports");
    if (exportReports) exportReports.addEventListener("click", () => ImportExportManager.downloadJson(`recm_reports_${Utils.nowISO()}.json`, ImportExportManager.exportReports(state)));
    const refreshDiagnostics = Utils.query("#refreshDiagnostics");
    if (refreshDiagnostics) refreshDiagnostics.addEventListener("click", () => setView("diagnostics"));
    const clearErrorHistory = Utils.query("#clearErrorHistory");
    if (clearErrorHistory) clearErrorHistory.addEventListener("click", () => {
      if (!confirm("Clear the error history?")) return;
      state.errorHistory = [];
      persist();
      UI.notify("Error history cleared.", "success");
      setView("diagnostics");
    });
    Utils.queryAll("[data-backup-download]").forEach((btn) => btn.addEventListener("click", () => {
      const backup = state.backups.find((b) => b.id === btn.dataset.backupDownload);
      if (!backup) return UI.notify("Backup not found.", "error");
      ImportExportManager.downloadJson(`backup_${backup.id}.json`, backup);
    }));
    Utils.queryAll("[data-backup-restore]").forEach((btn) => btn.addEventListener("click", () => {
      const backup = state.backups.find((b) => b.id === btn.dataset.backupRestore);
      if (!backup) return UI.notify("Backup not found.", "error");
      state = { ...state, ...Utils.deepClone(backup.snapshot) };
      migrateState();
      persist();
      AuditLoggerEngine.log(state, "Restore Backup", "backup", null, backup.id);
      UI.notify("Backup restored.", "success");
      setView("dashboard");
    }));
    Utils.queryAll("[data-backup-delete]").forEach((btn) => btn.addEventListener("click", () => {
      if (!confirm("Delete this backup?")) return;
      state.backups = (state.backups || []).filter((b) => b.id !== btn.dataset.backupDelete);
      persist();
      UI.notify("Backup deleted.", "success");
      setView("data");
    }));
    const syncNow = Utils.query("#syncNow");
    if (syncNow) syncNow.addEventListener("click", async () => {
      try {
        await SyncManager.syncNow(state);
        AuditLoggerEngine.log(state, "Sync Now", "sync", null, "cloud-ready");
        persist();
        UI.notify("Sync completed.", "success");
        setView("sync");
      } catch (error) {
        UI.notify(error.message || "Sync failed.", "error");
      }
    });
    const createBackupNow = Utils.query("#createBackupNow");
    if (createBackupNow) createBackupNow.addEventListener("click", async () => {
      await StorageService.pushBackup("manual", ImportExportManager.snapshot(state));
      AuditLoggerEngine.log(state, "Manual Backup", "backup", null, "Created backup snapshot");
      persist();
      UI.notify("Backup created.", "success");
      setView("data");
    });

    const sellerSelect = Utils.query("#sellerContactSelect");
    if (sellerSelect) sellerSelect.addEventListener("change", () => {
      const contact = state.contacts.find((c) => c.id === sellerSelect.value);
      if (!contact) return;
      Utils.query('[name="sellerName"]').value = contact.fullName;
      Utils.query('[name="titleCompany"]').value = contact.companyName || Utils.query('[name="titleCompany"]').value;
      ContactManagerEngine.touch(contact);
      persist();
    });
    const buyerSelect = Utils.query("#buyerContactSelect");
    if (buyerSelect) buyerSelect.addEventListener("change", () => {
      const contact = state.contacts.find((c) => c.id === buyerSelect.value);
      if (!contact) return;
      Utils.query('[name="buyerName"]').value = contact.fullName;
      ContactManagerEngine.touch(contact);
      persist();
    });
    const propertySelect = Utils.query("#propertyRecordSelect");
    if (propertySelect) propertySelect.addEventListener("change", () => {
      const property = state.properties.find((p) => p.id === propertySelect.value);
      if (!property) return;
      Utils.query('[name="propertyAddress"]').value = property.propertyAddress;
      Utils.query('[name="city"]').value = property.city;
      Utils.query('[name="state"]').value = property.state;
      Utils.query('[name="zipCode"]').value = property.zipCode;
      Utils.query('[name="county"]').value = property.county;
      Utils.query('[name="propertyAPN"]').value = property.apn;
      Utils.query('[name="legalDescription"]').value = property.legalDescription;
      PropertyManagerEngine.touch(property);
      persist();
    });
  }

  function bindContactModalHandlers(existing = null) {
    const save = Utils.query("#saveContact");
    if (!save) return;
    save.addEventListener("click", () => {
      const contact = existing || ContactManagerEngine.create();
      contact.category = Utils.query("#contactCategory").value;
      contact.fullName = Utils.query("#contactName").value.trim();
      contact.companyName = Utils.query("#contactCompany").value.trim();
      contact.phone = Utils.query("#contactPhone").value.trim();
      contact.email = Utils.query("#contactEmail").value.trim();
      contact.address = Utils.query("#contactAddress").value.trim();
      contact.notes = Utils.query("#contactNotes").value.trim();
      const idx = state.contacts.findIndex((c) => c.id === contact.id);
      if (idx >= 0) state.contacts[idx] = contact; else state.contacts.unshift(contact);
      ActivityLogger.log(activeDeal() || DealEngine.create(), "Contact Saved", contact.fullName);
      persist();
      UI.closeModal();
      setView("contacts");
    }, { once: true });
  }

  function bindPropertyModalHandlers(existing = null) {
    const save = Utils.query("#saveProperty");
    if (!save) return;
    save.addEventListener("click", () => {
      const property = existing || PropertyManagerEngine.create();
      property.propertyAddress = Utils.query("#propertyAddress").value.trim();
      property.city = Utils.query("#propertyCity").value.trim();
      property.state = Utils.query("#propertyState").value.trim();
      property.zipCode = Utils.query("#propertyZip").value.trim();
      property.county = Utils.query("#propertyCounty").value.trim();
      property.apn = Utils.query("#propertyAPN").value.trim();
      property.legalDescription = Utils.query("#propertyLegal").value.trim();
      property.notes = Utils.query("#propertyNotes").value.trim();
      const idx = state.properties.findIndex((p) => p.id === property.id);
      if (idx >= 0) state.properties[idx] = property; else state.properties.unshift(property);
      persist();
      UI.closeModal();
      setView("properties");
    }, { once: true });
  }

  function bindEmailModalHandlers(existing = null) {
    const save = Utils.query("#saveEmailTemplate");
    if (!save) return;
    save.addEventListener("click", () => {
      const template = existing || EmailManagerEngine.normalize({});
      template.name = Utils.query("#emailTemplateName").value.trim();
      template.subject = Utils.query("#emailTemplateSubject").value.trim();
      template.body = Utils.query("#emailTemplateBody").value;
      EmailManagerEngine.version(template, "Email template edited");
      const idx = state.emailTemplates.findIndex((t) => t.id === template.id);
      if (idx >= 0) state.emailTemplates[idx] = template; else state.emailTemplates.unshift(template);
      AuditLoggerEngine.log(state, "Updated Email Template", "emailTemplate", null, template.name);
      persist();
      UI.closeModal();
      setView("emails");
    }, { once: true });
    const duplicate = Utils.query("#duplicateEmailTemplate");
    if (duplicate) duplicate.addEventListener("click", () => {
      const copy = EmailManagerEngine.duplicate(existing || EmailManagerEngine.normalize({ name: Utils.query("#emailTemplateName").value.trim(), subject: Utils.query("#emailTemplateSubject").value.trim(), body: Utils.query("#emailTemplateBody").value }));
      state.emailTemplates.unshift(copy);
      persist();
      UI.closeModal();
      setView("emails");
    }, { once: true });
  }

  function bindModalHandlers(template) {
    const save = Utils.query("#saveTemplate");
    if (save) save.addEventListener("click", () => {
      BackupManager.createBackup(template, "Before template save");
      template.name = Utils.query("#tplName").value.trim();
      template.content = Utils.query("#tplContent").value;
      VersionManager.recordVersion(template, "Template edited", template.content);
      persist();
      UI.closeModal();
      UI.notify("Template saved with backup created.", "success");
      setView("templates");
    });
    const duplicate = Utils.query("#duplicateTemplate");
    if (duplicate) duplicate.addEventListener("click", () => {
      const copy = VersionManager.duplicate(template);
      state.templates.unshift(copy);
      persist();
      UI.closeModal();
      UI.notify("Template duplicated.", "success");
      setView("templates");
    });
    const replace = Utils.query("#replaceTemplate");
    if (replace) replace.addEventListener("click", async () => {
      const newContent = Utils.query("#tplContent").value;
      const newName = Utils.query("#tplName").value.trim();
      if (newName) template.name = newName;
      TemplateManagerEngine.replaceMaster(state, template.id, newContent, "Replaced master template");
      persist();
      UI.closeModal();
      UI.notify("Master template replaced and archived history preserved.", "success");
      setView("templates");
    });
    const deleteBtn = Utils.query("#deleteTemplate");
    if (deleteBtn) deleteBtn.addEventListener("click", () => {
      if (!confirm("Delete this template? It will be archived, not permanently removed.")) return;
      TemplateManagerEngine.deleteTemplate(state, template.id);
      persist();
      UI.closeModal();
      UI.notify("Template archived.", "success");
      setView("templates");
    });
    const restore = Utils.query("#restoreTemplate");
    if (restore) restore.addEventListener("click", () => {
      const versions = template.versions || [];
      if (versions.length < 2) return UI.notify("No previous template versions available.", "error");
      const previous = versions[1];
      template.name = previous.name;
      template.content = previous.content;
      VersionManager.recordVersion(template, `Restored version ${previous.version}`, previous.content);
      persist();
      UI.closeModal();
      UI.notify("Previous version restored.", "success");
      setView("templates");
    });
    const compare = Utils.query("#compareVersions");
    if (compare) compare.addEventListener("click", () => {
      const a = Utils.query("#compareVersionA")?.value;
      const b = Utils.query("#compareVersionB")?.value;
      if (!a || !b) return UI.notify("Select two versions to compare.", "error");
      const left = (template.versions || []).find((v) => String(v.version) === String(a));
      const right = (template.versions || []).find((v) => String(v.version) === String(b));
      if (!left || !right) return UI.notify("Could not load selected versions.", "error");
      UI.modal(`
        <div class="modal-header"><div><h3>Compare Versions</h3><p class="muted">${Utils.escapeHtml(template.name)}</p></div><button class="btn btn-secondary" data-close-modal>Close</button></div>
        <div class="card"><pre style="white-space:pre-wrap; margin:0;">${ComparisonEngine.renderDiff(left.content, right.content)}</pre></div>
      `);
    });
    Utils.queryAll("[data-version-download]").forEach((btn) => btn.addEventListener("click", () => {
      const version = (template.versions || []).find((v) => String(v.version) === String(btn.dataset.versionDownload));
      if (!version) return UI.notify("Version not found.", "error");
      FileManager.downloadBlob(new Blob([version.content], { type: "text/plain;charset=utf-8" }), `${TemplateUtils.slug(template.name)}_v${version.version}.txt`);
    }));
    Utils.queryAll("[data-version-restore]").forEach((btn) => btn.addEventListener("click", () => {
      VersionManager.restoreVersion(template, btn.dataset.versionRestore);
      persist();
      UI.closeModal();
      UI.notify("Version restored.", "success");
      setView("templates");
    }));
    Utils.queryAll("[data-version-delete]").forEach((btn) => btn.addEventListener("click", () => {
      if (!confirm("Delete this version from history?")) return;
      template.versions = (template.versions || []).filter((v) => String(v.version) !== String(btn.dataset.versionDelete));
      persist();
      UI.closeModal();
      UI.notify("Version deleted.", "success");
      setView("templates");
    }));
    Utils.queryAll("[data-close-modal]").forEach((btn) => btn.addEventListener("click", UI.closeModal));
  }

  async function init() {
    state = await StorageService.initialize();
    migrateState();
    window.__appState = state;
    ErrorManager.install(() => state, () => StorageService.save(state));
    document.body.classList.toggle("dark", !!state.settings.darkMode);
    Utils.query("#companyNameDisplay").textContent = state.settings.companyName;
    Utils.queryAll(".nav-item, [data-view]").forEach((btn) => {
      const view = btn.dataset.view;
      if (!view) return;
      btn.addEventListener("click", () => setView(view));
    });
    Utils.query("#openContractBuilder").addEventListener("click", () => setView("contract"));
    Utils.query("#quickNewDeal").addEventListener("click", () => { state.ui.activeDealId = null; setView("contract"); });
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); CommandPaletteView.render(state); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") { e.preventDefault(); state.ui.activeDealId = null; setView("contract"); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); if (Utils.query("#dealForm")) saveDealFromForm(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "g") { e.preventDefault(); if (Utils.query("#previewContract")) Utils.query("#previewContract").click(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "t") { e.preventDefault(); setView("templates"); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") { e.preventDefault(); setView("search"); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "e") { e.preventDefault(); setView("reports"); }
      if (e.key === "Escape") UI.closeModal();
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "d") { e.preventDefault(); setView("diagnostics"); }
    });
    try {
      const restoredDraft = await StorageService.loadDraft();
      if (restoredDraft) {
        console.debug("[Autosave] Restoring draft on app load", {
          dealId: restoredDraft.dealId,
          contractType: restoredDraft.contractType,
          lastModified: restoredDraft.lastModified,
        });
        state.drafts = [restoredDraft];
        state.ui.activeDealId = restoredDraft.deal.id;
        state.ui.draftContractType = restoredDraft.contractType;
        const idx = state.deals.findIndex((deal) => deal.id === restoredDraft.deal.id);
        if (idx >= 0) state.deals[idx] = restoredDraft.deal; else state.deals.unshift(restoredDraft.deal);
        setView("contract");
        setDraftStatus(`Last saved at ${formatSaveTime(restoredDraft.lastModified)}`, "saved");
        UI.notify("Previous draft restored.", "success");
        return;
      }
      console.debug("[Autosave] No unfinished draft found during app load");
    } catch (error) {
      console.warn("Saved draft could not be restored", error);
      try {
        const corruptedDraft = await StorageService.clearDraft("corrupted");
        state.drafts = [corruptedDraft];
      } catch (clearError) {
        console.warn("Failed to mark corrupted draft", clearError);
      }
      UI.notify("Saved draft could not be restored. Start a new contract when ready.", "error");
    }
    setView("dashboard");
  }

  window.addEventListener("DOMContentLoaded", init);
})();

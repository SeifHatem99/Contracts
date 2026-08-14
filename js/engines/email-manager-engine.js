(function () {
  const DEFAULT_EMAIL_TEMPLATES = [
    { id: "email_review", name: "Contract Sent For Review", subject: "Contract Review for {{PROPERTY_ADDRESS}}", body: "Hello,\n\nPlease review the contract for {{PROPERTY_ADDRESS}}. Seller: {{SELLER_NAME}}. Contract type: {{CONTRACT_TYPE}}.\n\nThank you," },
    { id: "email_signature", name: "Contract Sent For Signature", subject: "Signature Requested - {{PROPERTY_ADDRESS}}", body: "Hello,\n\nThe contract for {{PROPERTY_ADDRESS}} is ready for signature. Closing date: {{CLOSING_DATE}}.\n\nThank you," },
    { id: "email_revision", name: "Contract Revision Request", subject: "Revision Requested - {{PROPERTY_ADDRESS}}", body: "Hello,\n\nPlease review the requested revisions for {{PROPERTY_ADDRESS}}.\n\nThank you," },
    { id: "email_cancellation", name: "Cancellation Notice", subject: "Cancellation Notice - {{PROPERTY_ADDRESS}}", body: "Hello,\n\nThis notice confirms the cancellation of the contract for {{PROPERTY_ADDRESS}}.\n\nThank you," },
    { id: "email_price_revision", name: "Price Revision Notice", subject: "Price Revision - {{PROPERTY_ADDRESS}}", body: "Hello,\n\nA price revision has been prepared for {{PROPERTY_ADDRESS}}. New price: {{PURCHASE_PRICE}}.\n\nThank you," },
    { id: "email_closing_reminder", name: "Closing Reminder", subject: "Closing Reminder - {{PROPERTY_ADDRESS}}", body: "Hello,\n\nThis is a reminder that closing for {{PROPERTY_ADDRESS}} is scheduled for {{CLOSING_DATE}}.\n\nThank you," },
  ];

  function normalize(template) {
    return {
      id: template.id || Utils.uid("emailtpl"),
      name: template.name || "Email Template",
      subject: template.subject || "",
      body: template.body || "",
      category: template.category || "General",
      version: template.version || 1,
      versions: template.versions || [],
      createdAt: template.createdAt || new Date().toISOString(),
      modifiedAt: template.modifiedAt || new Date().toISOString(),
      archived: !!template.archived,
    };
  }

  function render(template, deal, settings = {}) {
    const map = PlaceholderEngine.buildMap(deal, settings);
    map.CONTRACT_TYPE = deal.contractTypeLabel || deal.contractType || "";
    return {
      subject: String(template.subject || "").replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, token) => Utils.escapeHtml(map[token] ?? "")),
      body: String(template.body || "").replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, token) => Utils.escapeHtml(map[token] ?? "")),
    };
  }

  function generateAssistantEmail(deal = {}, mode = "formal", settings = {}) {
    const normalized = DealEngine.normalize(deal, settings);
    const sellerName = String(normalized.sellerName || normalized.name || "").trim();
    const template = `Dear [Seller Name],

I hope you are doing well.

Please find attached the contract for your review on behalf of Same Day Home Solutions. Kindly review it and let me know if you have any questions or need any revisions.

I look forward to your feedback.

Best regards,
Seif Eldin Abdo
Same Day Home Solutions`;
    return {
      subject: "Contract for Review",
      body: template.replace("[Seller Name]", sellerName),
    };
  }

  function seed(state) {
    if (!state.emailTemplates || !state.emailTemplates.length) {
      state.emailTemplates = DEFAULT_EMAIL_TEMPLATES.map(normalize);
    } else {
      state.emailTemplates = state.emailTemplates.map(normalize);
    }
    return state;
  }

  function duplicate(template) {
    const copy = TemplateUtils.clone(template);
    copy.id = Utils.uid("emailtpl");
    copy.name = `${template.name} Copy`;
    copy.version = 1;
    copy.versions = [{
      version: 1,
      createdAt: new Date().toISOString(),
      changeNotes: "Duplicated email template",
      subject: copy.subject,
      body: copy.body,
    }];
    return copy;
  }

  function version(template, notes = "Email template updated") {
    template.versions = template.versions || [];
    template.versions.unshift({
      version: (template.version || 1) + 1,
      createdAt: new Date().toISOString(),
      changeNotes: notes,
      subject: template.subject,
      body: template.body,
    });
    template.version = (template.version || 1) + 1;
    template.modifiedAt = new Date().toISOString();
  }

  window.EmailManagerEngine = { seed, normalize, render, duplicate, version, generateAssistantEmail };
})();

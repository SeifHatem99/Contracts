(function () {
  function contract(contractType) {
    return window.ContractDefinitions?.get(contractType) || window.ContractDefinitions?.get("psa");
  }

  const FIELD_META = {
    sellerName: { label: "Seller Name", required: true, section: "seller" },
    purchasePrice: { label: "Purchase Price", required: false, section: "financial", format: "currency" },
    earnestMoneyDeposit: { label: "Earnest Money Deposit", section: "financial", format: "currency" },
    cashAtCloseOfEscrow: { label: "Cash at Close of Escrow (COE)", section: "financial", format: "currency" },
    closeOfEscrowDays: { label: "Close of Escrow Days", section: "financial" },
    inspectionPeriodDays: { label: "Inspection Period Days", section: "financial" },
    property: { label: "Property", section: "property" },
    name: { label: "Name", section: "property" },
    propertyAddress: { label: "Property Address", section: "property" },
    date: { label: "Date", section: "property" },
    body: { label: "Body", section: "property" },
    sellerRetainedBalance: { label: "Seller Retained Balance", section: "financial", format: "currency" },
  };

  function create(type = "psa") {
    const resolved = contract(type);
    return {
      id: Utils.uid("deal"),
      contractType: resolved.id,
      contractTypeLabel: resolved.label,
      companyId: "",
      companyName: "",
      companyOwner: "",
      status: "Draft",
      sellerName: "",
      sellerSignature1: "",
      sellerSignature2: "",
      purchasePrice: "",
      earnestMoneyDeposit: "",
      cashAtCloseOfEscrow: "",
      closeOfEscrowDays: "",
      inspectionPeriodDays: "",
      property: "",
      name: "",
      propertyAddress: "",
      date: "",
      body: "",
      sellerRetainedBalance: "",
      notes: [],
      activities: [],
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function normalize(input, settings = {}) {
    const deal = { ...create(input.contractType || "psa"), ...Utils.deepClone(input) };
    deal.purchasePrice = FormattingEngine.number(deal.purchasePrice);
    deal.earnestMoneyDeposit = FormattingEngine.number(deal.earnestMoneyDeposit);
    deal.cashAtCloseOfEscrow = FormattingEngine.number(deal.cashAtCloseOfEscrow);
    deal.sellerRetainedBalance = FormattingEngine.number(deal.sellerRetainedBalance);
    deal.purchasePriceWords = FormattingEngine.words(deal.purchasePrice);
    deal.titleCompany = deal.titleCompany || settings.defaultTitleCompany || "";
    const company = window.CompanyDefinitions?.get(deal.companyId);
    if (company) {
      deal.companyName = company.name;
      deal.companyOwner = company.ownerName;
    }
    deal.sellerSignature1 = String(deal.sellerSignature1 || deal.sellerName || "").trim();
    deal.sellerSignature2 = String(deal.sellerSignature2 || "").trim();
    deal.contractTypeLabel = contract(deal.contractType)?.label || deal.contractTypeLabel || deal.contractType;
    deal.status = deal.status || "Draft";
    deal.notes = Array.isArray(deal.notes) ? deal.notes : [];
    deal.activities = Array.isArray(deal.activities) ? deal.activities : [];
    deal.documents = Array.isArray(deal.documents) ? deal.documents : [];
    deal.updatedAt = new Date().toISOString();
    return deal;
  }

  function sections() {
    return {
      seller: ["sellerName", "sellerSignature1", "sellerSignature2"],
      company: ["companyId"],
      financial: ["purchasePrice", "earnestMoneyDeposit", "cashAtCloseOfEscrow", "closeOfEscrowDays", "inspectionPeriodDays", "sellerRetainedBalance"],
      property: ["property", "name", "propertyAddress", "date", "body"],
    };
  }

  function fieldMeta() {
    return FIELD_META;
  }

  function editableFields(contractType) {
    return contract(contractType)?.editableFields || contract("psa").editableFields;
  }

  function requiredFields(contractType) {
    return contract(contractType)?.requiredFields || contract("psa").requiredFields;
  }

  function longDate(value) {
    if (!value) return "";
    const raw = String(value);
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? new Date(`${raw}T00:00:00`)
      : new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(parsed);
  }

  function editableFieldMap(contractType, deal, settings = {}) {
    const normalized = normalize(deal, settings);
    const currency = settings.currency || "USD";
    const money = (value) => (value ? FormattingEngine.currency(value, currency) : "");
    const selected = contract(contractType);
    const company = window.CompanyDefinitions?.get(normalized.companyId);
    const tokenMap = {};
    const placeholders = selected?.placeholderMap || contract("psa").placeholderMap;
    Object.entries(placeholders).forEach(([token, fieldRef]) => {
      if (Array.isArray(fieldRef)) {
        tokenMap[token] = fieldRef.map((fieldName) => {
          if (fieldName === "purchasePrice") return money(normalized.purchasePrice);
          if (fieldName === "sellerRetainedBalance") return money(normalized.sellerRetainedBalance);
          return normalized[fieldName] || "";
        });
        return;
      }
      if (fieldRef === "date") {
        tokenMap[token] = longDate(normalized.date);
        return;
      }
      if (fieldRef === "body") {
        tokenMap[token] = normalized.body || "";
        return;
      }
      if (fieldRef === "companyId") {
        tokenMap[token] = normalized.companyId || "";
        return;
      }
      if (fieldRef === "companyName") {
        tokenMap[token] = normalized.companyName || company?.name || "";
        return;
      }
      if (fieldRef === "companyOwner") {
        tokenMap[token] = normalized.companyOwner || company?.ownerName || "";
        return;
      }
      if (["purchasePrice", "earnestMoneyDeposit", "cashAtCloseOfEscrow", "sellerRetainedBalance"].includes(fieldRef)) {
        tokenMap[token] = money(normalized[fieldRef]);
        return;
      }
      tokenMap[token] = normalized[fieldRef] || "";
    });
    return tokenMap;
  }

  function statuses() {
    return ["Draft", "Under Review", "Ready for Signature", "Sent", "Signed", "Closed", "Cancelled"];
  }

  window.DealEngine = { create, normalize, sections, fieldMeta, statuses, editableFields, requiredFields, editableFieldMap };
})();

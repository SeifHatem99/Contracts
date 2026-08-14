(function () {
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

  const CONTRACT_EDITABLE_FIELDS = {
    psa: ["sellerName", "propertyAddress", "purchasePrice", "earnestMoneyDeposit", "cashAtCloseOfEscrow", "closeOfEscrowDays", "inspectionPeriodDays"],
    psa_marketing: ["sellerName", "propertyAddress", "purchasePrice", "earnestMoneyDeposit", "cashAtCloseOfEscrow", "closeOfEscrowDays", "inspectionPeriodDays"],
    aif: ["property", "name"],
    novation: ["sellerName", "propertyAddress", "purchasePrice", "sellerRetainedBalance"],
    addendum: ["sellerName", "date", "propertyAddress", "body"],
    cancellation: ["sellerName", "propertyAddress", "body"],
  };

  const CONTRACT_REQUIRED_FIELDS = {
    psa: ["sellerName", "propertyAddress", "purchasePrice", "earnestMoneyDeposit", "cashAtCloseOfEscrow", "closeOfEscrowDays", "inspectionPeriodDays"],
    psa_marketing: ["sellerName", "propertyAddress", "purchasePrice", "earnestMoneyDeposit", "cashAtCloseOfEscrow", "closeOfEscrowDays", "inspectionPeriodDays"],
    aif: ["property", "name"],
    novation: ["sellerName", "propertyAddress", "purchasePrice", "sellerRetainedBalance"],
    addendum: ["sellerName", "date", "propertyAddress"],
    cancellation: ["sellerName", "propertyAddress"],
  };

  const CONTRACT_LABELS = {
    psa: "PSA",
    psa_marketing: "PSA (with marketing)",
    aif: "AIF",
    novation: "Novation",
    addendum: "Addendum",
    cancellation: "Cancellation Agreement",
  };

  function create(type = "psa") {
    return {
      id: Utils.uid("deal"),
      contractType: type,
      contractTypeLabel: type,
      status: "Draft",
      sellerName: "",
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
    deal.contractTypeLabel = CONTRACT_LABELS[deal.contractType] || deal.contractTypeLabel || deal.contractType;
    deal.status = deal.status || "Draft";
    deal.notes = Array.isArray(deal.notes) ? deal.notes : [];
    deal.activities = Array.isArray(deal.activities) ? deal.activities : [];
    deal.documents = Array.isArray(deal.documents) ? deal.documents : [];
    deal.updatedAt = new Date().toISOString();
    return deal;
  }

  function sections() {
    return {
      seller: ["sellerName"],
      financial: ["purchasePrice", "earnestMoneyDeposit", "cashAtCloseOfEscrow", "closeOfEscrowDays", "inspectionPeriodDays", "sellerRetainedBalance"],
      property: ["property", "name", "propertyAddress", "date", "body"],
    };
  }

  function fieldMeta() {
    return FIELD_META;
  }

  function editableFields(contractType) {
    return CONTRACT_EDITABLE_FIELDS[contractType] || CONTRACT_EDITABLE_FIELDS.psa;
  }

  function requiredFields(contractType) {
    return CONTRACT_REQUIRED_FIELDS[contractType] || CONTRACT_REQUIRED_FIELDS.psa;
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
    const maps = {
      psa: {
        SELLER_NAME: normalized.sellerName || "",
        PROPERTY_ADDRESS: normalized.propertyAddress || "",
        PURCHASE_PRICE: money(normalized.purchasePrice),
        EARNEST_MONEY_DEPOSIT: money(normalized.earnestMoneyDeposit),
        EARNEST_MONEY: money(normalized.earnestMoneyDeposit),
        CASH_AT_CLOSE: money(normalized.cashAtCloseOfEscrow),
        CASH_AT_CLOSE_OF_ESCROW: money(normalized.cashAtCloseOfEscrow),
        CLOSE_OF_ESCROW_DAYS: normalized.closeOfEscrowDays || "",
        INSPECTION_PERIOD_DAYS: normalized.inspectionPeriodDays || "",
      },
      psa_marketing: {
        SELLER_NAME: normalized.sellerName || "",
        PROPERTY_ADDRESS: normalized.propertyAddress || "",
        PURCHASE_PRICE: money(normalized.purchasePrice),
        EARNEST_MONEY_DEPOSIT: money(normalized.earnestMoneyDeposit),
        EARNEST_MONEY: money(normalized.earnestMoneyDeposit),
        CASH_AT_CLOSE: money(normalized.cashAtCloseOfEscrow),
        CASH_AT_CLOSE_OF_ESCROW: money(normalized.cashAtCloseOfEscrow),
        CLOSE_OF_ESCROW_DAYS: normalized.closeOfEscrowDays || "",
        INSPECTION_PERIOD_DAYS: normalized.inspectionPeriodDays || "",
      },
      aif: {
        PROPERTY_ADDRESS: normalized.property || "",
        SELLER_NAME: normalized.name || "",
        ATTORNEY_IN_FACT_NAME: normalized.name || "",
      },
      novation: {
        SELLER_NAME: normalized.sellerName || "",
        PROPERTY_ADDRESS: normalized.propertyAddress || "",
        PURCHASE_PRICE: [money(normalized.purchasePrice), money(normalized.sellerRetainedBalance)],
        SELLER_RETAINED_BALANCE: money(normalized.sellerRetainedBalance),
      },
      addendum: {
        SELLER_NAME: normalized.sellerName || "",
        DATE: longDate(normalized.date),
        PROPERTY_ADDRESS: normalized.propertyAddress || "",
        BODY: normalized.body || "",
      },
      cancellation: {
        SELLER_NAME: normalized.sellerName || "",
        PROPERTY_ADDRESS: normalized.propertyAddress || "",
        BODY: normalized.body || "",
      },
    };
    return maps[contractType] || maps.psa;
  }

  function statuses() {
    return ["Draft", "Under Review", "Ready for Signature", "Sent", "Signed", "Closed", "Cancelled"];
  }

  window.DealEngine = { create, normalize, sections, fieldMeta, statuses, editableFields, requiredFields, editableFieldMap };
})();

(function () {
  const CONTRACTS = [
    {
      id: "psa",
      label: "PSA",
      aliases: ["Purchase Agreement", "PSA"],
      templateFile: "PSA.docx",
      templateName: "PSA",
      formSections: [
        {
          title: "PSA",
          fields: [
            ["sellerName", "Seller Name", "text"],
            ["propertyAddress", "Property Address", "text"],
            ["purchasePrice", "Purchase Price", "text", true],
            ["earnestMoneyDeposit", "Earnest Money Deposit", "text", true],
            ["cashAtCloseOfEscrow", "Cash at Close of Escrow (COE)", "text", true, true],
            ["closeOfEscrowDays", "Close of Escrow Days", "text"],
            ["inspectionPeriodDays", "Inspection Period Days", "text"],
          ],
        },
      ],
      editableFields: ["sellerName", "propertyAddress", "purchasePrice", "earnestMoneyDeposit", "cashAtCloseOfEscrow", "closeOfEscrowDays", "inspectionPeriodDays"],
      requiredFields: ["sellerName", "propertyAddress", "purchasePrice", "earnestMoneyDeposit", "cashAtCloseOfEscrow", "closeOfEscrowDays", "inspectionPeriodDays"],
      placeholderMap: {
        SELLER_NAME: "sellerName",
        PROPERTY_ADDRESS: "propertyAddress",
        PURCHASE_PRICE: "purchasePrice",
        EARNEST_MONEY_DEPOSIT: "earnestMoneyDeposit",
        EARNEST_MONEY: "earnestMoneyDeposit",
        CASH_AT_CLOSE: "cashAtCloseOfEscrow",
        CASH_AT_CLOSE_OF_ESCROW: "cashAtCloseOfEscrow",
        CLOSE_OF_ESCROW_DAYS: "closeOfEscrowDays",
        INSPECTION_PERIOD_DAYS: "inspectionPeriodDays",
      },
      generationOptions: { cashAtCloseAuto: true },
    },
    {
      id: "psa_marketing",
      label: "PSA (with marketing)",
      aliases: ["PSA (with marketing)"],
      templateFile: "PSA(with marketing).docx",
      templateName: "PSA (with marketing)",
      formSections: [
        {
          title: "PSA (with marketing)",
          fields: [
            ["sellerName", "Seller Name", "text"],
            ["propertyAddress", "Property Address", "text"],
            ["purchasePrice", "Purchase Price", "text", true],
            ["earnestMoneyDeposit", "Earnest Money Deposit", "text", true],
            ["cashAtCloseOfEscrow", "Cash at Close of Escrow (COE)", "text", true, true],
            ["closeOfEscrowDays", "Close of Escrow Days", "text"],
            ["inspectionPeriodDays", "Inspection Period Days", "text"],
          ],
        },
      ],
      editableFields: ["sellerName", "propertyAddress", "purchasePrice", "earnestMoneyDeposit", "cashAtCloseOfEscrow", "closeOfEscrowDays", "inspectionPeriodDays"],
      requiredFields: ["sellerName", "propertyAddress", "purchasePrice", "earnestMoneyDeposit", "cashAtCloseOfEscrow", "closeOfEscrowDays", "inspectionPeriodDays"],
      placeholderMap: {
        SELLER_NAME: "sellerName",
        PROPERTY_ADDRESS: "propertyAddress",
        PURCHASE_PRICE: "purchasePrice",
        EARNEST_MONEY_DEPOSIT: "earnestMoneyDeposit",
        EARNEST_MONEY: "earnestMoneyDeposit",
        CASH_AT_CLOSE: "cashAtCloseOfEscrow",
        CASH_AT_CLOSE_OF_ESCROW: "cashAtCloseOfEscrow",
        CLOSE_OF_ESCROW_DAYS: "closeOfEscrowDays",
        INSPECTION_PERIOD_DAYS: "inspectionPeriodDays",
      },
      generationOptions: { cashAtCloseAuto: true },
    },
    {
      id: "aif",
      label: "AIF",
      aliases: ["AIF"],
      templateFile: "AIF.docx",
      templateName: "AIF",
      formSections: [
        {
          title: "AIF",
          fields: [
            ["property", "Property", "text"],
            ["name", "Name", "text"],
          ],
        },
      ],
      editableFields: ["property", "name"],
      requiredFields: ["property", "name"],
      placeholderMap: {
        PROPERTY_ADDRESS: "property",
        SELLER_NAME: "name",
        ATTORNEY_IN_FACT_NAME: "name",
      },
      generationOptions: {},
    },
    {
      id: "novation",
      label: "Novation",
      aliases: ["Assignment Agreement", "Novation"],
      templateFile: "Novation.docx",
      templateName: "Novation",
      formSections: [
        {
          title: "Novation",
          fields: [
            ["sellerName", "Seller Name", "text"],
            ["propertyAddress", "Property Address", "text"],
            ["purchasePrice", "Purchase Price", "text", true],
            ["sellerRetainedBalance", "Seller Retained Balance", "text", true],
          ],
        },
      ],
      editableFields: ["sellerName", "propertyAddress", "purchasePrice", "sellerRetainedBalance"],
      requiredFields: ["sellerName", "propertyAddress", "purchasePrice", "sellerRetainedBalance"],
      placeholderMap: {
        SELLER_NAME: "sellerName",
        PROPERTY_ADDRESS: "propertyAddress",
        PURCHASE_PRICE: ["purchasePrice", "sellerRetainedBalance"],
        SELLER_RETAINED_BALANCE: "sellerRetainedBalance",
      },
      generationOptions: {},
    },
    {
      id: "addendum",
      label: "Addendum",
      aliases: ["Price Addendum", "Addendum"],
      templateFile: "Addendum.docx",
      templateName: "Addendum",
      formSections: [
        {
          title: "Addendum",
          fields: [
            ["sellerName", "Seller Name", "text"],
            ["date", "Date", "date"],
            ["propertyAddress", "Property Address", "text"],
            ["body", "Body", "textarea"],
          ],
        },
      ],
      editableFields: ["sellerName", "date", "propertyAddress", "body"],
      requiredFields: ["sellerName", "date", "propertyAddress"],
      placeholderMap: {
        SELLER_NAME: "sellerName",
        DATE: "date",
        PROPERTY_ADDRESS: "propertyAddress",
        BODY: "body",
      },
      generationOptions: { bodyBullets: true },
    },
    {
      id: "cancellation",
      label: "Cancellation Agreement",
      aliases: ["Cancellation Agreement", "Cancellation"],
      templateFile: "Cancellation.docx",
      templateName: "Cancellation Agreement",
      formSections: [
        {
          title: "Cancellation Agreement",
          fields: [
            ["sellerName", "Seller Name", "text"],
            ["propertyAddress", "Property Address", "text"],
            ["body", "Body", "textarea"],
          ],
        },
      ],
      editableFields: ["sellerName", "propertyAddress", "body"],
      requiredFields: ["sellerName", "propertyAddress"],
      placeholderMap: {
        SELLER_NAME: "sellerName",
        PROPERTY_ADDRESS: "propertyAddress",
        BODY: "body",
      },
      generationOptions: { bodyBullets: true },
    },
  ];

  const byId = new Map(CONTRACTS.map((contract) => [contract.id, contract]));
  const byAlias = new Map();
  CONTRACTS.forEach((contract) => {
    [contract.id, contract.label, ...(contract.aliases || [])].forEach((alias) => {
      byAlias.set(String(alias).toLowerCase(), contract.id);
    });
  });

  function get(id) {
    if (!id) return byId.get("psa");
    const key = resolveId(id);
    return byId.get(key) || byId.get("psa");
  }

  function resolveId(value) {
    if (!value) return "psa";
    const lower = String(value).toLowerCase();
    return byAlias.get(lower) || lower;
  }

  function list() {
    return CONTRACTS.slice();
  }

  function labels() {
    return CONTRACTS.map((contract) => [contract.id, contract.label]);
  }

  function templateFiles() {
    return Object.fromEntries(CONTRACTS.map((contract) => [contract.id, contract.templateFile]));
  }

  function findByTemplateFile(fileName) {
    const normalized = String(fileName || "").toLowerCase();
    return CONTRACTS.find((contract) => contract.templateFile.toLowerCase() === normalized) || null;
  }

  function contractFromTemplateRef(templateRef) {
    if (!templateRef) return get("psa");
    if (typeof templateRef === "string") {
      return get(resolveId(templateRef));
    }
    const match = templateRef.type || templateRef.name || templateRef.fileName || templateRef.masterFile;
    return get(resolveId(match));
  }

  window.ContractDefinitions = {
    list,
    get,
    resolveId,
    labels,
    templateFiles,
    findByTemplateFile,
    contractFromTemplateRef,
  };
})();

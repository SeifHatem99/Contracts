(function () {
  function validate(deal, contractType) {
    const errors = {};
    const normalized = DealEngine.normalize(deal);
    const required = DealEngine.requiredFields ? DealEngine.requiredFields(contractType) : DealEngine.editableFields(contractType);

    required.forEach((key) => {
      const currentValue = String(normalized[key] ?? "").trim();
      const passes = currentValue.length > 0;
      if (window.__validationDebug) {
        console.debug("[Validation]", {
          fieldName: key,
          currentValue: normalized[key],
          validationResult: passes ? "pass" : "fail",
        });
      }
      if (!passes) {
        errors[key] = "This field is required.";
      }
    });

    if (DealEngine.editableFields(contractType).includes("purchasePrice") && normalized.purchasePrice !== "" && normalized.purchasePrice !== null && normalized.purchasePrice !== undefined && Number(normalized.purchasePrice) <= 0) {
      errors.purchasePrice = "Enter a valid purchase price greater than zero.";
    }

    if (normalized.closingDate && Number.isNaN(new Date(normalized.closingDate).getTime())) {
      errors.closingDate = "Enter a valid closing date.";
    }

    return errors;
  }

  function reviewReport(deal, template, settings = {}) {
    const errors = validate(deal, deal.contractType);
    return {
      checklist: ContractValidator.checklist(deal, template, settings),
      errors,
      ready: !hasErrors(errors),
      warnings: [],
      summary: hasErrors(errors) ? "Complete required fields." : "Ready for generation.",
    };
  }

  function debugRequiredFields(deal) {
    const normalized = DealEngine.normalize(deal);
    const rows = DealEngine.editableFields(normalized.contractType).map((field) => ({
      fieldName: field,
      currentValue: normalized[field],
      validationResult: String(normalized[field] ?? "").trim() ? "pass" : "fail",
    }));
    console.table(rows);
    return rows;
  }

  function hasErrors(errors) {
    return Object.keys(errors || {}).length > 0;
  }

  function firstErrorField(errors) {
    return Object.keys(errors || {})[0] || null;
  }

  window.ValidationEngine = { validate, hasErrors, firstErrorField, reviewReport, debugRequiredFields };
})();

(function () {
  const REQUIRED = ["sellerName", "buyerName", "propertyAddress", "purchasePrice", "closingDate", "contractDate", "titleCompany"];

  function validateDeal(deal) {
    const errors = {};
    REQUIRED.forEach((field) => {
      const value = deal[field];
      if (value === undefined || value === null || String(value).trim() === "" || Number(value) === 0 && field === "purchasePrice") {
        errors[field] = "This field is required.";
      }
    });
    return errors;
  }

  function hasErrors(errors) {
    return Object.keys(errors).length > 0;
  }

  window.ValidationService = { validateDeal, hasErrors };
})();

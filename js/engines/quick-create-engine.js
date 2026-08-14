(function () {
  function fromContact(contact) {
    if (!contact) return {};
    return {
      sellerName: contact.fullName,
      titleCompany: contact.companyName || contact.fullName,
    };
  }

  function fromProperty(property) {
    if (!property) return {};
    return {
      propertyAddress: property.propertyAddress,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      county: property.county,
      propertyAPN: property.apn,
      legalDescription: property.legalDescription,
    };
  }

  window.QuickCreateEngine = { fromContact, fromProperty };
})();

(function () {
  function create(data = {}) {
    const now = new Date().toISOString();
    return {
      id: Utils.uid("prop"),
      propertyAddress: data.propertyAddress || "",
      city: data.city || "",
      state: data.state || "",
      zipCode: data.zipCode || "",
      county: data.county || "",
      apn: data.apn || "",
      legalDescription: data.legalDescription || "",
      notes: data.notes || "",
      previousDeals: data.previousDeals || [],
      createdAt: data.createdAt || now,
      lastUsedAt: data.lastUsedAt || "",
    };
  }

  function normalize(property) {
    return create(property);
  }

  function touch(property) {
    property.lastUsedAt = new Date().toISOString();
    return property;
  }

  window.PropertyManagerEngine = { create, normalize, touch };
})();

(function () {
  const CATEGORIES = ["Seller Contacts", "Buyer Contacts", "Investors", "Title Companies", "Other Parties"];

  function create(data = {}) {
    const now = new Date().toISOString();
    return {
      id: Utils.uid("contact"),
      category: data.category || "Other Parties",
      fullName: data.fullName || "",
      companyName: data.companyName || "",
      phone: data.phone || "",
      email: data.email || "",
      address: data.address || "",
      notes: data.notes || "",
      createdAt: data.createdAt || now,
      lastUsedAt: data.lastUsedAt || "",
    };
  }

  function normalize(contact) {
    return create(contact);
  }

  function listByCategory(contacts, category) {
    return (contacts || []).filter((c) => c.category === category);
  }

  function touch(contact) {
    contact.lastUsedAt = new Date().toISOString();
    return contact;
  }

  window.ContactManagerEngine = { categories: CATEGORIES, create, normalize, listByCategory, touch };
})();

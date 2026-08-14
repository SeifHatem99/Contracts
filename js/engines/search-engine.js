(function () {
  function queryDeals(deals, term) {
    const q = String(term || "").trim().toLowerCase();
    if (!q) return deals.slice();
    return deals.filter((deal) => {
      const priceText = `${FormattingEngine.currency(deal.purchasePrice)} ${FormattingEngine.words(deal.purchasePrice)}`.toLowerCase();
      return [
        deal.sellerName,
        deal.buyerName,
        deal.propertyAddress,
        deal.city,
        deal.state,
        deal.zipCode,
        deal.contractTypeLabel,
        deal.closingDate,
        deal.contractDate,
        deal.purchasePrice,
        priceText,
      ].join(" ").toLowerCase().includes(q);
    });
  }

  function queryAll(state, term) {
    const q = String(term || "").trim().toLowerCase();
    const textMatch = (value) => String(value || "").toLowerCase().includes(q);
    if (!q) {
      return {
        deals: state.deals.slice(),
        contacts: state.contacts.slice(),
        properties: state.properties.slice(),
        templates: state.templates.slice(),
        emails: (state.emails || []).slice(),
      };
    }
    return {
      deals: state.deals.filter((d) => textMatch([d.sellerName, d.buyerName, d.propertyAddress, d.contractTypeLabel, d.closingDate, d.purchasePrice].join(" "))),
      contacts: state.contacts.filter((c) => textMatch([c.fullName, c.companyName, c.phone, c.email, c.address, c.notes].join(" "))),
      properties: state.properties.filter((p) => textMatch([p.propertyAddress, p.city, p.state, p.zipCode, p.county, p.apn, p.legalDescription, p.notes].join(" "))),
      templates: state.templates.filter((t) => textMatch([t.name, t.type, t.content].join(" "))),
      emails: (state.emails || []).filter((e) => textMatch([e.subject, e.body, e.dealId].join(" "))),
    };
  }

  function sortByRecent(deals) {
    return deals.slice().sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  }

  window.SearchEngine = { queryDeals, queryAll, sortByRecent };
})();

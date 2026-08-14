(function () {
  function ensureDeal(deal) {
    deal.activities = Array.isArray(deal.activities) ? deal.activities : [];
    return deal;
  }

  function log(deal, action, description) {
    ensureDeal(deal);
    const entry = {
      id: Utils.uid("act"),
      action,
      description,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 8),
    };
    deal.activities.unshift(entry);
    deal.updatedAt = new Date().toISOString();
    return entry;
  }

  function list(deal) {
    return (deal.activities || []).slice();
  }

  window.ActivityLogger = { log, list };
})();

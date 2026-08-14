(function () {
  const COMPANIES = [
    { id: "sdhs", name: "Same Day Home Solutions LLC", ownerName: "Mohamed Maharem" },
    { id: "lui1", name: "Level Up Investments 1 LLC", ownerName: "Quy Luu" },
  ];

  const byId = new Map(COMPANIES.map((company) => [company.id, company]));

  function list() {
    return COMPANIES.slice();
  }

  function get(id) {
    if (!id) return null;
    return byId.get(String(id)) || null;
  }

  function getName(id) {
    return get(id)?.name || "";
  }

  function getOwnerName(id) {
    return get(id)?.ownerName || "";
  }

  window.CompanyDefinitions = { list, get, getName, getOwnerName };
})();

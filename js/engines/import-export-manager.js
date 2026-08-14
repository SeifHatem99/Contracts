(function () {
  function snapshot(state) {
    return {
      settings: state.settings,
      deals: state.deals,
      contacts: state.contacts || [],
      properties: state.properties || [],
      clauses: state.clauses || [],
      templates: state.templates,
      backups: state.backups,
      generated: state.generated,
      documents: state.documents,
    };
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    FileManager.downloadBlob(blob, filename);
  }

  function fileToJson(file) {
    return file.text().then((text) => {
      const parsed = JSON.parse(text);
      SecurityManager.validateSnapshot(parsed);
      return parsed;
    });
  }

  function exportSelectedDeals(state, ids) {
    return { deals: (state.deals || []).filter((deal) => ids.includes(deal.id)) };
  }

  function exportReports(state) {
    return { analytics: AnalyticsEngine.summary(state), auditLog: state.auditLog || [] };
  }

  window.ImportExportManager = { snapshot, downloadJson, fileToJson, exportSelectedDeals, exportReports };
})();

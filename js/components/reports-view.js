(function () {
  function renderReports(state) {
    const summary = AnalyticsEngine.summary(state);
    const view = Utils.query("#viewContainer");
    const csv = exportCSV(state, summary);
    view.innerHTML = `
      <div class="section-title">
        <h3>Reports</h3>
        <div class="toolbar">
          <button class="btn btn-secondary" id="downloadReportsCsv">Export CSV</button>
          <button class="btn btn-secondary" id="downloadReportsPdf">Export PDF</button>
        </div>
      </div>
      <div class="grid cols-4">
        <div class="card stat"><div><h3>Deals / Month</h3><strong>${monthlyDeals(state).length}</strong></div></div>
        <div class="card stat"><div><h3>Contracts Generated</h3><strong>${summary.contractsGenerated}</strong></div></div>
        <div class="card stat"><div><h3>Cancelled</h3><strong>${summary.dealsByStatus.Cancelled || 0}</strong></div></div>
        <div class="card stat"><div><h3>Avg Closing Time</h3><strong>${averageClosingTime(state)}</strong></div></div>
      </div>
      <div class="card" style="margin-top:18px;">
        <div class="section-title"><h3>Most Used Templates</h3></div>
        <div class="review-grid">${topTemplates(state).map((row) => `<div class="review-row"><span>${Utils.escapeHtml(row.name)}</span><strong>${row.count}</strong></div>`).join("") || `<div class="muted">No template usage yet.</div>`}</div>
      </div>
      <div class="card" style="margin-top:18px;">
        <div class="section-title"><h3>Recent Activity</h3></div>
        <div class="review-grid">${summary.recentActivity.map((item) => `<div class="review-row"><span>${Utils.escapeHtml(item.type)}</span><strong>${Utils.formatDate(item.timestamp)}</strong></div>`).join("") || `<div class="muted">No activity yet.</div>`}</div>
      </div>
    `;
    const csvBtn = Utils.query("#downloadReportsCsv");
    if (csvBtn) csvBtn.addEventListener("click", () => FileManager.downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `reports_${Utils.nowISO()}.csv`));
    const pdfBtn = Utils.query("#downloadReportsPdf");
    if (pdfBtn) pdfBtn.addEventListener("click", () => {
      const html = `<html><body><h1>Reports</h1><pre>${Utils.escapeHtml(csv)}</pre></body></html>`;
      FileManager.downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `reports_${Utils.nowISO()}.html`);
    });
  }

  function exportCSV(state, summary) {
    const rows = [
      ["Metric", "Value"],
      ["Total Deals", summary.totalDeals],
      ["Contracts Generated", summary.contractsGenerated],
      ["Contracts Signed", summary.contractsSigned],
      ["Active Deals", summary.activeDeals],
      ["Average Purchase Price", summary.averagePurchasePrice],
    ];
    return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  }

  function monthlyDeals(state) {
    const map = new Map();
    (state.deals || []).forEach((deal) => {
      if (!deal.createdAt) return;
      const key = deal.createdAt.slice(0, 7);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).sort();
  }

  function topTemplates(state) {
    const map = new Map();
    (state.generated || []).forEach((doc) => {
      map.set(doc.contractType || "unknown", (map.get(doc.contractType || "unknown") || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }

  function averageClosingTime(state) {
    const days = (state.deals || []).filter((d) => d.contractDate && d.closingDate).map((d) => {
      const start = new Date(d.contractDate);
      const end = new Date(d.closingDate);
      return Math.max(0, Math.round((end - start) / 86400000));
    });
    if (!days.length) return "N/A";
    return `${Math.round(days.reduce((a, b) => a + b, 0) / days.length)} days`;
  }

  window.ReportsView = { renderReports };
})();

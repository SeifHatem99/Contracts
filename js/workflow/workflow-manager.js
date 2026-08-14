(function () {
  function setStatus(deal, status, reason = "") {
    const allowed = DealEngine.statuses();
    if (!allowed.includes(status)) throw new Error(`Invalid status: ${status}`);
    const previous = deal.status;
    deal.status = status;
    ActivityLogger.log(deal, "Status Changed", `${previous} → ${status}${reason ? ` (${reason})` : ""}`);
    return deal;
  }

  function statusPill(status) {
    return `<span class="status-pill status-${String(status || "").toLowerCase().replace(/\s+/g, "-")}">${Utils.escapeHtml(status)}</span>`;
  }

  function isCompleted(status) {
    return ["Signed", "Closed"].includes(status);
  }

  window.WorkflowManager = { setStatus, statusPill, isCompleted };
})();

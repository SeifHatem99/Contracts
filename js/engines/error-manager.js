(function () {
  function normalizeError(error, context = "Application") {
    const message = error?.message || String(error || "Unknown error");
    return {
      id: Utils.uid("err"),
      context,
      message: SecurityManager.sanitizeText(message),
      stack: SecurityManager.sanitizeText(error?.stack || ""),
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 8),
      suggestion: recoverySuggestion(message),
    };
  }

  function recoverySuggestion(message) {
    const text = String(message || "").toLowerCase();
    if (text.includes("backup")) return "Try restoring from the latest backup and re-running the action.";
    if (text.includes("template")) return "Check the selected template version and ensure the master template is intact.";
    if (text.includes("indexeddb") || text.includes("database")) return "Refresh the page and confirm local storage permissions are enabled.";
    if (text.includes("import")) return "Verify the file is a valid application backup exported by this system.";
    return "Retry the action, then review the diagnostics page for details.";
  }

  function capture(state, error, context = "Application") {
    const entry = normalizeError(error, context);
    state.errorHistory = state.errorHistory || [];
    state.errorHistory.unshift(entry);
    state.errorHistory = state.errorHistory.slice(0, 100);
    AuditLogger.log(state, "Error Captured", `${context}: ${entry.message}`);
    return entry;
  }

  function list(state) {
    return (state.errorHistory || []).slice();
  }

  function install(stateProvider, persist) {
    const handler = (error, context) => {
      try {
        const state = stateProvider();
        capture(state, error, context);
        if (typeof persist === "function") persist();
      } catch {
        // Last resort: avoid recursive failure loops.
      }
    };

    window.addEventListener("error", (event) => handler(event.error || new Error(event.message), "Window Error"));
    window.addEventListener("unhandledrejection", (event) => handler(event.reason || new Error("Unhandled promise rejection"), "Promise Rejection"));
    return handler;
  }

  window.ErrorManager = { capture, list, install, normalizeError, recoverySuggestion };
})();

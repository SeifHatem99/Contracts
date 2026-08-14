(function () {
  function log(state, action, field, oldValue, newValue, user = "Current User") {
    state.auditLog = state.auditLog || [];
    const entry = {
      id: Utils.uid("audit"),
      user,
      action,
      field,
      oldValue,
      newValue,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 8),
    };
    state.auditLog.unshift(entry);
    return entry;
  }

  function list(state) {
    return (state.auditLog || []).slice();
  }

  window.AuditLoggerEngine = { log, list };
})();

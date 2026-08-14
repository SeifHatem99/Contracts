(function () {
  function ensure(state) {
    state.notifications = Array.isArray(state.notifications) ? state.notifications : [];
    return state.notifications;
  }

  function push(state, entry) {
    const list = ensure(state);
    list.unshift({
      id: Utils.uid("ntf"),
      type: entry.type || "success",
      message: SecurityManager.sanitizeText(entry.message || ""),
      timestamp: new Date().toISOString(),
    });
    state.notifications = list.slice(0, 100);
    return state.notifications[0];
  }

  function list(state) {
    return ensure(state).slice();
  }

  window.NotificationCenter = { push, list };
})();

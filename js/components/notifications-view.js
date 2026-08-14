(function () {
  function renderNotifications(state) {
    const view = Utils.query("#viewContainer");
    const items = NotificationCenter.list(state);
    view.innerHTML = `
      <div class="section-title"><h3>Notification History</h3></div>
      <div class="card">
        <div class="review-grid">
          ${items.map((item) => `
            <div class="card" style="box-shadow:none;">
              <div class="review-row"><span>${Utils.escapeHtml(item.type)}</span><strong>${Utils.escapeHtml(`${item.timestamp}`)}</strong></div>
              <div>${Utils.escapeHtml(item.message)}</div>
            </div>
          `).join("") || `<div class="muted">No notifications yet.</div>`}
        </div>
      </div>
    `;
  }

  window.NotificationsView = { renderNotifications };
})();

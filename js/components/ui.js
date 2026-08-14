(function () {
  function notify(message, type = "success") {
    const root = Utils.query("#notifications");
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    root.prepend(el);
    if (window.__appState && window.NotificationCenter) {
      NotificationCenter.push(window.__appState, { message, type });
    }
    setTimeout(() => el.remove(), 3200);
  }

  function modal(html) {
    const root = Utils.query("#modalRoot");
    root.innerHTML = `<div class="modal-backdrop"><div class="modal-content">${html}</div></div>`;
    root.querySelector(".modal-backdrop").addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-backdrop")) root.innerHTML = "";
    });
    root.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", closeModal);
    });
  }

  function closeModal() { Utils.query("#modalRoot").innerHTML = ""; }

  window.UI = { notify, modal, closeModal };
})();

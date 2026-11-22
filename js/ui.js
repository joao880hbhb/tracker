/**
 * KAIH 30 Hari — utilitas antarmuka
 * Ikon, toast, modal, confetti, dan helper kecil yang dipakai bersama.
 */
(function () {
  "use strict";

  const NS = (window.KAIH = window.KAIH || {});

  const ICONS = {
    sunrise:
      '<path d="M12 2v6"/><path d="m5.2 8.2 1.4 1.4"/><path d="M2 18h3"/><path d="M19 18h3"/><path d="m17.4 9.6 1.4-1.4"/><path d="M22 22H2"/><path d="M8 6a4 4 0 0 1 8 0"/><path d="M16 18a4 4 0 0 0-8 0"/><path d="M12 13v5"/>',
    pray:
      '<path d="M4 21V12a8 8 0 0 1 16 0v9"/><path d="M8.5 21v-5a3.5 3.5 0 0 1 7 0v5"/><path d="M12 4V2.5"/><path d="M2 21h20"/><path d="M9 8h6"/>',
    activity:
      '<path d="M22 12h-4l-3 8L9 4l-3 8H2"/>',
    apple:
      '<path d="M12 20.94c1.5 0 2.75-1.25 4-1.25s2.5 1.25 4 1.25c1.5-2.5 2-5.5 1-8.5-1.5-1.5-3.5-1.5-5-.5-.5-1-1.5-1.5-2.5-1.5s-2 .5-2.5 1.5c-1.5-1-3.5-1-5 .5-1 3-.5 6 1 8.5 1.5 0 2.75-1.25 4-1.25Z"/><path d="M12 10V6"/><path d="M12 6c1.5 0 3-1 3-3-1.5 0-3 1-3 3Z"/>',
    "book-open":
      '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    users:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    "moon-star":
      '<path d="M12.5 3.2A7 7 0 0 0 20.8 11.5 9 9 0 1 1 12.5 3.2Z"/><path d="M19 3v4"/><path d="M17 5h4"/>',
    smile:
      '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/>',
    meh:
      '<circle cx="12" cy="12" r="9"/><path d="M8 15h8"/><path d="M9 9h.01"/><path d="M15 9h.01"/>',
    "battery-low":
      '<rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2"/><path d="M6 11v2"/>',
    "arrow-right":
      '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "arrow-left":
      '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    "arrow-up-right":
      '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
    "chevron-left":
      '<path d="m15 18-6-6 6-6"/>',
    "chevron-right":
      '<path d="m9 18 6-6-6-6"/>',
    "chevron-down":
      '<path d="m6 9 6 6 6-6"/>',
    pencil:
      '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
    check:
      '<path d="M20 6 9 17l-5-5"/>',
    x:
      '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    menu:
      '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    play:
      '<path d="m7 4 13 8-13 8V4Z"/>',
    download:
      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    printer:
      '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3h12v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    "trash-2":
      '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    "rotate-ccw":
      '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    save:
      '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
    "calendar-days":
      '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/>',
    school:
      '<path d="M3 21h18"/><path d="M5 21V9l7-5 7 5v12"/><path d="M9 21v-5h6v5"/><path d="M9 10h.01"/><path d="M15 10h.01"/>',
    "user-round":
      '<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    "graduation-cap":
      '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12 5 2.6 9.08a1 1 0 0 0-.02 1.84L12 15l9.42-4.08Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><path d="M22 10v6"/>',
    "file-text":
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
    image:
      '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    clock:
      '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "circle-check":
      '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    info:
      '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    "alert-triangle":
      '<path d="m10.3 3.7-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.3l-8-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    maximize:
      '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    "external-link":
      '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    sprout:
      '<path d="M12 22V12"/><path d="M12 12c0-4 3-7 7-7 0 4-3 7-7 7Z"/><path d="M12 15c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6Z"/>',
    lock:
      '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><path d="M12 15v2"/>',
    "id-card":
      '<rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M5 16a3 3 0 0 1 6 0"/><path d="M14 9h5"/><path d="M14 13h5"/>',
    quote:
      '<path d="M3 21c3 0 7-1 7-8V5H3v7h5c0 3-2 4-5 4v5Z"/><path d="M14 21c3 0 7-1 7-8V5h-7v7h5c0 3-2 4-5 4v5Z"/>'
  };

  function icon(name, size, className) {
    const paths = ICONS[name] || ICONS.info;
    const dimension = Number(size) || 20;
    return (
      '<svg class="lucide-icon ' +
      (className || "") +
      '" width="' +
      dimension +
      '" height="' +
      dimension +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      paths +
      "</svg>"
    );
  }

  function hydrateIcons(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-icon]").forEach(function (node) {
      const name = node.getAttribute("data-icon");
      const size = node.getAttribute("data-icon-size") || 20;
      node.innerHTML = icon(name, Number(size));
      node.removeAttribute("data-icon");
      node.setAttribute("aria-hidden", "true");
    });
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function toastContainer() {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      container.id = "toastContainer";
      container.setAttribute("aria-live", "polite");
      document.body.appendChild(container);
    }
    return container;
  }

  function dismissToast(toast) {
    if (!toast || !toast.isConnected) return;
    if (toast._dismissTimer) {
      window.clearTimeout(toast._dismissTimer);
    }
    toast.classList.add("is-leaving");
    window.setTimeout(function () {
      toast.remove();
    }, 240);
  }

  function showToast(message, options) {
    const config = Object.assign(
      {
        title: "",
        type: "success",
        duration: 4200
      },
      options || {}
    );

    const iconMap = {
      success: "circle-check",
      warning: "alert-triangle",
      error: "x",
      info: "info"
    };

    const toast = document.createElement("div");
    toast.className = "toast toast-" + config.type;
    toast.setAttribute("role", config.type === "error" ? "alert" : "status");

    const iconWrap = document.createElement("span");
    iconWrap.className = "toast-icon";
    iconWrap.innerHTML = icon(iconMap[config.type] || "info", 19);

    const copy = document.createElement("div");
    copy.className = "toast-copy";

    if (config.title) {
      const title = document.createElement("strong");
      title.textContent = config.title;
      copy.appendChild(title);
    }

    const text = document.createElement("p");
    text.textContent = message;
    copy.appendChild(text);

    const close = document.createElement("button");
    close.type = "button";
    close.className = "toast-close";
    close.setAttribute("aria-label", "Tutup notifikasi");
    close.innerHTML = icon("x", 16);
    close.addEventListener("click", function () {
      dismissToast(toast);
    });

    toast.appendChild(iconWrap);
    toast.appendChild(copy);
    toast.appendChild(close);
    toastContainer().appendChild(toast);

    window.requestAnimationFrame(function () {
      toast.classList.add("is-visible");
    });

    toast._dismissTimer = window.setTimeout(function () {
      dismissToast(toast);
    }, Math.max(2200, config.duration));

    return toast;
  }

  let activeModal = null;
  let lastFocusedElement = null;

  function focusableElements(modal) {
    return Array.from(
      modal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(function (element) {
      return element.offsetParent !== null || element === document.activeElement;
    });
  }

  function openModal(modal, trigger) {
    if (!modal) return;
    if (activeModal && activeModal !== modal) {
      closeModal(activeModal, { restoreFocus: false });
    }

    lastFocusedElement = trigger || document.activeElement;
    activeModal = modal;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const focusables = focusableElements(modal);
    window.setTimeout(function () {
      if (focusables.length) {
        focusables[0].focus({ preventScroll: true });
      } else {
        modal.setAttribute("tabindex", "-1");
        modal.focus({ preventScroll: true });
      }
    }, 40);
  }

  function closeModal(modal, options) {
    const target = modal || activeModal;
    if (!target) return;
    const settings = Object.assign({ restoreFocus: true }, options || {});

    target.classList.remove("is-open");
    target.setAttribute("aria-hidden", "true");

    if (activeModal === target) {
      activeModal = null;
    }

    if (!document.querySelector(".modal.is-open, .lightbox.is-open")) {
      document.body.classList.remove("modal-open");
    }

    if (settings.restoreFocus && lastFocusedElement && document.contains(lastFocusedElement)) {
      window.setTimeout(function () {
        lastFocusedElement.focus({ preventScroll: true });
      }, 30);
    }
  }

  function trapFocus(event, modal) {
    const focusables = focusableElements(modal);
    if (!focusables.length) {
      event.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function initModalSystem() {
    document.addEventListener("click", function (event) {
      const closeTrigger = event.target.closest("[data-modal-close]");
      if (closeTrigger) {
        const modal = closeTrigger.closest(".modal, .lightbox");
        if (modal) closeModal(modal);
        return;
      }

      const backdrop = event.target.closest(".modal-backdrop");
      if (backdrop) {
        const modal = backdrop.closest(".modal");
        if (modal) closeModal(modal);
      }
    });

    document.addEventListener("keydown", function (event) {
      const open = document.querySelector(".modal.is-open, .lightbox.is-open");
      if (!open) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeModal(open);
        return;
      }

      if (event.key === "Tab") {
        trapFocus(event, open);
      }
    });
  }

  function launchConfetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layer = document.getElementById("confettiLayer");
    if (!layer) return;

    const colors = ["#FFD43B", "#0284C7", "#22C55E", "#F97316", "#A855F7", "#0F2942"];
    const pieces = 64;

    layer.innerHTML = "";

    for (let index = 0; index < pieces; index += 1) {
      const piece = document.createElement("span");
      const width = 6 + Math.random() * 5;
      const height = 10 + Math.random() * 9;
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.width = width + "px";
      piece.style.height = height + "px";
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 0.65 + "s";
      piece.style.animationDuration = 2.3 + Math.random() * 1.6 + "s";
      piece.style.setProperty("--drift", Math.round(Math.random() * 220 - 110) + "px");
      piece.style.setProperty("--spin", Math.round(Math.random() * 900 - 450) + "deg");
      layer.appendChild(piece);
    }

    window.setTimeout(function () {
      layer.innerHTML = "";
    }, 4800);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1500);
  }

  function formatDate(dateValue) {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function formatDateTime(dateValue) {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  }

  function debounce(callback, delay) {
    let timer = null;
    return function () {
      const args = arguments;
      const context = this;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        callback.apply(context, args);
      }, delay);
    };
  }

  NS.UI = {
    icon,
    hydrateIcons,
    escapeHTML,
    showToast,
    initModalSystem,
    openModal,
    closeModal,
    launchConfetti,
    downloadBlob,
    formatDate,
    formatDateTime,
    slugify,
    debounce
  };
})();

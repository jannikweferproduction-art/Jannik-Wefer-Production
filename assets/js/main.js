(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Mobile Navigation ------------------------------------------------ */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });

    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
        toggle.focus();
      }
    });

    var navQuery = window.matchMedia("(min-width: 60rem)");
    navQuery.addEventListener("change", function () {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  }

  /* ---- Intro-Animation (nur Startseite, einmal pro Sitzung) ------------- */
  function initIntro() {
    var intro = document.getElementById("intro");
    if (!intro) return;

    var alreadyPlayed = sessionStorage.getItem("jwp-intro-played") === "1";
    if (prefersReducedMotion || alreadyPlayed) {
      intro.setAttribute("hidden", "");
      return;
    }

    document.body.style.overflow = "hidden";

    function closeIntro() {
      if (intro.hasAttribute("hidden")) return;
      intro.classList.add("is-leaving");
      sessionStorage.setItem("jwp-intro-played", "1");
      document.body.style.overflow = "";
      window.setTimeout(function () {
        intro.setAttribute("hidden", "");
      }, 480);
    }

    var autoClose = window.setTimeout(closeIntro, 2200);

    intro.querySelector(".intro__skip").addEventListener("click", function () {
      window.clearTimeout(autoClose);
      closeIntro();
    });
    intro.addEventListener("click", function () {
      window.clearTimeout(autoClose);
      closeIntro();
    });
    window.addEventListener(
      "keydown",
      function (e) {
        if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
          window.clearTimeout(autoClose);
          closeIntro();
        }
      },
      { once: true }
    );
    window.addEventListener(
      "wheel",
      function () {
        window.clearTimeout(autoClose);
        closeIntro();
      },
      { once: true, passive: true }
    );
    window.addEventListener(
      "touchstart",
      function () {
        window.clearTimeout(autoClose);
        closeIntro();
      },
      { once: true, passive: true }
    );
  }

  /* ---- Referenzen-Lightbox ------------------------------------------------ */
  function initLightbox() {
    var dialog = document.getElementById("lightbox");
    if (!dialog) return;
    var img = dialog.querySelector("img");
    var caption = dialog.querySelector(".lightbox__caption");

    document.querySelectorAll("[data-lightbox-trigger]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var src = btn.getAttribute("data-full") || btn.querySelector("img").src;
        var alt = btn.getAttribute("data-caption") || btn.querySelector("img").alt;
        img.src = src;
        img.alt = alt;
        caption.textContent = alt;
        if (typeof dialog.showModal === "function") {
          dialog.showModal();
        } else {
          dialog.setAttribute("open", "");
        }
      });
    });

    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
    });
  }

  /* ---- Kontaktformular: Validierung + mailto-Versand --------------------
     Kein Backend vorhanden. Bis ein Formular-Service/Serverskript
     angebunden ist, wird eine mailto:-Nachricht vorbereitet. */
  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var status = document.getElementById("form-status");
    var targetEmail = form.getAttribute("data-target-email");

    function setInvalid(field, message) {
      var wrap = field.closest(".form-field");
      wrap.classList.add("is-invalid");
      var err = wrap.querySelector(".form-error");
      if (err) err.textContent = message;
    }
    function clearInvalid(field) {
      field.closest(".form-field").classList.remove("is-invalid");
    }

    form.querySelectorAll("input, textarea").forEach(function (field) {
      var evt = field.type === "checkbox" ? "change" : "input";
      field.addEventListener(evt, function () { clearInvalid(field); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;

      form.querySelectorAll("[required]").forEach(function (field) {
        clearInvalid(field);
        if (field.type === "checkbox") {
          if (!field.checked) {
            setInvalid(field, "Bitte bestätigen.");
            valid = false;
          }
        } else if (!field.value.trim()) {
          setInvalid(field, "Bitte ausfüllen.");
          valid = false;
        } else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
          setInvalid(field, "Bitte gültige E-Mail-Adresse angeben.");
          valid = false;
        }
      });

      if (!valid) {
        status.className = "form-status form-status--error";
        status.textContent = "Bitte prüfen Sie die markierten Felder.";
        status.hidden = false;
        return;
      }

      var name = form.querySelector("#name").value.trim();
      var email = form.querySelector("#email").value.trim();
      var phone = form.querySelector("#phone") ? form.querySelector("#phone").value.trim() : "";
      var message = form.querySelector("#message").value.trim();

      var subject = "Anfrage über die Website von " + name;
      var body =
        "Name: " + name + "\n" +
        "E-Mail: " + email + "\n" +
        (phone ? "Telefon: " + phone + "\n" : "") +
        "\nNachricht:\n" + message;

      var mailto =
        "mailto:" + encodeURIComponent(targetEmail) +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      status.className = "form-status form-status--success";
      status.textContent = "Ihr E-Mail-Programm öffnet sich mit der vorbereiteten Anfrage. Falls nichts passiert, schreiben Sie uns direkt an " + targetEmail + ".";
      status.hidden = false;
      window.location.href = mailto;
    });
  }

  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initIntro();
    initLightbox();
    initContactForm();
    initYear();
  });
})();

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* rAF-Drossel: hält höchstens ein ausstehendes Update pro Frame,
     statt bei jedem einzelnen mousemove-Event zu rechnen. */
  function rafThrottle(fn) {
    var scheduled = false;
    var lastArgs = null;
    return function () {
      lastArgs = arguments;
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        fn.apply(null, lastArgs);
      });
    };
  }

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

  /* ---- Scroll-Reveal: Section-Intros und Karten-Gruppen, dosiert -------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---- Ablauf/Prozess: Linie zeichnet sich Schritt für Schritt --------- */
  function initProcessReveal() {
    var items = document.querySelectorAll(".process__item");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---- Cinematic Scene: Licht-Mesh folgt dem Mauszeiger ------------------
     Nur Desktop mit echtem Zeigegerät und ohne reduzierte Bewegung; auf
     Touch/Reduced-Motion bleibt das statische Mesh aus tokens/CSS stehen. */
  function initSceneSpotlight() {
    if (!canHover || prefersReducedMotion) return;
    var scenes = document.querySelectorAll(".hero, .on-dark, .site-footer");

    scenes.forEach(function (scene) {
      var update = rafThrottle(function (x, y) {
        var rect = scene.getBoundingClientRect();
        var px = ((x - rect.left) / rect.width) * 100;
        var py = ((y - rect.top) / rect.height) * 100;
        scene.style.setProperty("--spot-x", px.toFixed(1) + "%");
        scene.style.setProperty("--spot-y", py.toFixed(1) + "%");
      });
      scene.addEventListener("mousemove", function (e) { update(e.clientX, e.clientY); });
    });
  }

  /* ---- Karten-Tilt: leichte 3D-Neigung folgt dem Mauszeiger -------------- */
  function initCardTilt() {
    if (!canHover || prefersReducedMotion) return;
    var cards = document.querySelectorAll(".card--service");

    cards.forEach(function (card) {
      var update = rafThrottle(function (x, y) {
        var rect = card.getBoundingClientRect();
        var px = (x - rect.left) / rect.width - 0.5;
        var py = (y - rect.top) / rect.height - 0.5;
        card.style.setProperty("--tilt-y", (px * 8).toFixed(2) + "deg");
        card.style.setProperty("--tilt-x", (py * -8).toFixed(2) + "deg");
        card.style.setProperty("--tilt-lift", "-4px");
      });
      card.addEventListener("mousemove", function (e) { update(e.clientX, e.clientY); });
      card.addEventListener("mouseleave", function () {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
        card.style.setProperty("--tilt-lift", "0px");
      });
    });
  }

  /* ---- Magnetische Buttons: primäre CTAs ziehen sanft zum Mauszeiger --- */
  function initMagneticButtons() {
    if (!canHover || prefersReducedMotion) return;
    var buttons = document.querySelectorAll(".btn--accent, .btn--dark");

    buttons.forEach(function (btn) {
      var update = rafThrottle(function (x, y) {
        var rect = btn.getBoundingClientRect();
        var mx = x - (rect.left + rect.width / 2);
        var my = y - (rect.top + rect.height / 2);
        btn.style.setProperty("--mag-x", (mx * 0.25).toFixed(1) + "px");
        btn.style.setProperty("--mag-y", (my * 0.25).toFixed(1) + "px");
      });
      btn.addEventListener("mousemove", function (e) { update(e.clientX, e.clientY); });
      btn.addEventListener("mouseleave", function () {
        btn.style.setProperty("--mag-x", "0px");
        btn.style.setProperty("--mag-y", "0px");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initIntro();
    initLightbox();
    initContactForm();
    initYear();
    initReveal();
    initProcessReveal();
    initSceneSpotlight();
    initCardTilt();
    initMagneticButtons();
  });
})();

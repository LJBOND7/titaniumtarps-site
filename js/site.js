(function () {
  "use strict";

  /* ---- Sticky nav state ---- */
  const nav = document.getElementById("nav");
  const onScroll = () => {
    if (window.scrollY > 30) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile menu ---- */
  const burger = document.getElementById("burger");
  const menu = document.getElementById("mobileMenu");
  const toggleMenu = (open) => {
    const isOpen = open ?? !menu.classList.contains("is-open");
    menu.classList.toggle("is-open", isOpen);
    burger.setAttribute("aria-expanded", String(isOpen));
    menu.setAttribute("aria-hidden", String(!isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  };
  burger.addEventListener("click", () => toggleMenu());
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* ---- Scroll reveal ---- */
  const revealTargets = document.querySelectorAll(
    ".exposure__sticky, .vs, .app, .scenario__visual, .scenario__copy, .wcard, .stat, .patent-grid li, .proj, .proj-feature, .coverage__list li, .contact__copy, .contact__form"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-in"));
  }

  /* ---- Count-up stats ---- */
  const counters = document.querySelectorAll(".stat__num[data-count]");
  const runCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const dur = 1100;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toString();
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toString();
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            runCount(e.target);
            co.unobserve(e.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => co.observe(el));
  }

  /* ---- Contact form: mailto fallback so it works on any static host ---- */
  const form = document.getElementById("assessmentForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = (id) => (document.getElementById(id)?.value || "").trim();
      const subject = `Site assessment request: ${v("project") || "new project"}`;
      const body =
        `Name: ${v("name")}\n` +
        `Company: ${v("company")}\n` +
        `Role: ${v("role")}\n` +
        `Project: ${v("project")}\n` +
        `Phone: ${v("phone")}\n` +
        `Email: ${v("email")}\n\n` +
        `Scope & timeline:\n${v("message")}\n`;
      const note = form.querySelector(".form-note");
      if (note) {
        note.textContent = "Opening your email to send. If nothing opens, call 305-434-0444.";
        note.classList.add("is-ok");
      }
      window.location.href =
        `mailto:info@titaniumtarps.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  /* ---- Year (footer) ---- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear().toString();
  });
})();

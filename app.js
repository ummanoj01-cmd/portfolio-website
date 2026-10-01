(function () {
  "use strict";

  const data = window.PORTFOLIO;
  const pageForSection = {};
  const header = document.getElementById("site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.getElementById("primary-navigation");
  const aiLauncher = document.getElementById("ai-launcher");
  const aiPanel = document.getElementById("ai-panel");
  const lightbox = document.getElementById("certificate-lightbox");
  let activeCertificate = 0;
  let certificateZoomed = false;
  let lastFocusedElement = null;
  let highlightTimer;

  function applyPortfolioData() {
    const personal = data.personal;
    document.querySelectorAll("[data-person]").forEach((element) => {
      const key = element.dataset.person;
      if (personal[key]) {
        if (element.tagName === "IMG") {
          element.src = personal[key];
        } else {
          element.textContent = personal[key];
        }
      }
    });
    document.querySelectorAll("[data-person-src]").forEach((img) => {
      const key = img.dataset.personSrc;
      if (personal[key]) img.src = personal[key];
    });
    document.querySelectorAll("[data-link]").forEach((link) => {
      const url = personal[link.dataset.link];
      if (url) {
        link.href = url;
      } else {
        link.hidden = true;
      }
    });
    const interests = document.querySelector("[data-interests]");
    const copyrightYear = document.getElementById("copyright-year");
    if (interests) interests.textContent = data.interests.join(" / ").toUpperCase();
    if (copyrightYear) copyrightYear.textContent = String(new Date().getFullYear());
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    if (currentPage === "index.html") document.title = `${personal.displayName} | ${personal.title}`;
  }

  function renderSkills() {
    const container = document.getElementById("skills-grid");
    if (!container) return;
    container.innerHTML = data.skills.map((skill, index) => `
      <article class="skill-card reveal" style="--card-index:${index}">
        <span class="skill-index">0${index + 1} / LANGUAGE</span>
        <h3>${escapeHtml(skill.name)}</h3>
        <p>${escapeHtml(skill.note)}</p>
        <span class="skill-level">${escapeHtml(skill.level)}</span>
      </article>`).join("");
  }

  function renderProjects() {
    const container = document.getElementById("projects-grid");
    const empty = document.getElementById("projects-empty");
    const projectCount = document.getElementById("project-count");
    if (!container || !empty || !projectCount) return;
    projectCount.textContent = `${String(data.projects.length).padStart(2, "0")} PROJECT${data.projects.length === 1 ? "" : "S"}`;
    empty.hidden = data.projects.length > 0;
    container.innerHTML = data.projects.map((project, index) => {
      const tech = (project.technologies || []).map((technology) => `<span>${escapeHtml(technology)}</span>`).join("");
      const github = project.github ? `<a href="${escapeAttribute(project.github)}" target="_blank" rel="noreferrer" aria-label="GitHub repository for ${escapeAttribute(project.title)}">GITHUB &#8599;</a>` : "";
      const demo = project.demo ? `<a href="${escapeAttribute(project.demo)}" target="_blank" rel="noreferrer" aria-label="Demo for ${escapeAttribute(project.title)}">DEMO &#8599;</a>` : "";
      const illustration = project.image
        ? `<img src="${escapeAttribute(project.image)}" alt="${escapeAttribute(project.imageAlt || `${project.title} project preview`)}">`
        : `<span class="project-visual-code" aria-hidden="true">{<br>&nbsp;&nbsp;build<br>&nbsp;&nbsp;solve<br>&nbsp;&nbsp;repeat<br>}</span>`;
      return `<article class="project-card reveal" tabindex="0" data-project-index="${index}" aria-label="${escapeAttribute(project.title)} project">
        <div class="project-visual"><span class="project-number">PROJECT / ${String(index + 1).padStart(2, "0")}</span>${illustration}<span class="project-visual-corner" aria-hidden="true">&#8599;</span></div>
        <div class="project-info"><div><span class="project-kicker">${String(index + 1).padStart(2, "0")} / BUILD LOG</span><h3>${escapeHtml(project.title)}</h3></div><p>${escapeHtml(project.description)}</p><div class="project-tech">${tech}</div><div class="project-actions"><button type="button" class="project-view" data-show-project="${index}">VIEW PROJECT <span aria-hidden="true">&#8594;</span></button>${github}${demo}</div></div>
      </article>`;
    }).join("");
    container.querySelectorAll("[data-show-project]").forEach((button) => {
      button.addEventListener("click", () => showProject(Number(button.dataset.showProject)));
    });
    container.querySelectorAll(".project-card").forEach((card) => {
      card.addEventListener("click", (event) => {
        if (!event.target.closest("a, button")) showProject(Number(card.dataset.projectIndex));
      });
      card.addEventListener("keydown", (event) => {
        if ((event.key === "Enter" || event.key === " ") && event.target === card) {
          event.preventDefault();
          showProject(Number(card.dataset.projectIndex));
        }
      });
    });
  }

  function renderCertificates() {
    const container = document.getElementById("certificate-grid");
    const empty = document.getElementById("certificates-empty");
    const certificateCount = document.getElementById("certificate-count");
    if (!container || !empty || !certificateCount) return;
    certificateCount.textContent = `${String(data.certificates.length).padStart(2, "0")} / CERTIFICATES`;
    empty.hidden = data.certificates.length > 0;
    container.innerHTML = data.certificates.map((certificate, index) => {
      const rotation = Number(certificate.rotation) || 0;
      const rotationClass = rotation ? " is-rotated" : "";
      return `
      <button class="certificate-card reveal" type="button" data-certificate-index="${index}" aria-label="Open certificate: ${escapeAttribute(certificate.title)}">
        <span class="certificate-image-wrap">${certificate.image ? `<img class="certificate-preview${rotationClass}" style="--certificate-rotation:${rotation}deg" src="${escapeAttribute(certificate.image)}" alt="${escapeAttribute(certificate.title)} certificate">` : `<span class="certificate-placeholder" aria-hidden="true"></span>`}<span class="certificate-open" aria-hidden="true">&#8599;</span></span>
        <span class="certificate-meta"><span>${escapeHtml(certificate.organization || "")}</span><strong>${escapeHtml(certificate.title)}</strong><span>${escapeHtml(certificate.date || "")}</span></span>
      </button>`;
    }).join("");
    container.querySelectorAll("[data-certificate-index]").forEach((button) => {
      button.addEventListener("click", () => openCertificate(Number(button.dataset.certificateIndex)));
    });
  }

  function renderEducation() {
    const timeline = document.getElementById("education-timeline");
    if (!timeline) return;
    timeline.innerHTML = data.education.map((item) => `
      <article class="timeline-entry">
        <span class="timeline-marker" aria-hidden="true"></span>
        <span class="timeline-period">${escapeHtml(item.period)}</span>
        <div class="timeline-detail"><h3>${escapeHtml(item.institution)}</h3><p>${escapeHtml(item.degree)}</p><div class="timeline-tags"><span>${escapeHtml(item.status)}</span><span>${escapeHtml(item.location)}</span></div></div>
      </article>`).join("");
  }

  function renderJourney() {
    const journeyPath = document.getElementById("journey-path");
    if (!journeyPath) return;
    journeyPath.innerHTML = data.progression.map((step, index) => `
      <div class="journey-step${index === data.progression.length - 1 ? " journey-step-goal" : ""}"><span class="journey-step-index">0${index + 1}</span><strong>${escapeHtml(step)}</strong>${index < data.progression.length - 1 ? '<span class="journey-connector" aria-hidden="true">&#8594;</span>' : ""}</div>`).join("");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function goToSection(section, assistantState = null) {
    const targetPage = pageForSection[section];
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    if (targetPage && currentPage !== targetPage) {
      if (assistantState) sessionStorage.setItem("manoj-ai-pending", JSON.stringify(assistantState));
      closeNavigation();
      window.location.assign(targetPage);
      return true;
    }
    const target = document.getElementById(section);
    if (!target) {
      if (currentPage !== "index.html") {
        if (assistantState) sessionStorage.setItem("manoj-ai-pending", JSON.stringify(assistantState));
        window.location.assign(`index.html#${section}`);
        return true;
      }
      return false;
    }
    target.scrollIntoView({ behavior: "instant", block: "start" });
    highlightSection(section);
    closeNavigation();
    return true;
  }

  function highlightSection(section) {
    const target = document.getElementById(section);
    if (!target) return;
    document.querySelectorAll(".section-ai-highlight").forEach((element) => element.classList.remove("section-ai-highlight"));
    target.classList.add("section-ai-highlight");
    window.clearTimeout(highlightTimer);
    highlightTimer = window.setTimeout(() => target.classList.remove("section-ai-highlight"), 1500);
  }

  function showProject(index) {
    const project = data.projects[index];
    if (!project) return;
    const card = document.querySelector(`[data-project-index="${index}"]`);
    if (card) {
      card.classList.add("project-selected");
      window.setTimeout(() => card.classList.remove("project-selected"), 1200);
    }
    goToSection("projects");
  }

  function openCertificate(index) {
    if (!lightbox || !data.certificates.length) return;
    activeCertificate = (index + data.certificates.length) % data.certificates.length;
    certificateZoomed = false;
    renderCertificateLightbox();
    lastFocusedElement = document.activeElement;
    lightbox.hidden = false;
    document.body.classList.add("dialog-open");
    document.getElementById("lightbox-close").focus();
  }

  function renderCertificateLightbox() {
    const certificate = data.certificates[activeCertificate];
    const rotation = Number(certificate.rotation) || 0;
    const rotationClass = rotation ? " is-rotated" : "";
    const image = certificate.image
      ? `<img class="lightbox-image${rotationClass}${certificateZoomed ? " is-zoomed" : ""}" style="--certificate-rotation:${rotation}deg" src="${escapeAttribute(certificate.image)}" alt="${escapeAttribute(certificate.title)} certificate">`
      : `<div class="lightbox-no-image">CERTIFICATE IMAGE NOT PROVIDED</div>`;
    document.getElementById("lightbox-content").innerHTML = `${image}<div class="lightbox-caption"><span>${escapeHtml(certificate.organization || "")}</span><h2>${escapeHtml(certificate.title)}</h2><span>${escapeHtml(certificate.date || "")}</span>${certificate.link ? `<a href="${escapeAttribute(certificate.link)}" target="_blank" rel="noreferrer">OPEN CERTIFICATE LINK &#8599;</a>` : ""}</div>`;
    document.getElementById("lightbox-prev").disabled = data.certificates.length < 2;
    document.getElementById("lightbox-next").disabled = data.certificates.length < 2;
    document.getElementById("lightbox-zoom").textContent = certificateZoomed ? "ZOOM -" : "ZOOM +";
  }

  function closeCertificate() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove("dialog-open");
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") lastFocusedElement.focus();
  }

  function moveCertificate(direction) {
    if (data.certificates.length < 2) return;
    activeCertificate = (activeCertificate + direction + data.certificates.length) % data.certificates.length;
    certificateZoomed = false;
    renderCertificateLightbox();
  }

  function openAssistant() {
    if (!aiPanel || !aiLauncher) return;
    lastFocusedElement = document.activeElement;
    aiPanel.hidden = false;
    aiLauncher.setAttribute("aria-expanded", "true");
    document.getElementById("ai-input").focus();
  }

  function closeAssistant() {
    if (!aiPanel || !aiLauncher) return;
    aiPanel.hidden = true;
    aiLauncher.setAttribute("aria-expanded", "false");
    aiLauncher.focus();
  }

  function respondToQuestion(question) {
    const normalized = question.toLowerCase();
    if (/certificate|certification/.test(normalized)) {
      const certificates = data.certificates.map((certificate) => `${certificate.title} (${certificate.organization})`).join("; ");
      return { message: `Manoj's certificates include ${certificates}. Opening the Certifications page now.`, section: "certifications" };
    }
    if (/project|built|build/.test(normalized)) {
      if (!data.projects.length) return { message: "No projects have been added to Manoj's portfolio yet. The project section is ready for his real work.", section: "projects" };
      return { message: `Manoj's projects include ${data.projects.map((project) => project.title).join(", ")}.`, section: "projects" };
    }
    if (/github|code|repo/.test(normalized)) {
      return { message: "Manoj's GitHub profile contains his code and experiments. Opening the Code page now.", section: "code" };
    }
    if (/skill|program|language|work with/.test(normalized)) {
      return { message: `Manoj is learning ${data.skills.map((skill) => `${skill.name} (${skill.level})`).join(", ")}.`, section: "skills" };
    }
    if (/education|university|college|degree|study/.test(normalized)) {
      return { message: "Manoj is a second-year B.Tech Computer Science and Engineering student at REVA University in Bangalore.", section: "education" };
    }
    if (/goal|career|future|software engineer/.test(normalized)) {
      return { message: "Manoj's long-term goal is to become a Software Engineer. He is currently learning, experimenting, solving problems, and building projects.", section: "journey" };
    }
    if (/contact|reach|linkedin|connect/.test(normalized)) {
      return { message: "You can connect with Manoj through his LinkedIn or GitHub profiles. Email is available on request.", section: "contact" };
    }
    if (/about|who|introduc/.test(normalized)) {
      return { message: "Manoj is a second-year Computer Science and Engineering student at REVA University, Bangalore, building programming and problem-solving skills with the goal of becoming a Software Engineer.", section: "about" };
    }
    if (/journey|progress|learning|direction/.test(normalized)) {
      return { message: "Manoj's path is to learn, experiment, solve, build, and improve as he works toward becoming a Software Engineer.", section: "journey" };
    }
    return { message: "I can help with Manoj's background, skills, projects, certificates, education, career goal, or contact links.", section: null };
  }

  function closeNavigation() {
    if (!menuToggle || !navigation) return;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    navigation.classList.remove("navigation-open");
  }

  function initNavigation() {
    if (!menuToggle || !navigation) return;
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") !== "true";
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      navigation.classList.toggle("navigation-open", open);
    });
    navigation.querySelectorAll("a[href^='#']").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        goToSection(link.getAttribute("href").slice(1));
      });
    });
    window.addEventListener("scroll", () => header.classList.toggle("is-scrolled", window.scrollY > 24), { passive: true });
  }

  function initAssistant() {
    if (!aiLauncher || !aiPanel) return;
    const questionLabel = document.getElementById("ai-question");
    const responseLabel = document.getElementById("ai-response");
    const input = document.getElementById("ai-input");
    const pending = sessionStorage.getItem("manoj-ai-pending");
    if (pending) {
      try {
        const state = JSON.parse(pending);
        questionLabel.textContent = state.question;
        questionLabel.hidden = false;
        responseLabel.textContent = state.reply;
        aiPanel.hidden = false;
        aiLauncher.setAttribute("aria-expanded", "true");
      } finally {
        sessionStorage.removeItem("manoj-ai-pending");
      }
    }
    aiLauncher.addEventListener("click", () => aiPanel.hidden ? openAssistant() : closeAssistant());
    document.getElementById("ai-close")?.addEventListener("click", closeAssistant);
    const submitQuestion = (question) => {
      if (!question) return;
      const response = respondToQuestion(question);
      questionLabel.textContent = question;
      questionLabel.hidden = false;
      responseLabel.textContent = response.message;
      input.value = "";
      if (response.section) {
        window.setTimeout(() => goToSection(response.section, { question, reply: response.message }), 500);
      }
    };
    document.getElementById("ai-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      submitQuestion(input.value.trim());
      input.focus();
    });
    document.querySelectorAll("[data-ai-prompt]").forEach((button) => {
      button.addEventListener("click", () => submitQuestion(button.dataset.aiPrompt));
    });
  }

  function initContactForm() {
    document.getElementById("contact-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      document.getElementById("form-note").textContent = "This form is not connected to a message service yet. No message was sent.";
    });
  }

  function initLightbox() {
    if (!lightbox) return;
    document.getElementById("lightbox-close").addEventListener("click", closeCertificate);
    document.getElementById("lightbox-prev").addEventListener("click", () => moveCertificate(-1));
    document.getElementById("lightbox-next").addEventListener("click", () => moveCertificate(1));
    document.getElementById("lightbox-zoom").addEventListener("click", () => {
      certificateZoomed = !certificateZoomed;
      renderCertificateLightbox();
    });
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeCertificate();
    });
  }

  function initReveal() {
    const elements = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    elements.forEach((element) => observer.observe(element));
  }

  document.addEventListener("keydown", (event) => {
    if (lightbox && !lightbox.hidden) {
      if (event.key === "Escape") closeCertificate();
      if (event.key === "ArrowLeft") moveCertificate(-1);
      if (event.key === "ArrowRight") moveCertificate(1);
    } else if (event.key === "Escape" && aiPanel && !aiPanel.hidden) {
      closeAssistant();
    }
  });

  window.portfolioActions = { goToSection, highlightSection, openCertificate, showProject };
  applyPortfolioData();
  renderSkills();
  renderProjects();
  renderCertificates();
  renderEducation();
  renderJourney();
  initNavigation();
  initAssistant();
  initContactForm();
  initLightbox();
  initReveal();
}());
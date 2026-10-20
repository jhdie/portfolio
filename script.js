/* ==========================================================================
   江慧达 · Portfolio 2026
   Interaction layer — no dependencies
   ========================================================================== */

(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  /* ------------------------------------------------------------------------
     Preloader
     ------------------------------------------------------------------------ */

  const preloader = $("#preloader");
  const loaderPercent = $("#loaderPercent");
  const loaderBar = $("#loaderBar");
  const loaderStatus = $("#loaderStatus");

  let pageReady = false;

  const finishLoading = () => {
    if (pageReady) return;
    pageReady = true;

    if (loaderPercent) loaderPercent.textContent = "100";
    if (loaderBar) loaderBar.style.transform = "scaleX(1)";
    if (loaderStatus) loaderStatus.textContent = "READY";

    document.body.classList.remove("is-loading");
    document.body.classList.add("is-loaded");
    preloader?.classList.add("is-hidden");
    window.setTimeout(() => {
      if (preloader) preloader.style.display = "none";
    }, 1400);

    refreshScrollUi();
  };

  if (preloader && loaderPercent && loaderBar) {
    const duration = reducedMotion ? 240 : 1150;
    const startedAt = performance.now();

    const tick = (now) => {
      const progress = clamp((now - startedAt) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * 100);

      loaderPercent.textContent = String(value).padStart(3, "0");
      loaderBar.style.transform = `scaleX(${eased})`;

      if (progress < 0.18) loaderStatus.textContent = "INITIALIZING";
      else if (progress < 0.5) loaderStatus.textContent = "BUILDING INTERFACE";
      else if (progress < 0.88) loaderStatus.textContent = "LOADING PROJECTS";
      else loaderStatus.textContent = "ALMOST READY";

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        finishLoading();
      }
    };

    requestAnimationFrame(tick);
    window.setTimeout(finishLoading, 2600);
  } else {
    finishLoading();
  }

  /* ------------------------------------------------------------------------
     Header, mobile menu, scroll progress and active navigation
     ------------------------------------------------------------------------ */

  const header = $("#siteHeader");
  const progressBar = $("#scrollProgress");
  const navLinks = $$(".desktop-nav a");
  const navSections = navLinks
    .map((link) => {
      const id = link.getAttribute("href")?.slice(1);
      return id ? document.getElementById(id) : null;
    })
    .filter(Boolean);

  let scrollQueued = false;

  function refreshScrollUi() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? clamp(scrollTop / scrollable, 0, 1) : 0;

    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    header?.classList.toggle("is-scrolled", scrollTop > 34);

    let activeId = "";
    const threshold = window.innerHeight * 0.42;

    navSections.forEach((section) => {
      if (section.getBoundingClientRect().top <= threshold) {
        activeId = section.id;
      }
    });

    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${activeId}`);
    });
  }

  const onScroll = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      refreshScrollUi();
      scrollQueued = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  refreshScrollUi();

  const menuToggle = $("#menuToggle");
  const menuOverlay = $("#menuOverlay");
  const menuLinks = $$("[data-menu-link]");

  const setMenu = (open) => {
    if (!menuToggle || !menuOverlay) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    menuOverlay.setAttribute("aria-hidden", String(!open));
    menuOverlay.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open && !document.querySelector("dialog[open]"));

    if (open && !reducedMotion) {
      window.setTimeout(() => menuLinks[0]?.focus({ preventScroll: true }), 280);
    }
  };

  menuToggle?.addEventListener("click", () => {
    const open = menuToggle.getAttribute("aria-expanded") !== "true";
    setMenu(open);
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href?.startsWith("#")) return;
      event.preventDefault();
      const target = document.querySelector(href);

      setMenu(false);
      window.setTimeout(() => {
        target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        menuToggle?.focus({ preventScroll: true });
      }, reducedMotion ? 0 : 280);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuOverlay?.classList.contains("is-open")) {
      setMenu(false);
      menuToggle?.focus({ preventScroll: true });
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980 && menuOverlay?.classList.contains("is-open")) {
      setMenu(false);
    }
  });

  /* ------------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------------ */

  const revealItems = $$(".reveal");

  $$(".stat").forEach((item, index) => {
    item.style.transitionDelay = `${index * 70}ms`;
  });
  $$(".now-item").forEach((item, index) => {
    item.style.transitionDelay = `${index * 65}ms`;
  });
  $$(".skill-group").forEach((item, index) => {
    item.style.transitionDelay = `${index * 55}ms`;
  });
  $$(".award-row").forEach((item, index) => {
    item.style.transitionDelay = `${index * 65}ms`;
  });

  if ("IntersectionObserver" in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7% 0px" }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-in"));
  }

  /* ------------------------------------------------------------------------
     Number counters
     ------------------------------------------------------------------------ */

  const statValues = $$("[data-count]");

  const animateNumber = (element) => {
    if (element.dataset.counted === "true") return;
    element.dataset.counted = "true";

    const target = parseFloat(element.dataset.count || "0");
    const decimals = parseInt(element.dataset.decimals || "0", 10);
    const pad = parseInt(element.dataset.pad || "0", 10);
    const suffix = element.dataset.suffix || "";
    const duration = reducedMotion ? 0 : 1450;
    const start = performance.now();

    const render = (value) => {
      let text = value.toFixed(decimals);
      if (pad > 0) text = text.padStart(pad, "0");
      element.textContent = `${text}${suffix}`;
    };

    if (!duration) {
      render(target);
      return;
    }

    const step = (now) => {
      const progress = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      render(target * eased);
      if (progress < 1) requestAnimationFrame(step);
      else render(target);
    };

    requestAnimationFrame(step);
  };

  if ("IntersectionObserver" in window) {
    const numberObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateNumber(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.45 }
    );

    statValues.forEach((value) => numberObserver.observe(value));
  } else {
    statValues.forEach(animateNumber);
  }

  /* ------------------------------------------------------------------------
     Custom cursor
     ------------------------------------------------------------------------ */

  const cursorDot = $("#cursorDot");
  const cursorRing = $("#cursorRing");
  const cursorLabel = $("#cursorLabel");

  if (finePointer && !reducedMotion && cursorDot && cursorRing) {
    document.body.classList.add("has-cursor");

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let cursorVisible = false;

    const setVisible = (visible) => {
      if (cursorVisible === visible) return;
      cursorVisible = visible;
      cursorDot.classList.toggle("is-visible", visible);
      cursorRing.classList.toggle("is-visible", visible);
    };

    const renderCursor = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(renderCursor);
    };

    requestAnimationFrame(renderCursor);

    window.addEventListener(
      "pointermove",
      (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
        setVisible(true);
      },
      { passive: true }
    );

    document.addEventListener("pointerleave", () => setVisible(false));
    window.addEventListener("blur", () => setVisible(false));

    document.addEventListener("pointerover", (event) => {
      const project = event.target.closest?.(".project-row");
      const interactive = event.target.closest?.("a, button, .skill-tags span");

      cursorRing.classList.toggle("is-view", Boolean(project));
      cursorRing.classList.toggle("is-hover", !project && Boolean(interactive));

      if (cursorLabel) cursorLabel.textContent = project ? "VIEW" : "";
    });

    document.addEventListener("pointerout", (event) => {
      if (event.relatedTarget) return;
      cursorRing.classList.remove("is-hover", "is-view");
    });
  }

  /* ------------------------------------------------------------------------
     Magnetic buttons and orbit parallax
     ------------------------------------------------------------------------ */

  if (finePointer && !reducedMotion) {
    $$(".magnetic").forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        element.style.transform = `translate(${x * 0.08}px, ${y * 0.11}px)`;
      });

      element.addEventListener("pointerleave", () => {
        element.style.transform = "";
      });
    });

    const orbit = $("#orbitWrap");
    const hero = $("#home");

    if (orbit && hero) {
      let orbitFrame = null;
      let orbitX = 0;
      let orbitY = 0;

      hero.addEventListener(
        "pointermove",
        (event) => {
          const rect = hero.getBoundingClientRect();
          orbitX = (event.clientX - rect.left) / rect.width - 0.5;
          orbitY = (event.clientY - rect.top) / rect.height - 0.5;

          if (orbitFrame) return;
          orbitFrame = requestAnimationFrame(() => {
            orbit.style.transform = `translate3d(${orbitX * 13}px, ${orbitY * 12}px, 0) rotateX(${orbitY * -3}deg) rotateY(${orbitX * 4}deg)`;
            orbitFrame = null;
          });
        },
        { passive: true }
      );

      hero.addEventListener("pointerleave", () => {
        orbit.style.transform = "";
      });
    }
  }

  /* ------------------------------------------------------------------------
     Hero signal field
     ------------------------------------------------------------------------ */

  const canvas = $("#heroCanvas");
  const heroSection = $("#home");

  if (canvas && heroSection) {
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let dpr = 1;
    let points = [];
    let frameId = null;
    const pointer = { x: -9999, y: -9999, active: false };

    const seedPoints = () => {
      const count = Math.max(32, Math.min(58, Math.floor((width * height) / 26000)));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        radius: Math.random() * 1.15 + 0.55,
        alpha: Math.random() * 0.35 + 0.16,
      }));
    };

    const resizeCanvas = () => {
      const rect = heroSection.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedPoints();
      if (reducedMotion) drawField(true);
    };

    const drawField = (staticFrame = false) => {
      ctx.clearRect(0, 0, width, height);

      const connectionDistance = Math.min(150, Math.max(90, width * 0.095));

      points.forEach((point, index) => {
        if (!staticFrame) {
          point.x += point.vx;
          point.y += point.vy;

          if (point.x < -10) point.x = width + 10;
          if (point.x > width + 10) point.x = -10;
          if (point.y < -10) point.y = height + 10;
          if (point.y > height + 10) point.y = -10;

          if (pointer.active) {
            const dx = pointer.x - point.x;
            const dy = pointer.y - point.y;
            const distance = Math.hypot(dx, dy);

            if (distance < 170 && distance > 1) {
              const force = (1 - distance / 170) * 0.004;
              point.x += dx * force;
              point.y += dy * force;
            }
          }
        }

        for (let j = index + 1; j < points.length; j += 1) {
          const other = points[j];
          const dx = point.x - other.x;
          const dy = point.y - other.y;
          const distance = Math.hypot(dx, dy);

          if (distance > connectionDistance) continue;

          const opacity = (1 - distance / connectionDistance) * 0.1;
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(216, 255, 79, ${opacity})`;
          ctx.lineWidth = 0.65;
          ctx.stroke();
        }

        if (pointer.active) {
          const dx = pointer.x - point.x;
          const dy = pointer.y - point.y;
          const distance = Math.hypot(dx, dy);

          if (distance < 185) {
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.strokeStyle = `rgba(216, 255, 79, ${(1 - distance / 185) * 0.22})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(216, 255, 79, ${point.alpha})`;
        ctx.fill();
      });

      if (pointer.active) {
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(216, 255, 79, 0.8)";
        ctx.fill();
      }

      if (!staticFrame) frameId = requestAnimationFrame(() => drawField(false));
    };

    const startField = () => {
      if (reducedMotion) {
        drawField(true);
        return;
      }
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => drawField(false));
    };

    heroSection.addEventListener(
      "pointermove",
      (event) => {
        const rect = heroSection.getBoundingClientRect();
        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
        pointer.active = true;
      },
      { passive: true }
    );

    heroSection.addEventListener("pointerleave", () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (frameId !== null) cancelAnimationFrame(frameId);
        frameId = null;
      } else {
        startField();
      }
    });

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resizeCanvas();
        startField();
      }, 120);
    });

    resizeCanvas();
    startField();
  }

  /* ------------------------------------------------------------------------
     Project data
     ------------------------------------------------------------------------ */

  const createSeatMap = () => {
    const selected = new Set([6, 7, 11, 14, 17, 18, 21, 25, 26, 28]);
    return Array.from({ length: 32 }, (_, index) => {
      return `<i${selected.has(index) ? ' class="is-on"' : ""}></i>`;
    }).join("");
  };

  const ticketArt = () => `
    <div class="viz viz--ticket">
      <div class="ticket">
        <div class="ticket-top"><span>ADMIT ONE</span><span>NO. 052</span></div>
        <div class="ticket-title">Movie<br><em>Night</em></div>
        <div class="ticket-meta"><span>2026 / 05 / 20</span><span>19:30</span></div>
        <div class="seat-map">${createSeatMap()}</div>
        <div class="ticket-foot"><span>SCREEN 07 · ROW H</span><span class="barcode"></span></div>
      </div>
    </div>`;

  const lifeArt = () => `
    <div class="viz viz--life">
      <div class="life-stars"></div>
      <div class="life-rings"></div>
      <div class="life-planet">LV</div>
      <div class="echo-card echo-one"><span>ECHO / 024</span><p>记录人生<br>微光。</p></div>
      <div class="echo-card echo-two"><span>AI PORTRAIT</span><p>由回声生成<br>个人画像。</p></div>
      <span class="life-label">LIFEVERSE / 2026</span>
    </div>`;

  const visionBars = [24, 38, 31, 54, 76, 94, 68, 49, 83, 61, 42, 27];

  const visionArt = () => `
    <div class="viz viz--vision">
      <div class="vision-layout">
        <div class="vision-image">
          <span class="vision-scan"></span>
          <span class="vision-box"></span>
        </div>
        <div class="vision-panel">
          <div class="panel-head"><span>AI LAB</span><i></i></div>
          <div class="panel-row">
            <div><span>CLAHE</span><b>+24</b></div>
            <div class="panel-track"><i style="width:68%"></i></div>
          </div>
          <div class="panel-row">
            <div><span>DETAIL</span><b>86</b></div>
            <div class="panel-track"><i style="width:86%"></i></div>
          </div>
          <div class="panel-row">
            <div><span>NOISE</span><b>12</b></div>
            <div class="panel-track"><i style="width:28%"></i></div>
          </div>
          <div class="histogram">
            ${visionBars.map((height) => `<i style="height:${height}%"></i>`).join("")}
          </div>
        </div>
      </div>
      <span class="vision-caption">REALTIME VISION / QT 6</span>
    </div>`;

  const cpuGrid = () => {
    const lines = [];
    for (let x = 40; x <= 520; x += 40) {
      lines.push(`<line class="cpu-grid-line" x1="${x}" y1="0" x2="${x}" y2="360"></line>`);
    }
    for (let y = 20; y <= 360; y += 40) {
      lines.push(`<line class="cpu-grid-line" x1="0" y1="${y}" x2="520" y2="${y}"></line>`);
    }
    return lines.join("");
  };

  const cpuNode = (x, y, w, h, label, sub, core = false) => `
    <g class="cpu-node${core ? " is-core" : ""}" transform="translate(${x} ${y})">
      <rect width="${w}" height="${h}" rx="1.5"></rect>
      <text x="${w / 2}" y="${h / 2 - 1}">${label}</text>
      <text class="sub" x="${w / 2}" y="${h / 2 + 11}">${sub}</text>
    </g>`;

  const mipsArt = () => `
    <div class="viz viz--cpu">
      <svg class="cpu-svg" viewBox="0 0 520 360" aria-hidden="true">
        <g>${cpuGrid()}</g>
        <g class="cpu-trace">
          <path d="M106 174 H124 V69 H142"></path>
          <path d="M184 93 V132 H200"></path>
          <path d="M304 178 H322 V81 H340"></path>
          <path d="M304 190 H334 V230 H418"></path>
          <path d="M408 174 H432 V206"></path>
          <path d="M458 254 V293 H371"></path>
          <path d="M285 293 H258 V208"></path>
          <path d="M106 198 V314 H285"></path>
          <path d="M379 105 V155"></path>
        </g>
        <path class="cpu-trace-live" pathLength="100" d="M304 178 H322 V81 H340"></path>
        ${cpuNode(28, 150, 78, 48, "PC", "PROGRAM CNT")}
        ${cpuNode(142, 45, 84, 48, "IMEM", "INSTR MEM")}
        ${cpuNode(200, 148, 104, 60, "REG", "REG FILE", true)}
        ${cpuNode(340, 57, 78, 48, "ALU", "ARITH LOGIC")}
        ${cpuNode(340, 155, 68, 38, "CTRL", "CONTROL")}
        ${cpuNode(418, 206, 80, 48, "DMEM", "DATA MEM")}
        ${cpuNode(285, 270, 86, 46, "WB", "WRITE BACK")}
        <circle class="cpu-pulse" cx="340" cy="178" r="3"></circle>
      </svg>
      <div class="cpu-label"><strong>MIPS</strong>SINGLE CYCLE / R-I-J</div>
    </div>`;

  const projectArt = {
    ticket: ticketArt,
    lifeverse: lifeArt,
    vision: visionArt,
    mips: mipsArt,
  };

  const projects = [
    {
      id: "ticket",
      index: "01",
      title: "仿淘票票电影票务系统",
      subtitle: "Movie Ticketing Platform · 全栈 / 微信小程序",
      year: "2026",
      summary:
        "仿淘票票的在线选座购票系统。后端采用 Spring Boot 4 + MyBatis + MySQL 分层架构，前端为微信小程序，从影院排片、选座到订单落库跑通完整业务闭环。",
      metrics: [
        { value: "17", label: "张业务数据表" },
        { value: "52", label: "个 REST 接口" },
        { value: "14", label: "个后端控制器" },
        { value: "50", label: "个小程序 / H5 页面" },
      ],
      highlights: [
        "设计 17 张业务数据表，覆盖影院、影厅、影片、场次、座位、订单与用户等核心实体。",
        "基于 MyBatis 完成影片、影院、场次、座位、订单等模块的增删改查。",
        "使用 JWT 实现登录与接口鉴权，搭起 14 个控制器、约 52 个 REST 接口。",
        "打通选座主流程：座位校验 → 锁定 → 订单落库，并完成小程序 18 页、H5 32 页。",
      ],
      stack: ["Java 17", "Spring Boot 4", "MyBatis", "MySQL", "JWT", "微信小程序"],
    },
    {
      id: "lifeverse",
      index: "02",
      title: "宇宙回响馆 LifeVerse",
      subtitle: "AI Life Archive · Web 平台 / AI 集成",
      year: "2026",
      summary:
        "以「记录人生微光」为主题的 Web 平台。用户记录日常「回响」，再由 AI 馆长生成个人画像。前端 Vue 3 + Vite，后端 Spring Boot + MyBatis-Plus，前后端完整联调。",
      metrics: [
        { value: "8", label: "个 Web 页面" },
        { value: "6", label: "个 Pinia Store" },
        { value: "1", label: "条 AI 画像链路" },
        { value: "JWT", label: "登录与接口鉴权" },
      ],
      highlights: [
        "使用 Vue Router 组织 8 个页面，配置登录拦截与路由懒加载。",
        "用 Pinia 管理 6 个 Store，处理跨页面、跨组件的状态共享。",
        "Element Plus 统一界面语言，Axios 拦截器自动携带 JWT。",
        "实现回响增删改查、情绪筛选与照片墙；接入兼容 OpenAI 协议的大模型 API，生成 AI 画像并落库。",
      ],
      stack: ["Vue 3", "Vite", "Vue Router", "Pinia", "Element Plus", "Axios", "Spring Boot", "MyBatis-Plus"],
    },
    {
      id: "vision",
      index: "03",
      title: "智能视觉处理软件",
      subtitle: "Intelligent Vision Lab · 桌面应用 / 图像算法",
      year: "2026",
      summary:
        "基于 Qt 6 / C++ 的跨平台图像处理软件，涵盖基础处理、AI 智能增强、计算机视觉与大模型接入。核心算法不依赖现成图像库，由 C++ 逐行实现。",
      metrics: [
        { value: "30+", label: "种手写图像算法" },
        { value: "10–30×", label: "指针优化提速" },
        { value: "15+", label: "项完整功能" },
        { value: "Qt 6", label: "跨平台桌面框架" },
      ],
      highlights: [
        "纯 C++ 手写实现 30+ 种算法，包括 CLAHE、USM、双边滤波、Lanczos 超分等。",
        "用 QtConcurrent 实现异步多线程处理，解决大图计算时的 UI 卡死问题。",
        "通过 scanLine 指针直访优化，将关键处理性能提升 10–30 倍。",
        "集成硅基流动 API 实现大模型视觉分析；支持实时人脸 / 手势识别与 AR 画笔。",
      ],
      stack: ["C++", "Qt 6", "QtConcurrent", "Image Processing", "Computer Vision", "SiliconFlow API"],
    },
    {
      id: "mips",
      index: "04",
      title: "单周期 MIPS CPU",
      subtitle: "Single-cycle Processor · 硬件 / 数字逻辑",
      year: "2026",
      summary:
        "在 Vivado 中用 Verilog HDL 从基础门级模块开始，逐级搭建单周期 MIPS CPU，覆盖组合逻辑、时序逻辑到指令执行全流程。",
      metrics: [
        { value: "1", label: "单周期数据通路" },
        { value: "32-bit", label: "ALU 与数据宽度" },
        { value: "R/I/J", label: "覆盖三类指令" },
        { value: "8", label: "全加器输入组合" },
      ],
      highlights: [
        "从 1 位全加器、32 位加法器、MUL、ALU，到寄存器堆与取指单元，逐级搭建完整数据通路。",
        "扩展 MIPS R / R-I / R-I-J 型指令，覆盖立即数扩展、跳转、访存与写回。",
        "为每个模块编写 testbench，用穷举输入和仿真波形验证功能。",
        "跑通从组合逻辑到时序执行的完整闭环，例如全加器 8 种输入组合、R 型指令时序。",
      ],
      stack: ["Verilog HDL", "Vivado", "MIPS", "Testbench", "Waveform", "Digital Logic"],
    },
  ];

  /* ------------------------------------------------------------------------
     Project hover preview
     ------------------------------------------------------------------------ */

  const preview = $("#projectPreview");
  const previewArt = $("#previewArt");
  const previewIndex = $("#previewIndex");
  const previewName = $("#previewName");
  const projectRows = $$(".project-row");
  const canPreview = window.matchMedia("(pointer: fine) and (min-width: 981px)").matches;

  if (canPreview && preview && previewArt && !reducedMotion) {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let previewVisible = false;
    let previewFrame = null;

    const renderPreviewPosition = () => {
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;
      preview.style.left = `${currentX}px`;
      preview.style.top = `${currentY}px`;
      previewFrame = previewVisible ? requestAnimationFrame(renderPreviewPosition) : null;
    };

    const showPreview = (row, event) => {
      const project = projects.find((item) => item.id === row.dataset.project);
      if (!project) return;

      previewArt.innerHTML = projectArt[project.id]();
      if (previewIndex) previewIndex.textContent = project.index;
      if (previewName) previewName.textContent = project.title;

      targetX = clamp(event.clientX + 48, 190, window.innerWidth - 190);
      targetY = clamp(event.clientY, 180, window.innerHeight - 190);
      currentX = targetX;
      currentY = targetY;
      preview.style.left = `${currentX}px`;
      preview.style.top = `${currentY}px`;

      previewVisible = true;
      preview.classList.add("is-visible");

      if (previewFrame === null) previewFrame = requestAnimationFrame(renderPreviewPosition);
    };

    const movePreview = (event) => {
      if (!previewVisible) return;
      targetX = clamp(event.clientX + 48, 190, window.innerWidth - 190);
      targetY = clamp(event.clientY, 180, window.innerHeight - 190);
    };

    const hidePreview = () => {
      previewVisible = false;
      preview.classList.remove("is-visible");
      if (previewFrame !== null) {
        cancelAnimationFrame(previewFrame);
        previewFrame = null;
      }
    };

    projectRows.forEach((row) => {
      row.addEventListener("pointerenter", (event) => showPreview(row, event));
      row.addEventListener("pointermove", movePreview);
      row.addEventListener("pointerleave", hidePreview);
      row.addEventListener("focus", () => {
        preview.style.left = "50%";
        preview.style.top = "50%";
      });
    });

    window.addEventListener("scroll", hidePreview, { passive: true });
  }

  /* ------------------------------------------------------------------------
     Project dialog
     ------------------------------------------------------------------------ */

  const dialog = $("#projectDialog");
  const dialogShell = $(".dialog-shell");
  const dialogContent = $(".dialog-content");
  const dialogClose = $("#dialogClose");
  const dialogVisual = $("#dialogVisual");
  const dialogIndex = $("#dialogIndex");
  const dialogYear = $("#dialogYear");
  const dialogTitle = $("#dialogTitle");
  const dialogSubtitle = $("#dialogSubtitle");
  const dialogSummary = $("#dialogSummary");
  const dialogMetrics = $("#dialogMetrics");
  const dialogHighlights = $("#dialogHighlights");
  const dialogStack = $("#dialogStack");
  const dialogPrev = $("#dialogPrev");
  const dialogNext = $("#dialogNext");
  const prevProject = $("#prevProject");
  const nextProject = $("#nextProject");

  let activeProjectIndex = 0;

  const fillDialog = (index) => {
    const project = projects[index];
    if (!project) return;

    activeProjectIndex = index;
    if (dialogIndex) dialogIndex.textContent = `PROJECT / ${project.index}`;
    if (dialogYear) dialogYear.textContent = project.year;
    if (dialogTitle) dialogTitle.textContent = project.title;
    if (dialogSubtitle) dialogSubtitle.textContent = project.subtitle;
    if (dialogSummary) dialogSummary.textContent = project.summary;
    if (dialogVisual) dialogVisual.innerHTML = projectArt[project.id]();

    if (dialogMetrics) {
      dialogMetrics.innerHTML = project.metrics
        .map(
          (metric) =>
            `<div class="dialog-metric"><strong>${metric.value}</strong><span>${metric.label}</span></div>`
        )
        .join("");
    }

    if (dialogHighlights) {
      dialogHighlights.innerHTML = project.highlights
        .map((highlight, highlightIndex) => {
          return `<li><span>${String(highlightIndex + 1).padStart(2, "0")}</span><p>${highlight}</p></li>`;
        })
        .join("");
    }

    if (dialogStack) {
      dialogStack.innerHTML = project.stack.map((item) => `<span>${item}</span>`).join("");
    }

    const previous = projects[(index - 1 + projects.length) % projects.length];
    const next = projects[(index + 1) % projects.length];

    if (prevProject) prevProject.textContent = previous.title;
    if (nextProject) nextProject.textContent = next.title;

    if (dialogShell) dialogShell.scrollTop = 0;
    if (dialogContent) dialogContent.scrollTop = 0;
  };

  const openProject = (index) => {
    if (!dialog) return;
    preview?.classList.remove("is-visible");
    fillDialog(index);
    if (!dialog.open) dialog.showModal();
    document.body.classList.add("modal-open");
    window.setTimeout(() => dialogClose?.focus({ preventScroll: true }), 40);
  };

  const closeProject = () => {
    if (!dialog?.open) return;
    dialog.close();
  };

  projectRows.forEach((row) => {
    row.addEventListener("click", () => {
      const index = projects.findIndex((item) => item.id === row.dataset.project);
      if (index >= 0) openProject(index);
    });
  });

  dialogClose?.addEventListener("click", closeProject);
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) closeProject();
  });
  dialog?.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    if (!menuOverlay?.classList.contains("is-open")) {
      document.body.classList.remove("menu-open");
    }
  });

  dialogPrev?.addEventListener("click", () => {
    fillDialog((activeProjectIndex - 1 + projects.length) % projects.length);
  });

  dialogNext?.addEventListener("click", () => {
    fillDialog((activeProjectIndex + 1) % projects.length);
  });

  dialog?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      fillDialog((activeProjectIndex - 1 + projects.length) % projects.length);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      fillDialog((activeProjectIndex + 1) % projects.length);
    }
  });

  /* ------------------------------------------------------------------------
     Copy email, clock and small utilities
     ------------------------------------------------------------------------ */

  const copyEmailButton = $("#copyEmail");
  const toast = $("#toast");
  const email = "3103316705@qq.com";
  let toastTimer = null;

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
  };

  const selectEmail = () => {
    const target = $(".mail-link span");
    if (!target) return false;
    const range = document.createRange();
    range.selectNodeContents(target);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  };

  const copyText = async (text) => {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-9999px";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, field.value.length);
    const copied = document.execCommand("copy");
    field.remove();
    return copied;
  };

  copyEmailButton?.addEventListener("click", async () => {
    const label = copyEmailButton.querySelector("span");
    const originalLabel = label?.textContent || "复制邮箱";

    try {
      const copied = await copyText(email);
      if (!copied) throw new Error("copy failed");
      if (label) label.textContent = "已复制 ✓";
      showToast("邮箱已复制，期待你的来信");
      window.setTimeout(() => {
        if (label) label.textContent = originalLabel;
      }, 2200);
    } catch {
      selectEmail();
      showToast("邮箱已选中，按 Ctrl + C 复制");
    }
  });

  const localTime = $("#localTime");
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  const renderClock = () => {
    if (!localTime) return;
    const formatter = new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    localTime.textContent = formatter.format(new Date());
  };

  renderClock();
  window.setInterval(renderClock, 1000);
})();

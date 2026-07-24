// ===== Year =====
document.getElementById('year').textContent = new Date().getFullYear();

const reduceMotionEarly = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== Scroll progress bar =====
const progressBar = document.getElementById('progressBar');
function updateProgress() {
  const h = document.documentElement;
  const scrolled = h.scrollTop;
  const max = h.scrollHeight - h.clientHeight;
  progressBar.style.width = (max > 0 ? (scrolled / max) * 100 : 0) + '%';
}
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

// ===== Cursor glow (desktop only) =====
const cursorGlow = document.getElementById('cursorGlow');
if (window.matchMedia('(pointer: fine)').matches && !reduceMotionEarly) {
  window.addEventListener('pointermove', (e) => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
    cursorGlow.classList.add('active');
  });
  window.addEventListener('pointerleave', () => cursorGlow.classList.remove('active'));
}

// ===== Hero network graph (signature visual) =====
// Nodes drift slowly and link with faint gold lines when close — a living
// visualisation of "network" building, with occasional pulse nodes and
// gentle cursor interaction.
(function initNetworkGraph() {
  const canvas = document.getElementById('networkCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hero = canvas.closest('.hero');
  let width, height, dpr;
  let nodes = [];
  let mouse = { x: null, y: null, active: false };
  let rafId = null;

  const PALETTE = [
    'rgba(232,201,127,OPA)',  // gold-light
    'rgba(201,151,78,OPA)',   // gold
    'rgba(231,169,174,OPA)',  // rose
    'rgba(166,75,103,OPA)'    // wine-light
  ];

  function colorWith(base, opa) { return base.replace('OPA', opa.toFixed(3)); }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeNodes() {
    const count = width < 640 ? 22 : width < 1100 ? 34 : 46;
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: 1.2 + Math.random() * 1.8,
      colorBase: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.006 + Math.random() * 0.01,
      isHub: Math.random() < 0.12
    }));
  }

  const LINK_DIST = width => (width < 640 ? 110 : 150);

  function step(t) {
    ctx.clearRect(0, 0, width, height);
    const linkDist = LINK_DIST(width);

    // update + draw links
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      // gentle cursor repulsion for a living, responsive feel
      if (mouse.active) {
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0.01) {
          const force = (120 - dist) / 120 * 0.35;
          n.vx += (dx / dist) * force * 0.02;
          n.vy += (dy / dist) * force * 0.02;
        }
      }

      // soft bounds
      if (n.x < -20) n.x = width + 20; else if (n.x > width + 20) n.x = -20;
      if (n.y < -20) n.y = height + 20; else if (n.y > height + 20) n.y = -20;

      // velocity damping so it never speeds away
      n.vx *= 0.995; n.vy *= 0.995;

      for (let j = i + 1; j < nodes.length; j++) {
        const o = nodes[j];
        const dx = n.x - o.x, dy = n.y - o.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < linkDist) {
          const opa = (1 - dist / linkDist) * 0.22;
          ctx.strokeStyle = colorWith('rgba(232,201,127,OPA)', opa);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(o.x, o.y);
          ctx.stroke();
        }
      }
    }

    // draw nodes (after links so they sit on top)
    for (const n of nodes) {
      const pulse = 0.55 + 0.45 * Math.sin(t * n.pulseSpeed + n.pulsePhase);
      const radius = n.isHub ? n.r * 2.1 : n.r;
      const opacity = n.isHub ? 0.55 + 0.35 * pulse : 0.35 + 0.3 * pulse;

      if (n.isHub) {
        const glowR = radius * 4;
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
        grad.addColorStop(0, colorWith(n.colorBase, opacity * 0.35));
        grad.addColorStop(1, colorWith(n.colorBase, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = colorWith(n.colorBase, opacity);
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    rafId = requestAnimationFrame(step);
  }

  resize();
  makeNodes();

  if (reduceMotionEarly) {
    // draw a single static frame, no motion, no listeners
    step(0);
    cancelAnimationFrame(rafId);
    return;
  }

  rafId = requestAnimationFrame(step);

  window.addEventListener('resize', () => {
    resize();
    makeNodes();
  });

  if (window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });
    hero.addEventListener('pointerleave', () => { mouse.active = false; });
  }
})();

// ===== Magnetic buttons =====
if (window.matchMedia('(pointer: fine)').matches && !reduceMotionEarly) {
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}

// ===== Tilt cards =====
if (window.matchMedia('(pointer: fine)').matches && !reduceMotionEarly) {
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const ry = (px - 0.5) * 10;
      const rx = (0.5 - py) * 10;
      card.style.setProperty('--rx', rx + 'deg');
      card.style.setProperty('--ry', ry + 'deg');
      card.style.setProperty('--ty', '-4px');
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--ty', '0px');
    });
  });
}

// ===== FAQ accordion =====
document.querySelectorAll('.acc-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('.acc-item');
    const panel = item.querySelector('.acc-panel');
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('.acc-item.open').forEach(other => {
      if (other !== item) {
        other.classList.remove('open');
        other.querySelector('.acc-panel').style.maxHeight = null;
      }
    });

    if (isOpen) {
      item.classList.remove('open');
      panel.style.maxHeight = null;
    } else {
      item.classList.add('open');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  });
});

// ===== Timeline fill animation on scroll =====
const timelineLine = document.querySelector('.timeline-line');
if (timelineLine) {
  const tlObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        timelineLine.classList.add('filled');
        tlObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  tlObserver.observe(timelineLine);
}

// ===== Nav scroll state =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ===== Mobile nav toggle =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const navScrim = document.getElementById('navScrim');

function closeMobileNav() {
  navLinks.classList.remove('open');
  navToggle.classList.remove('open');
  navToggle.setAttribute('aria-expanded', false);
  navScrim.classList.remove('visible');
  document.body.style.overflow = '';
}

navToggle.addEventListener('click', () => {
  const opening = !navLinks.classList.contains('open');
  navLinks.classList.toggle('open', opening);
  navToggle.classList.toggle('open', opening);
  navToggle.setAttribute('aria-expanded', opening);
  navScrim.classList.toggle('visible', opening);
  document.body.style.overflow = opening ? 'hidden' : '';
});
navScrim.addEventListener('click', closeMobileNav);
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileNav));

// ===== Active-section tracking + sliding nav indicator =====
const navDataLinks = Array.from(document.querySelectorAll('.nav-links a[data-nav]'));
const navIndicator = document.getElementById('navIndicator');
const navLinksWrap = document.querySelector('.nav-links-wrap');
let activeLink = null;

function moveIndicatorTo(link) {
  if (!link || window.innerWidth <= 720) return;
  const wrapRect = navLinksWrap.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  navIndicator.style.width = linkRect.width + 16 + 'px';
  navIndicator.style.transform = `translateX(${linkRect.left - wrapRect.left - 8}px)`;
  navIndicator.classList.add('visible');
}

navDataLinks.forEach(link => {
  link.addEventListener('mouseenter', () => moveIndicatorTo(link));
});
navLinksWrap?.addEventListener('mouseleave', () => moveIndicatorTo(activeLink));

const navSectionMap = navDataLinks.map(link => ({
  link,
  section: document.querySelector(link.getAttribute('href'))
})).filter(x => x.section);

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const match = navSectionMap.find(x => x.section === entry.target);
      if (match) {
        navDataLinks.forEach(l => l.classList.remove('active'));
        match.link.classList.add('active');
        activeLink = match.link;
        moveIndicatorTo(activeLink);
      }
    }
  });
}, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

navSectionMap.forEach(x => sectionObserver.observe(x.section));
window.addEventListener('resize', () => moveIndicatorTo(activeLink));

// ===== Scroll reveal =====
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealEls = document.querySelectorAll('.reveal');

if (reduceMotion) {
  revealEls.forEach(el => el.classList.add('in'));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('in'), i * 60 % 240);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));
}

// ===== Count-up numbers =====
function animateCount(el) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const isDecimal = target % 1 !== 0;
  const duration = 1600;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = target * eased;
    el.textContent = (isDecimal ? current.toFixed(1) : Math.round(current)) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const countEls = document.querySelectorAll('.stat-num, .impact-num');
if (reduceMotion) {
  countEls.forEach(el => {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    el.textContent = target + suffix;
  });
} else {
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  countEls.forEach(el => countObserver.observe(el));
}
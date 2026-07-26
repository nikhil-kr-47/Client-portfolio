/* ==========================================================================
   KLAUDIA KOWALCZYK — PORTFOLIO
   Vanilla JS + GSAP/ScrollTrigger (cdnjs) + VanillaTilt.js (cdnjs) +
   canvas-confetti (cdnjs). Every library-dependent block checks for the
   library's presence first, so a blocked CDN degrades gracefully instead
   of breaking the page — elements that lose their "reveal" class simply
   render in their natural, fully-visible state with no animation.
   ========================================================================== */

   document.getElementById('year').textContent = new Date().getFullYear();

   const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   const isFinePointer = window.matchMedia('(pointer: fine)').matches;
   const hasGSAP = typeof window.gsap !== 'undefined';
   const hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
   if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);
   
   /* ============================================================
      SCROLL PROGRESS BAR
      ============================================================ */
   const progressBar = document.getElementById('progressBar');
   function updateProgress() {
     const h = document.documentElement;
     const max = h.scrollHeight - h.clientHeight;
     progressBar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
   }
   window.addEventListener('scroll', updateProgress, { passive: true });
   updateProgress();
   
   /* ============================================================
      CURSOR GLOW — smooth trailing lag via GSAP when available
      ============================================================ */
   const cursorGlow = document.getElementById('cursorGlow');
   if (isFinePointer && !reduceMotion) {
     if (hasGSAP) {
       const glowX = gsap.quickTo(cursorGlow, 'left', { duration: 0.5, ease: 'power3' });
       const glowY = gsap.quickTo(cursorGlow, 'top', { duration: 0.5, ease: 'power3' });
       window.addEventListener('pointermove', (e) => {
         glowX(e.clientX); glowY(e.clientY);
         cursorGlow.classList.add('active');
       });
     } else {
       window.addEventListener('pointermove', (e) => {
         cursorGlow.style.left = e.clientX + 'px';
         cursorGlow.style.top = e.clientY + 'px';
         cursorGlow.classList.add('active');
       });
     }
     window.addEventListener('pointerleave', () => cursorGlow.classList.remove('active'));
   }
   
   /* ============================================================
      SCROLL CUE — hero bottom indicator, fades on first scroll
      ============================================================ */
   const scrollCue = document.getElementById('scrollCue');
   if (scrollCue) {
     window.addEventListener('scroll', () => {
       scrollCue.style.opacity = window.scrollY > 80 ? '0' : '1';
     }, { passive: true });
   }
   
   /* ============================================================
      HERO NETWORK GRAPH — signature visual (obsidian/gold/emerald/bronze)
      Nodes drift and link with faint gold lines when close; hub nodes
      pulse with a soft glow; gentle cursor attraction for a living feel.
      ============================================================ */
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
       'rgba(232,202,146,OPA)', // gold-light
       'rgba(201,161,90,OPA)',  // gold
       'rgba(95,169,138,OPA)',  // emerald-light
       'rgba(176,128,82,OPA)'   // bronze
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
       const count = width < 640 ? 26 : width < 1100 ? 42 : 58;
       nodes = Array.from({ length: count }, () => ({
         x: Math.random() * width,
         y: Math.random() * height,
         vx: (Math.random() - 0.5) * 0.2,
         vy: (Math.random() - 0.5) * 0.2,
         r: 1.2 + Math.random() * 1.9,
         colorBase: PALETTE[Math.floor(Math.random() * PALETTE.length)],
         pulsePhase: Math.random() * Math.PI * 2,
         pulseSpeed: 0.006 + Math.random() * 0.012,
         isHub: Math.random() < 0.14
       }));
     }
   
     const LINK_DIST = w => (w < 640 ? 115 : 155);
   
     function step(t) {
       ctx.clearRect(0, 0, width, height);
       const linkDist = LINK_DIST(width);
   
       for (let i = 0; i < nodes.length; i++) {
         const n = nodes[i];
         n.x += n.vx;
         n.y += n.vy;
   
         if (mouse.active) {
           const dx = n.x - mouse.x, dy = n.y - mouse.y;
           const dist = Math.sqrt(dx * dx + dy * dy);
           if (dist < 130 && dist > 0.01) {
             const force = (130 - dist) / 130 * 0.4;
             n.vx += (dx / dist) * force * 0.022;
             n.vy += (dy / dist) * force * 0.022;
           }
         }
   
         if (n.x < -20) n.x = width + 20; else if (n.x > width + 20) n.x = -20;
         if (n.y < -20) n.y = height + 20; else if (n.y > height + 20) n.y = -20;
         n.vx *= 0.995; n.vy *= 0.995;
   
         for (let j = i + 1; j < nodes.length; j++) {
           const o = nodes[j];
           const dx = n.x - o.x, dy = n.y - o.y;
           const dist = Math.sqrt(dx * dx + dy * dy);
           if (dist < linkDist) {
             const opa = (1 - dist / linkDist) * 0.24;
             ctx.strokeStyle = colorWith('rgba(232,202,146,OPA)', opa);
             ctx.lineWidth = 1;
             ctx.beginPath();
             ctx.moveTo(n.x, n.y);
             ctx.lineTo(o.x, o.y);
             ctx.stroke();
           }
         }
       }
   
       for (const n of nodes) {
         const pulse = 0.55 + 0.45 * Math.sin(t * n.pulseSpeed + n.pulsePhase);
         const radius = n.isHub ? n.r * 2.3 : n.r;
         const opacity = n.isHub ? 0.6 + 0.35 * pulse : 0.35 + 0.3 * pulse;
   
         if (n.isHub) {
           const glowR = radius * 4.5;
           const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
           grad.addColorStop(0, colorWith(n.colorBase, opacity * 0.4));
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
   
     if (reduceMotion) {
       step(0);
       cancelAnimationFrame(rafId);
       return;
     }
   
     rafId = requestAnimationFrame(step);
     window.addEventListener('resize', () => { resize(); makeNodes(); });
   
     if (isFinePointer) {
       hero.addEventListener('pointermove', (e) => {
         const rect = hero.getBoundingClientRect();
         mouse.x = e.clientX - rect.left;
         mouse.y = e.clientY - rect.top;
         mouse.active = true;
       });
       hero.addEventListener('pointerleave', () => { mouse.active = false; });
     }
   })();
   
   /* ============================================================
      3D TILT CARDS — VanillaTilt.js, with glare
      ============================================================ */
   if (window.VanillaTilt && isFinePointer && !reduceMotion) {
     VanillaTilt.init(document.querySelectorAll('.tilt'), {
       max: 9,
       speed: 500,
       perspective: 900,
       scale: 1.025,
       glare: true,
       'max-glare': 0.22,
       gyroscope: false
     });
   }
   
   /* ============================================================
      MAGNETIC BUTTONS — GSAP quickTo for spring-like follow
      ============================================================ */
   if (isFinePointer && !reduceMotion) {
     document.querySelectorAll('.magnetic').forEach(btn => {
       if (hasGSAP) {
         const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' });
         const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' });
         btn.addEventListener('mousemove', (e) => {
           const rect = btn.getBoundingClientRect();
           xTo((e.clientX - rect.left - rect.width / 2) * 0.3);
           yTo((e.clientY - rect.top - rect.height / 2) * 0.4);
         });
         btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
       } else {
         btn.addEventListener('mousemove', (e) => {
           const rect = btn.getBoundingClientRect();
           const x = e.clientX - rect.left - rect.width / 2;
           const y = e.clientY - rect.top - rect.height / 2;
           btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
         });
         btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
       }
     });
   }
   
   /* ============================================================
      FAQ ACCORDION
      ============================================================ */
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
   
   /* ============================================================
      TIMELINE FILL ANIMATION ON SCROLL
      ============================================================ */
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
   
   /* ============================================================
      NAV SCROLL STATE
      ============================================================ */
   const nav = document.getElementById('nav');
   window.addEventListener('scroll', () => {
     nav.classList.toggle('scrolled', window.scrollY > 40);
   }, { passive: true });
   
   /* ============================================================
      MOBILE NAV TOGGLE
      ============================================================ */
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
   
   /* ============================================================
      ACTIVE-SECTION TRACKING + SLIDING NAV INDICATOR
      ============================================================ */
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
   
   /* ============================================================
      BASE SCROLL REVEAL (fade-up) — still governs any element that
      kept its "reveal" class: section intros, copy blocks, wrappers.
      ============================================================ */
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
   
   /* ============================================================
      COUNT-UP NUMBERS
      ============================================================ */
   function animateCount(el) {
     const target = parseFloat(el.dataset.target);
     const suffix = el.dataset.suffix || '';
     const isDecimal = target % 1 !== 0;
     const duration = 1600;
     const start = performance.now();
   
     function tick(now) {
       const progress = Math.min((now - start) / duration, 1);
       const eased = 1 - Math.pow(1 - progress, 3);
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
   
   /* ============================================================
      TEXT SPLITTING — hand-rolled (no external dependency), used
      for GSAP letter/word cascade reveals below.
      ============================================================ */
   function splitChars(el) {
     const text = el.textContent;
     el.textContent = '';
     el.setAttribute('aria-label', text);
     const frag = document.createDocumentFragment();
     [...text].forEach(ch => {
       const span = document.createElement('span');
       span.className = 'char';
       span.textContent = ch === ' ' ? '\u00A0' : ch;
       span.setAttribute('aria-hidden', 'true');
       frag.appendChild(span);
     });
     el.appendChild(frag);
     return Array.from(el.querySelectorAll('.char'));
   }
   
   function splitWords(el) {
     const text = el.textContent;
     el.textContent = '';
     el.setAttribute('aria-label', text);
     const words = text.split(' ');
     words.forEach((word, i) => {
       const span = document.createElement('span');
       span.className = 'word';
       span.textContent = word;
       span.setAttribute('aria-hidden', 'true');
       el.appendChild(span);
       if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
     });
     return Array.from(el.querySelectorAll('.word'));
   }
   
   /* ============================================================
      HERO ENTRANCE — cinematic sequenced timeline
      ============================================================ */
   if (hasGSAP && !reduceMotion) {
     const line1 = document.querySelector('.hero-name .line1');
     const chars = line1 ? splitChars(line1) : [];
   
     const heroTl = gsap.timeline({ delay: 0.5 });
     heroTl
       .from('.eyebrow', { opacity: 0, y: -14, duration: 0.6, ease: 'power2.out' }, 0)
       .from('.hero-photo-wrap', { opacity: 0, scale: 0.6, rotate: -15, duration: 0.8, ease: 'back.out(1.8)' }, 0.15);
   
     if (chars.length) {
       heroTl.from(chars, {
         opacity: 0, y: 44, rotateX: -70, transformOrigin: '50% 100%', transformPerspective: 400,
         duration: 0.7, ease: 'back.out(1.8)', stagger: 0.032
       }, 0.5);
     }
   
     heroTl
       .from('.hero-name .shimmer', { opacity: 0, y: 30, duration: 0.75, ease: 'power3.out' }, 0.75)
       .from('.hero-role', { opacity: 0, y: 14, duration: 0.55, ease: 'power2.out' }, 1.0)
       .from('.hero-tagline', { opacity: 0, y: 14, duration: 0.55, ease: 'power2.out' }, 1.1)
       .from('.hero-stats .stat', { opacity: 0, y: 20, duration: 0.55, ease: 'back.out(1.7)', stagger: 0.09 }, 1.2)
       .from('.hero-actions .btn', { opacity: 0, y: 14, scale: 0.9, duration: 0.5, ease: 'back.out(1.8)', stagger: 0.09 }, 1.4);
   }
   
   /* ============================================================
      HEADING WORD REVEAL — every h2, scroll-triggered cascade
      (headings containing a <br> are skipped to protect the
      intentional line break — everything else fully supports it)
      ============================================================ */
   if (hasScrollTrigger && !reduceMotion) {
     document.querySelectorAll('h2').forEach(h2 => {
       if (h2.querySelector('br')) return;
       const words = splitWords(h2);
       if (!words.length) return;
       gsap.from(words, {
         opacity: 0,
         y: 26,
         rotateZ: () => gsap.utils.random(-4, 4),
         duration: 0.7,
         ease: 'power3.out',
         stagger: 0.045,
         scrollTrigger: { trigger: h2, start: 'top 88%', toggleActions: 'play none none none' }
       });
     });
   }
   
   /* ============================================================
      GRID / CARD STAGGER ENTRANCES — gallery, values, impact,
      testimonials, timeline steps. Each grid gets its own entrance
      character so the page doesn't feel like one repeated fade.
      ============================================================ */
   if (hasScrollTrigger && !reduceMotion) {
     const gridConfigs = [
       { sel: '.gallery-grid', items: '.g-item',
         anim: { opacity: 0, scale: 0.82, rotateZ: -3, y: 40 } },
       { sel: '.values-grid', items: '.value-card',
         anim: { opacity: 0, y: 50, rotateX: -25, transformOrigin: '50% 0%', transformPerspective: 800 } },
       { sel: '.impact-grid', items: '.impact-card',
         anim: { opacity: 0, y: 36, scale: 0.85 } },
       { sel: '.testi-grid', items: '.testi-card',
         anim: { opacity: 0, y: 50, rotateZ: () => gsap.utils.random(-4, 4) } },
       { sel: '.timeline', items: '.tl-step',
         anim: { opacity: 0, x: i => (i % 2 === 0 ? -40 : 40), y: 20 } }
     ];
   
     gridConfigs.forEach(cfg => {
       const container = document.querySelector(cfg.sel);
       if (!container) return;
       const items = container.querySelectorAll(cfg.items);
       if (!items.length) return;
       gsap.from(items, {
         ...cfg.anim,
         duration: 0.75,
         ease: 'back.out(1.5)',
         stagger: 0.12,
         scrollTrigger: { trigger: container, start: 'top 85%', toggleActions: 'play none none none' }
       });
     });
   
     const programBorder = document.querySelector('.program-border');
     if (programBorder) {
       gsap.from(programBorder, {
         opacity: 0, y: 60, scale: 0.9,
         duration: 0.9, ease: 'back.out(1.4)',
         scrollTrigger: { trigger: programBorder, start: 'top 85%', toggleActions: 'play none none none' }
       });
     }
   }
   
   /* ============================================================
      CONFETTI BURST — Apply Now / Send Inquiry
      ============================================================ */
   if (window.confetti && !reduceMotion) {
     const fireConfetti = (originEl) => {
       const rect = originEl.getBoundingClientRect();
       confetti({
         particleCount: 90,
         spread: 70,
         startVelocity: 32,
         origin: {
           x: (rect.left + rect.width / 2) / window.innerWidth,
           y: (rect.top + rect.height / 2) / window.innerHeight
         },
         colors: ['#C9A15A', '#E8CA92', '#5FA98A', '#B08052']
       });
     };
     document.querySelectorAll('.program-btn, .contact-form button[type="submit"]').forEach(btn => {
       btn.addEventListener('click', () => fireConfetti(btn));
     });
   }
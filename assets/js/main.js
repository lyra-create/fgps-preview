/* ============================================
   FGPS — Premium Rebuild
   GSAP + ScrollTrigger Animations
   Compass Node Scroll Experience v2
   ============================================ */

(function () {
  'use strict';

  var hasGSAP = typeof gsap !== 'undefined';
  var hasScrollTrigger = typeof ScrollTrigger !== 'undefined';
  var prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var cleanupTasks = [];
  var isMobile = window.innerWidth <= 768;

  if (hasGSAP && hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  function addCleanup(fn) {
    cleanupTasks.push(fn);
  }

  function cleanupAnimations() {
    cleanupTasks.forEach(function (fn) {
      try { fn(); } catch (_) {}
    });

    if (hasScrollTrigger) {
      ScrollTrigger.getAll().forEach(function (trigger) {
        trigger.kill();
      });
    }
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function setVisible(el) {
    if (!el) return;
    el.style.opacity = '1';
    el.style.transform = 'none';
  }

  /* ─── Navigation ─────────────────────────────── */
  function initNav() {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;

    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');

    if (toggle && links) {
      var onToggle = function () {
        links.classList.toggle('open');
        toggle.classList.toggle('open');
        document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
      };

      toggle.addEventListener('click', onToggle);
      addCleanup(function () {
        toggle.removeEventListener('click', onToggle);
      });

      links.querySelectorAll('a').forEach(function (a) {
        var onClick = function () {
          links.classList.remove('open');
          toggle.classList.remove('open');
          document.body.style.overflow = '';
        };
        a.addEventListener('click', onClick);
        addCleanup(function () {
          a.removeEventListener('click', onClick);
        });
      });
    }

    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navbar.querySelectorAll('.nav-links a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href && href.split('#')[0] === currentPage) {
        a.classList.add('active');
      }
    });

    if (hasScrollTrigger && !prefersReducedMotion) {
      var navTrigger = ScrollTrigger.create({
        start: 44,
        end: 99999,
        toggleClass: { targets: navbar, className: 'scrolled' }
      });
      addCleanup(function () {
        navTrigger.kill();
      });
    } else {
      var onScroll = function () {
        if (window.scrollY > 40) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      addCleanup(function () {
        window.removeEventListener('scroll', onScroll);
      });
    }
  }

  /* ─── Hero Page Load Animation ─────────────────── */
  function initPageLoad() {
    if (!hasGSAP || prefersReducedMotion) return;

    var badge = document.querySelector('.hero-badge');
    var headline = document.querySelector('h1.hero-headline');
    var subtext = document.querySelector('.hero-sub');
    var actions = document.querySelector('.hero-actions');
    var stats = document.querySelector('.hero-stats');

    if (badge || headline) {
      var tl = gsap.timeline({ delay: 0.1, defaults: { ease: 'power2.out' } });

      if (badge) tl.from(badge, { opacity: 0, y: 22, duration: 0.6 });
      if (headline) tl.from(headline, { opacity: 0, y: 30, duration: 0.75 }, '-=0.34');
      if (subtext) tl.from(subtext, { opacity: 0, y: 24, duration: 0.62 }, '-=0.42');
      if (actions) tl.from(actions, { opacity: 0, y: 18, duration: 0.54 }, '-=0.35');
      if (stats) tl.from(stats, { opacity: 0, y: 18, duration: 0.54 }, '-=0.3');
    }

    var pageHero = document.querySelector('.page-hero, .about-hero, .claim-hero');
    if (pageHero && !badge) {
      var children = pageHero.querySelectorAll('.section-label, h1, p, .btn');
      gsap.from(children, {
        opacity: 0,
        y: 24,
        stagger: 0.12,
        duration: 0.68,
        ease: 'power2.out',
        delay: 0.14
      });
    }
  }

  /* ─── Hero Parallax ─────────────────────────────── */
  function initHeroParallax() {
    if (!hasGSAP || prefersReducedMotion) return;

    var heroBgImg = document.querySelector('.hero-bg img');
    if (!heroBgImg) return;

    gsap.to(heroBgImg, {
      scale: 1.08,
      duration: 10,
      ease: 'none',
      delay: 0.2
    });

    if (!hasScrollTrigger) return;

    gsap.to(heroBgImg, {
      y: '20%',
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }

  /* ─── Stat Counters ─────────────────────────────── */
  function initCounters() {
    var statNums = document.querySelectorAll('.stat-number[data-target]');
    if (!statNums.length) return;

    statNums.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-target') || '0');
      var suffix = el.getAttribute('data-suffix') || '';
      var isFloat = el.getAttribute('data-float') === 'true';

      if (prefersReducedMotion || !hasGSAP || !hasScrollTrigger) {
        el.textContent = (isFloat ? target.toFixed(1) : Math.round(target)) + suffix;
        return;
      }

      var counterProxy = { value: 0 };
      var trigger = ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          gsap.to(counterProxy, {
            value: target,
            duration: 1.8,
            ease: 'power2.out',
            onUpdate: function () {
              el.textContent = (isFloat
                ? counterProxy.value.toFixed(1)
                : Math.round(counterProxy.value)) + suffix;
            }
          });
        }
      });

      addCleanup(function () {
        trigger.kill();
      });
    });
  }

  /* ─── Reveal animations (other pages) ───────────── */
  function initReveal() {
    var revealItems = document.querySelectorAll('.reveal');

    if (prefersReducedMotion || !hasGSAP || !hasScrollTrigger) {
      revealItems.forEach(setVisible);
      document.querySelectorAll(
        '.problem-grid > *, .products-grid > *, .why-grid > *, .trust-quote-grid > *, .product-guide-grid > *, .products-list > *, .principles-grid > *, .team-grid > *, .timeline > *'
      ).forEach(setVisible);
      return;
    }

    revealItems.forEach(function (el) {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.72,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        }
      });
    });

    // Problem cards: alternating left/right slide-in
    var problemGrid = document.querySelector('.problem-grid');
    if (problemGrid && problemGrid.children.length) {
      Array.from(problemGrid.children).forEach(function (card, i) {
        var fromX = (i % 2 === 0) ? -60 : 60;
        gsap.from(card, {
          opacity: 0,
          x: fromX,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: problemGrid,
            start: 'top 85%',
            once: true
          },
          delay: i * 0.12
        });
      });
    }

    // Product cards: scale from 0.92 plus fade
    var productsGrid = document.querySelector('.products-grid');
    if (productsGrid && productsGrid.children.length) {
      gsap.from(productsGrid.children, {
        opacity: 0,
        scale: 0.92,
        stagger: 0.1,
        duration: 0.72,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: productsGrid,
          start: 'top 85%',
          once: true
        }
      });
    }

    // Why FGPS cards: stagger with bounce ease
    var whyGrid = document.querySelector('.why-grid');
    if (whyGrid && whyGrid.children.length) {
      gsap.from(whyGrid.children, {
        opacity: 0,
        y: 40,
        stagger: 0.13,
        duration: 0.82,
        ease: 'back.out(1.4)',
        scrollTrigger: {
          trigger: whyGrid,
          start: 'top 85%',
          once: true
        }
      });
    }

    // SeisCloudNAV spotlight
    var spotlightCopy = document.querySelector('.spotlight-copy');
    var spotlightVisual = document.querySelector('.spotlight-visual');
    if (spotlightCopy) {
      gsap.from(spotlightCopy, {
        opacity: 0,
        x: -60,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: spotlightCopy,
          start: 'top 82%',
          once: true
        }
      });
    }
    if (spotlightVisual) {
      gsap.from(spotlightVisual, {
        opacity: 0,
        x: 60,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: spotlightVisual,
          start: 'top 82%',
          once: true
        }
      });
    }

    // Stats: each stat scales up
    var statItems = document.querySelectorAll('.hero-stats .stat');
    if (statItems.length) {
      gsap.from(statItems, {
        opacity: 0,
        scale: 0,
        stagger: 0.1,
        duration: 0.7,
        ease: 'back.out(1.7)',
        delay: 0.6
      });
    }

    // Section headers: clip-path wipe
    document.querySelectorAll('.section-header h2').forEach(function (el) {
      gsap.from(el, {
        clipPath: 'inset(0 100% 0 0)',
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        }
      });
    });

    // Section header labels and paragraphs
    document.querySelectorAll('.section-header .section-label, .section-header p').forEach(function (el) {
      gsap.from(el, {
        opacity: 0,
        y: 18,
        duration: 0.66,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          once: true
        }
      });
    });

    // Trust quote grid
    var trustQuoteGrid = document.querySelector('.trust-quote-grid');
    if (trustQuoteGrid && trustQuoteGrid.children.length) {
      Array.from(trustQuoteGrid.children).forEach(function (child) {
        child.style.opacity = '0';
        child.style.transform = 'translateY(32px)';
      });
      gsap.to(trustQuoteGrid.children, {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.66,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: trustQuoteGrid,
          start: 'top 85%',
          once: true
        }
      });
    }

    // Remaining stagger selectors
    var remainingSelectors = [
      '.product-guide-grid',
      '.products-list',
      '.principles-grid',
      '.team-grid',
      '.timeline'
    ];

    remainingSelectors.forEach(function (selector) {
      var parent = document.querySelector(selector);
      if (!parent || !parent.children.length) return;

      gsap.from(parent.children, {
        opacity: 0,
        y: 32,
        stagger: 0.1,
        duration: 0.66,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: parent,
          start: 'top 85%',
          once: true
        }
      });
    });

    var ctaContent = document.querySelector('.cta-content');
    if (ctaContent) {
      gsap.from(ctaContent.children, {
        opacity: 0,
        y: 24,
        stagger: 0.1,
        duration: 0.66,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ctaContent,
          start: 'top 85%',
          once: true
        }
      });
    }
  }

  /* ============================================
     COMPASS NODE TRAIL — Scroll Animations
     ============================================ */

  function initNodeTrail() {
    var trailSection = document.querySelector('.node-trail');
    if (!trailSection) return;

    var nodes = trailSection.querySelectorAll('.trail-node');
    if (!nodes.length) return;

    // On mobile: simple fade-in, cards already visible via CSS
    if (isMobile) {
      initNodeTrailMobile(nodes);
      return;
    }

    // Desktop: GSAP scroll-driven expand/contract
    if (!hasGSAP || !hasScrollTrigger || prefersReducedMotion) {
      // Fallback: show all cards immediately
      nodes.forEach(function (node) {
        var card = node.querySelector('.node-card');
        if (card) {
          card.style.opacity = '1';
          card.style.transform = 'none';
        }
      });
      return;
    }

    // Draw connecting lines between nodes
    drawTrailConnections(trailSection, nodes);

    // Animate each node card expand/contract on scroll
    nodes.forEach(function (node, i) {
      var card = node.querySelector('.node-card');
      var dot = node.querySelector('.node-dot');
      if (!card) return;

      // Create scroll-driven animation for this node
      // Node enters: card expands. Node exits: card contracts.
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: node,
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: 0.5,
          // NO pin: true
        }
      });

      // Expand: opacity 0 → 1, scale 0.85 → 1
      tl.to(card, {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: 'power2.out'
      }, 0);

      // Glow the dot
      tl.to(dot, {
        boxShadow: '0 0 30px rgba(0, 212, 170, 0.4), inset 0 0 16px rgba(0, 212, 170, 0.1)',
        duration: 0.3
      }, 0);

      // Contract: at end of scroll range, fade card back
      tl.to(card, {
        opacity: 0,
        scale: 0.85,
        duration: 0.4,
        ease: 'power2.in'
      }, 0.6);

      // Reduce dot glow
      tl.to(dot, {
        boxShadow: '0 0 20px rgba(0, 212, 170, 0.15), inset 0 0 12px rgba(0, 212, 170, 0.05)',
        duration: 0.3
      }, 0.7);

      addCleanup(function () {
        if (tl.scrollTrigger) tl.scrollTrigger.kill();
        tl.kill();
      });
    });

    // Mouse parallax on nodes (subtle)
    initNodeParallax(nodes);
  }

  function initNodeTrailMobile(nodes) {
    if (!hasGSAP) return;

    // Simple fade-in on scroll for mobile
    nodes.forEach(function (node) {
      var card = node.querySelector('.node-card');
      if (!card) return;

      // Cards are already visible via CSS on mobile,
      // but add a subtle entrance animation
      if (hasScrollTrigger && !prefersReducedMotion) {
        gsap.from(node, {
          opacity: 0,
          y: 30,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: node,
            start: 'top 90%',
            once: true
          }
        });
      }
    });
  }

  /* ─── Connecting Lines SVG ──────────────────────── */
  function drawTrailConnections(trailSection, nodes) {
    var svg = trailSection.querySelector('.trail-connections');
    if (!svg || nodes.length < 2) return;

    function updateLines() {
      // Clear existing
      svg.innerHTML = '';

      var trailRect = trailSection.getBoundingClientRect();

      for (var i = 0; i < nodes.length - 1; i++) {
        var dotA = nodes[i].querySelector('.node-dot');
        var dotB = nodes[i + 1].querySelector('.node-dot');
        if (!dotA || !dotB) continue;

        var rectA = dotA.getBoundingClientRect();
        var rectB = dotB.getBoundingClientRect();

        var x1 = rectA.left + rectA.width / 2 - trailRect.left;
        var y1 = rectA.top + rectA.height / 2 - trailRect.top;
        var x2 = rectB.left + rectB.width / 2 - trailRect.left;
        var y2 = rectB.top + rectB.height / 2 - trailRect.top;

        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', '#00d4aa');
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-opacity', '0.2');
        line.setAttribute('stroke-dasharray', '6 4');

        // Calculate line length for draw-on animation
        var length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        line.setAttribute('stroke-dasharray', length);
        line.setAttribute('stroke-dashoffset', length);
        line.setAttribute('data-length', length);
        line.setAttribute('data-index', i);

        svg.appendChild(line);
      }

      // Set SVG viewBox to match section size
      svg.setAttribute('viewBox', '0 0 ' + trailSection.offsetWidth + ' ' + trailSection.offsetHeight);
      svg.style.width = trailSection.offsetWidth + 'px';
      svg.style.height = trailSection.offsetHeight + 'px';

      // Animate each line segment with ScrollTrigger (draw-on effect)
      animateConnectionLines(svg, nodes);
    }

    // Initial draw
    updateLines();

    // Redraw on resize
    var resizeTimer;
    var onResize = function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        isMobile = window.innerWidth <= 768;
        if (!isMobile) {
          // Kill old line triggers and redraw
          updateLines();
        }
      }, 250);
    };
    window.addEventListener('resize', onResize);
    addCleanup(function () {
      window.removeEventListener('resize', onResize);
    });
  }

  function animateConnectionLines(svg, nodes) {
    var lines = svg.querySelectorAll('line');

    lines.forEach(function (line) {
      var idx = parseInt(line.getAttribute('data-index'), 10);
      var length = parseFloat(line.getAttribute('data-length'));
      var triggerNode = nodes[idx];

      if (!triggerNode || !hasGSAP || !hasScrollTrigger) {
        line.setAttribute('stroke-dashoffset', '0');
        return;
      }

      // Animate the line drawing from previous node to next
      gsap.to(line, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: triggerNode,
          start: 'top 70%',
          end: 'bottom 50%',
          scrub: 0.5
        }
      });
    });
  }

  /* ─── Mouse Parallax on Nodes ───────────────────── */
  function initNodeParallax(nodes) {
    if (isMobile || prefersReducedMotion) return;

    var onMouseMove = function (e) {
      var centerX = window.innerWidth / 2;
      var centerY = window.innerHeight / 2;
      var moveX = (e.clientX - centerX) / centerX;
      var moveY = (e.clientY - centerY) / centerY;

      nodes.forEach(function (node) {
        var dot = node.querySelector('.node-dot');
        if (!dot) return;
        gsap.to(dot, {
          x: moveX * 6,
          y: moveY * 4,
          duration: 0.8,
          ease: 'power2.out'
        });
      });
    };

    document.addEventListener('mousemove', onMouseMove);
    addCleanup(function () {
      document.removeEventListener('mousemove', onMouseMove);
    });
  }

  /* ─── Reduced Motion Fallback ───────────────────── */
  function initReducedMotionState() {
    if (!prefersReducedMotion) return;

    document.querySelectorAll('.reveal').forEach(setVisible);

    document.querySelectorAll('.stat-number[data-target]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-target') || '0');
      var suffix = el.getAttribute('data-suffix') || '';
      var isFloat = el.getAttribute('data-float') === 'true';
      el.textContent = (isFloat ? target.toFixed(1) : Math.round(target)) + suffix;
    });

    // Force all node cards visible
    document.querySelectorAll('.node-card').forEach(function (card) {
      card.style.opacity = '1';
      card.style.transform = 'none';
    });
  }

  /* ─── Video Autoplay (other pages) ────────────────── */
  function initVideoAutoplay() {
    var video = document.querySelector('.network-bg-video video');
    if (!video) return;
    video.muted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.load();
    video.play().catch(function () {
      setTimeout(function () {
        video.play().catch(function () {
          video.style.display = 'none';
        });
      }, 500);
    });
  }

  /* ─── Safety Net ─────────────────────────────────── */
  function initSafetyNet() {
    setTimeout(function () {
      // Force-show any elements that might be stuck invisible
      document.querySelectorAll(
        '.products-grid > *, .trust-quote-grid > *, .why-grid > *, .product-guide-grid > *, .products-list > *, .principles-grid > *, .team-grid > *'
      ).forEach(function (el) {
        var style = window.getComputedStyle(el);
        if (parseFloat(style.opacity) < 0.1) {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      });

      // Force-show node cards that failed to animate
      document.querySelectorAll('.node-card').forEach(function (card) {
        var style = window.getComputedStyle(card);
        if (parseFloat(style.opacity) < 0.1) {
          card.style.opacity = '1';
          card.style.transform = 'none';
        }
      });
    }, 5000);
  }

  /* ─── Init ───────────────────────────────────────── */
  ready(function () {
    // Mark GSAP as loaded so CSS fallback animations don't fire
    if (hasGSAP) document.documentElement.classList.add('gsap-loaded');

    initReducedMotionState();
    initNav();
    initPageLoad();
    initHeroParallax();
    initCounters();
    initReveal();
    initNodeTrail();
    initVideoAutoplay();
    initSafetyNet();
  });

  window.addEventListener('pagehide', cleanupAnimations, { once: true });
  window.addEventListener('beforeunload', cleanupAnimations, { once: true });
})();

/* ============================================
   FGPS — Premium Rebuild
   GSAP + ScrollTrigger Animations
   ============================================ */

(function () {
  'use strict';

  const hasGSAP = typeof gsap !== 'undefined';
  const hasScrollTrigger = typeof ScrollTrigger !== 'undefined';
  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cleanupTasks = [];

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

  function initNav() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');

    if (toggle && links) {
      const onToggle = function () {
        links.classList.toggle('open');
        toggle.classList.toggle('open');
        document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
      };

      toggle.addEventListener('click', onToggle);
      addCleanup(function () {
        toggle.removeEventListener('click', onToggle);
      });

      links.querySelectorAll('a').forEach(function (a) {
        const onClick = function () {
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

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navbar.querySelectorAll('.nav-links a').forEach(function (a) {
      const href = a.getAttribute('href');
      if (href && href.split('#')[0] === currentPage) {
        a.classList.add('active');
      }
    });

    if (hasScrollTrigger && !prefersReducedMotion) {
      const navTrigger = ScrollTrigger.create({
        start: 44,
        end: 99999,
        toggleClass: { targets: navbar, className: 'scrolled' }
      });
      addCleanup(function () {
        navTrigger.kill();
      });
    } else {
      const onScroll = function () {
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

  function initPageLoad() {
    if (!hasGSAP || prefersReducedMotion) return;

    const badge = document.querySelector('.hero-badge');
    const headline = document.querySelector('h1.hero-headline');
    const subtext = document.querySelector('.hero-sub');
    const actions = document.querySelector('.hero-actions');
    const stats = document.querySelector('.hero-stats');

    if (badge || headline) {
      var heroEls = [badge, headline, subtext, actions, stats].filter(Boolean);
      heroEls.forEach(function (el) { gsap.set(el, { opacity: 0, y: 22 }); });

      const tl = gsap.timeline({ delay: 0.1, defaults: { ease: 'power2.out' } });

      if (badge) tl.to(badge, { opacity: 1, y: 0, duration: 0.6 });
      if (headline) tl.to(headline, { opacity: 1, y: 0, duration: 0.75 }, '-=0.34');
      if (subtext) tl.to(subtext, { opacity: 1, y: 0, duration: 0.62 }, '-=0.42');
      if (actions) tl.to(actions, { opacity: 1, y: 0, duration: 0.54 }, '-=0.35');
      if (stats) tl.to(stats, { opacity: 1, y: 0, duration: 0.54 }, '-=0.3');
    }

    const pageHero = document.querySelector('.page-hero, .about-hero, .claim-hero');
    if (pageHero && !badge) {
      const children = pageHero.querySelectorAll('.section-label, h1, p, .btn');
      gsap.set(children, { opacity: 0, y: 24 });
      gsap.to(children, {
        opacity: 1,
        y: 0,
        stagger: 0.12,
        duration: 0.68,
        ease: 'power2.out',
        delay: 0.14
      });
    }
  }

  function initHeroParallax() {
    if (!hasGSAP || prefersReducedMotion) return;

    const heroBgImg = document.querySelector('.hero-bg img');
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

  function initCounters() {
    const statNums = document.querySelectorAll('.stat-number[data-target]');
    if (!statNums.length) return;

    statNums.forEach(function (el) {
      const target = parseFloat(el.getAttribute('data-target') || '0');
      const suffix = el.getAttribute('data-suffix') || '';
      const isFloat = el.getAttribute('data-float') === 'true';

      if (prefersReducedMotion || !hasGSAP || !hasScrollTrigger) {
        el.textContent = (isFloat ? target.toFixed(1) : Math.round(target)) + suffix;
        return;
      }

      const counterProxy = { value: 0 };
      const trigger = ScrollTrigger.create({
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

  function initReveal() {
    const revealItems = document.querySelectorAll('.reveal');

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
        gsap.set(card, { opacity: 0, x: fromX });
        gsap.to(card, {
          opacity: 1,
          x: 0,
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

    // Product cards: scale from 0.92 plus fade (no rotation)
    var productsGrid = document.querySelector('.products-grid');
    if (productsGrid && productsGrid.children.length) {
      gsap.set(productsGrid.children, { opacity: 0, scale: 0.92 });
      gsap.to(productsGrid.children, {
        opacity: 1,
        scale: 1,
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
      gsap.set(whyGrid.children, { opacity: 0, y: 40 });
      gsap.to(whyGrid.children, {
        opacity: 1,
        y: 0,
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

    // SeisCloudNAV spotlight: text slides from left, image from right
    var spotlightCopy = document.querySelector('.spotlight-copy');
    var spotlightVisual = document.querySelector('.spotlight-visual');
    if (spotlightCopy) {
      gsap.set(spotlightCopy, { opacity: 0, x: -60 });
      gsap.to(spotlightCopy, {
        opacity: 1,
        x: 0,
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
      gsap.set(spotlightVisual, { opacity: 0, x: 60 });
      gsap.to(spotlightVisual, {
        opacity: 1,
        x: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: spotlightVisual,
          start: 'top 82%',
          once: true
        }
      });
    }

    // Stats: each stat scales up from 0 with spring-like bounce
    var statItems = document.querySelectorAll('.hero-stats .stat');
    if (statItems.length) {
      gsap.set(statItems, { opacity: 0, scale: 0 });
      gsap.to(statItems, {
        opacity: 1,
        scale: 1,
        stagger: 0.1,
        duration: 0.7,
        ease: 'back.out(1.7)',
        delay: 0.6
      });
    }

    // Section headers: clip-path wipe from left
    document.querySelectorAll('.section-header h2').forEach(function (el) {
      gsap.set(el, { clipPath: 'inset(0 100% 0 0)', opacity: 0 });
      gsap.to(el, {
        clipPath: 'inset(0 0% 0 0)',
        opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        }
      });
    });

    // Section header labels and paragraphs: fade + slide
    document.querySelectorAll('.section-header .section-label, .section-header p').forEach(function (el) {
      gsap.set(el, { opacity: 0, y: 18 });
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.66,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          once: true
        }
      });
    });

    // Trust quote grid: use gsap.to (start visible) to avoid cards
    // staying invisible when gsap.from fails to fire in some browsers
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

    // Remaining stagger selectors (excluding ones handled above)
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

      gsap.set(parent.children, { opacity: 0, y: 32 });
      gsap.to(parent.children, {
        opacity: 1,
        y: 0,
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
      gsap.set(ctaContent.children, { opacity: 0, y: 24 });
      gsap.to(ctaContent.children, {
        opacity: 1,
        y: 0,
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

  function initSpotlight() {
    // Spotlight copy and visual are handled in initReveal with enhanced animations.
    // No additional animation needed here.
  }

  function initTrustBadges() {
    // Trust badges are always visible — no GSAP animation.
    // Previous from-based animation was hiding badges when ScrollTrigger
    // failed to fire on mobile viewports.
  }

  function initCardTilt() {
    // Card hover is now CSS-only (transform + transition in style.css).
    // JS tilt removed — mouseleave wasn't firing reliably between adjacent
    // cards, leaving transforms stuck and causing overlap.
  }

  function initReducedMotionState() {
    if (!prefersReducedMotion) return;

    document.querySelectorAll('.reveal').forEach(setVisible);

    document.querySelectorAll('.stat-number[data-target]').forEach(function (el) {
      const target = parseFloat(el.getAttribute('data-target') || '0');
      const suffix = el.getAttribute('data-suffix') || '';
      const isFloat = el.getAttribute('data-float') === 'true';
      el.textContent = (isFloat ? target.toFixed(1) : Math.round(target)) + suffix;
    });
  }

  function initVideoAutoplay() {
    var video = document.querySelector('.network-bg-video video');
    if (!video) return;
    // Safari requires muted property + attribute and playsinline for autoplay
    video.muted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    // Safari sometimes ignores autoplay unless we re-trigger after load
    video.load();
    video.play().catch(function () {
      // Retry once after a short delay — Safari may need the load() to settle
      setTimeout(function () {
        video.play().catch(function () {
          // Autoplay truly blocked — hide the video so no play button shows
          video.style.display = 'none';
        });
      }, 500);
    });
  }

  ready(function () {
    // Mark GSAP as loaded so CSS fallback animations don't fire
    if (hasGSAP) document.documentElement.classList.add('gsap-loaded');

    initReducedMotionState();
    initNav();
    initPageLoad();
    initHeroParallax();
    initCounters();
    initReveal();
    initSpotlight();
    initTrustBadges();
    initCardTilt();
    initVideoAutoplay();

    // Safety net: if any GSAP from() animations leave elements invisible
    // after 4s (e.g. Safari ScrollTrigger timing issues), force them visible.
    setTimeout(function () {
      document.querySelectorAll(
        '.products-grid > *, .trust-quote-grid > *, .why-grid > *, .product-guide-grid > *, .products-list > *, .principles-grid > *, .team-grid > *'
      ).forEach(function (el) {
        var style = window.getComputedStyle(el);
        if (parseFloat(style.opacity) < 0.1) {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      });
    }, 4000);
  });

  window.addEventListener('pagehide', cleanupAnimations, { once: true });
  window.addEventListener('beforeunload', cleanupAnimations, { once: true });
})();

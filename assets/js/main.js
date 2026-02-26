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
        document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
      };

      toggle.addEventListener('click', onToggle);
      addCleanup(function () {
        toggle.removeEventListener('click', onToggle);
      });

      links.querySelectorAll('a').forEach(function (a) {
        const onClick = function () {
          links.classList.remove('open');
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
      const tl = gsap.timeline({ delay: 0.1, defaults: { ease: 'power2.out' } });

      if (badge) tl.from(badge, { opacity: 0, y: 22, duration: 0.6 });
      if (headline) tl.from(headline, { opacity: 0, y: 30, duration: 0.75 }, '-=0.34');
      if (subtext) tl.from(subtext, { opacity: 0, y: 24, duration: 0.62 }, '-=0.42');
      if (actions) tl.from(actions, { opacity: 0, y: 18, duration: 0.54 }, '-=0.35');
      if (stats) tl.from(stats, { opacity: 0, y: 18, duration: 0.54 }, '-=0.3');
    }

    const pageHero = document.querySelector('.page-hero, .about-hero, .claim-hero');
    if (pageHero && !badge) {
      const children = pageHero.querySelectorAll('.section-label, h1, p, .btn');
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

    const staggerSelectors = [
      '.problem-grid',
      '.products-grid',
      '.why-grid',
      '.trust-quote-grid',
      '.product-guide-grid',
      '.products-list',
      '.principles-grid',
      '.team-grid',
      '.timeline'
    ];

    staggerSelectors.forEach(function (selector) {
      const parent = document.querySelector(selector);
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

    document.querySelectorAll('.section-header, .spotlight-copy').forEach(function (el) {
      gsap.from(el.children, {
        opacity: 0,
        y: 24,
        stagger: 0.1,
        duration: 0.66,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        }
      });
    });

    const ctaContent = document.querySelector('.cta-content');
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

  function initSpotlight() {
    if (!hasGSAP || !hasScrollTrigger || prefersReducedMotion) return;

    const frame = document.querySelector('.browser-frame');
    if (!frame) return;

    gsap.from(frame, {
      opacity: 0,
      x: 64,
      rotationY: 7,
      duration: 1.0,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: frame,
        start: 'top 82%',
        once: true
      }
    });
  }

  function initTrustBadges() {
    if (!hasGSAP || !hasScrollTrigger || prefersReducedMotion) return;

    const badges = document.querySelectorAll('.trust-badge');
    if (!badges.length) return;

    gsap.from(badges, {
      opacity: 0,
      y: 16,
      stagger: 0.08,
      duration: 0.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: badges[0].parentElement,
        start: 'top 88%',
        once: true
      }
    });
  }

  function initCardTilt() {
    if (prefersReducedMotion) return;

    const cards = document.querySelectorAll('.why-card, .product-detail-card, .team-card');

    cards.forEach(function (card) {
      const onMove = function (event) {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        card.style.transform = [
          'translateY(-3px)',
          'perspective(900px)',
          'rotateX(' + (-y * 5) + 'deg)',
          'rotateY(' + (x * 5) + 'deg)'
        ].join(' ');
      };

      const onLeave = function () {
        card.style.transform = '';
      };

      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);

      addCleanup(function () {
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
      });
    });
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

  ready(function () {
    initReducedMotionState();
    initNav();
    initPageLoad();
    initHeroParallax();
    initCounters();
    initReveal();
    initSpotlight();
    initTrustBadges();
    initCardTilt();
  });

  window.addEventListener('pagehide', cleanupAnimations, { once: true });
  window.addEventListener('beforeunload', cleanupAnimations, { once: true });
})();

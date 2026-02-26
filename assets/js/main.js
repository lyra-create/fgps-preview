/* ============================================
   FGPS — Premium Rebuild
   GSAP + ScrollTrigger Animations
   ============================================ */

(function () {
  'use strict';

  /* ---- Register GSAP Plugins ---- */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---- Utility: wait for DOM ---- */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ---- Navigation: scroll shrink + blur ---- */
  function initNav() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    const toggle = document.getElementById('navToggle');
    const links  = document.getElementById('navLinks');

    // Scroll handler
    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(function () {
          if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
          } else {
            navbar.classList.remove('scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    // Mobile toggle
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        links.classList.toggle('open');
        document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
      });
      links.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          links.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }

    // Active page link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navbar.querySelectorAll('.nav-links a').forEach(function (a) {
      const href = a.getAttribute('href');
      if (href && href.split('#')[0] === currentPage) {
        a.classList.add('active');
      }
    });
  }

  /* ---- Page Load Animation ---- */
  function initPageLoad() {
    if (typeof gsap === 'undefined') return;

    // Hero elements
    const badge    = document.querySelector('.hero-badge');
    const headline = document.querySelector('h1.hero-headline');
    const subtext  = document.querySelector('.hero-sub');
    const actions  = document.querySelector('.hero-actions');
    const stats    = document.querySelector('.hero-stats');

    if (badge || headline) {
      const tl = gsap.timeline({ delay: 0.1 });
      if (badge)    tl.from(badge,    { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' });
      if (headline) tl.from(headline, { opacity: 0, y: 28, duration: 0.7, ease: 'power3.out' }, '-=0.3');
      if (subtext)  tl.from(subtext,  { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' }, '-=0.4');
      if (actions)  tl.from(actions,  { opacity: 0, y: 16, duration: 0.5, ease: 'power2.out' }, '-=0.35');
      if (stats)    tl.from(stats,    { opacity: 0, y: 16, duration: 0.5, ease: 'power2.out' }, '-=0.3');
    }

    // Page hero (non-home pages)
    const pageHero = document.querySelector('.page-hero, .about-hero, .claim-hero');
    if (pageHero && !badge) {
      const children = pageHero.querySelectorAll('.section-label, h1, p');
      gsap.from(children, {
        opacity: 0, y: 24,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power2.out',
        delay: 0.15
      });
    }
  }

  /* ---- Hero Parallax ---- */
  function initHeroParallax() {
    if (typeof gsap === 'undefined') return;
    const heroBgImg = document.querySelector('.hero-bg img');
    if (!heroBgImg) return;

    // Slow zoom on load
    gsap.to(heroBgImg, {
      scale: 1.08,
      duration: 10,
      ease: 'none',
      delay: 0.2
    });

    // Parallax on scroll
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

  /* ---- Stats Counter Animation ---- */
  function initCounters() {
    if (typeof gsap === 'undefined') return;
    const statNums = document.querySelectorAll('.stat-number[data-target]');
    statNums.forEach(function (el) {
      const target = parseFloat(el.getAttribute('data-target'));
      const suffix = el.getAttribute('data-suffix') || '';
      const isFloat = el.getAttribute('data-float') === 'true';
      const obj = { val: 0 };

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          gsap.to(obj, {
            val: target,
            duration: 1.8,
            ease: 'power2.out',
            onUpdate: function () {
              el.textContent = (isFloat
                ? obj.val.toFixed(1)
                : Math.round(obj.val)) + suffix;
            }
          });
        }
      });
    });
  }

  /* ---- Section Reveals (scroll-triggered fade + slide) ---- */
  function initReveal() {
    if (typeof gsap === 'undefined') return;

    // Generic .reveal elements
    document.querySelectorAll('.reveal').forEach(function (el) {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        }
      });
    });

    // Staggered grid children
    const staggerSelectors = [
      '.problem-grid',
      '.products-grid',
      '.why-grid',
      '.trust-quote-grid',
      '.product-guide-grid',
      '.products-list',
      '.principles-grid',
      '.team-grid',
      '.timeline',
    ];

    staggerSelectors.forEach(function (sel) {
      const grid = document.querySelector(sel);
      if (!grid) return;
      const children = grid.children;
      if (!children.length) return;

      gsap.from(children, {
        opacity: 0,
        y: 32,
        stagger: 0.1,
        duration: 0.65,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: grid,
          start: 'top 85%',
          once: true
        }
      });
    });

    // Section headers
    document.querySelectorAll('.section-header, .spotlight-copy').forEach(function (el) {
      gsap.from(el.children, {
        opacity: 0,
        y: 24,
        stagger: 0.1,
        duration: 0.65,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        }
      });
    });

    // CTA section
    const ctaContent = document.querySelector('.cta-content');
    if (ctaContent) {
      gsap.from(ctaContent.children, {
        opacity: 0, y: 24,
        stagger: 0.1, duration: 0.65, ease: 'power2.out',
        scrollTrigger: { trigger: ctaContent, start: 'top 85%', once: true }
      });
    }
  }

  /* ---- Cloud Dashboard / Spotlight: slide in from right ---- */
  function initSpotlight() {
    if (typeof gsap === 'undefined') return;
    const frame = document.querySelector('.browser-frame');
    if (!frame) return;

    gsap.from(frame, {
      opacity: 0,
      x: 60,
      rotationY: 6,
      duration: 1.0,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: frame,
        start: 'top 82%',
        once: true
      }
    });
  }

  /* ---- Trust badges ticker / fade-in ---- */
  function initTrustBadges() {
    if (typeof gsap === 'undefined') return;
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

  /* ---- Card tilt on mousemove ---- */
  function initCardTilt() {
    const cards = document.querySelectorAll(
      '.why-card, .product-detail-card, .product-showcase-card, .team-card'
    );
    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top)  / rect.height - 0.5;
        card.style.transform = [
          'translateY(-3px)',
          'perspective(800px)',
          'rotateX(' + (-y * 6) + 'deg)',
          'rotateY(' + (x  * 6) + 'deg)'
        ].join(' ');
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---- Init all ---- */
  ready(function () {
    initNav();
    initPageLoad();
    initHeroParallax();
    initCounters();
    initReveal();
    initSpotlight();
    initTrustBadges();
    initCardTilt();
  });

})();

/* ============================================
   FGPS — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // --- Navbar scroll effect ---
    const navbar = document.getElementById('navbar');
    const handleScroll = () => {
        if (window.scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // --- Mobile nav toggle ---
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        // Close mobile nav when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }

    // --- Smooth scroll for anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 100;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
        });
    });

    // --- Intersection Observer for fade-in animations ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add fade-in animation to cards and sections
    const animElements = document.querySelectorAll(
        '.problem-card, .solution-card, .persona-card, .service-card, .trust-card, .trust-numbers, ' +
        '.why-point, .product-card, .team-card, .service-detail-card, .timeline-item'
    );

    animElements.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.6s ease ${i % 4 * 0.1}s, transform 0.6s ease ${i % 4 * 0.1}s`;
        fadeInObserver.observe(el);
    });

    // Add visible class styles
    const style = document.createElement('style');
    style.textContent = `.visible { opacity: 1 !important; transform: translateY(0) !important; }`;
    document.head.appendChild(style);

    // --- Counter animation for stats ---
    const statNumbers = document.querySelectorAll('.stat-number, .trust-big-number');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const text = el.textContent;
                // Only animate numbers
                const match = text.match(/^(\d+)/);
                if (match) {
                    const target = parseInt(match[1]);
                    const suffix = text.replace(match[1], '');
                    let current = 0;
                    const duration = 1500;
                    const step = target / (duration / 16);

                    const animate = () => {
                        current += step;
                        if (current >= target) {
                            el.textContent = target + suffix;
                        } else {
                            el.textContent = Math.floor(current) + suffix;
                            requestAnimationFrame(animate);
                        }
                    };
                    requestAnimationFrame(animate);
                }
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => counterObserver.observe(el));

    // --- Claim form submission ---
    const claimForm = document.getElementById('claimForm');
    if (claimForm) {
        claimForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(claimForm);
            const data = Object.fromEntries(formData.entries());

            // Show success message
            const successMsg = document.getElementById('formSuccess');
            const submitBtn = claimForm.querySelector('.form-submit');

            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            // Simulate sending (in production, this would POST to an endpoint)
            setTimeout(() => {
                claimForm.style.display = 'none';
                if (successMsg) {
                    successMsg.style.display = 'block';
                }

                // Also try to actually send via mailto as fallback
                const subject = encodeURIComponent('FGPS Website Redesign — Claim');
                const body = encodeURIComponent(
                    `Name: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company || 'N/A'}\nMessage: ${data.message || 'No additional message'}`
                );
                // Open mail client as backup
                // window.location.href = `mailto:hello@reaveshq.com?subject=${subject}&body=${body}`;
            }, 1200);
        });
    }

    // --- Contact form ---
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('.form-submit');
            const successMsg = document.getElementById('contactSuccess');

            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            setTimeout(() => {
                contactForm.style.display = 'none';
                if (successMsg) successMsg.style.display = 'block';
            }, 1200);
        });
    }
});

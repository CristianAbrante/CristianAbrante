(function () {
    const nav = document.querySelector('.nav');

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href.length <= 1) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    const onScroll = () => {
        if (!nav) return;
        nav.classList.toggle('is-scrolled', window.pageYOffset > 12);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const revealTargets = document.querySelectorAll(
        '.hero-copy > *, .hero-portrait, .section-head, .entry, .skill-category, .award-item, .contact-card'
    );

    document.querySelectorAll('.entry-summary').forEach((btn) => {
        if (btn.disabled) return;
        const entry = btn.closest('.entry');
        const panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (!entry || !panel) return;

        btn.addEventListener('click', () => {
            const isOpen = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', String(!isOpen));
            entry.classList.toggle('is-open', !isOpen);
            panel.hidden = isOpen;
        });
    });

    if ('IntersectionObserver' in window) {
        revealTargets.forEach((el, i) => {
            el.classList.add('reveal');
            el.style.transitionDelay = `${Math.min(i, 6) * 60}ms`;
        });

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0, rootMargin: '0px 0px -8% 0px' }
        );

        revealTargets.forEach((el) => observer.observe(el));

        window.setTimeout(() => {
            revealTargets.forEach((el) => el.classList.add('is-visible'));
        }, 2500);
    }
})();

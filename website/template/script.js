(function () {
    'use strict';

    var root = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var systemLight = window.matchMedia('(prefers-color-scheme: light)');

    /* ---------- CRT power-on ---------- */

    var crtScreen = document.querySelector('.crt__screen');

    function powerOn() {
        if (!crtScreen || reduceMotion.matches) return;
        crtScreen.classList.remove('is-boot');
        /* Reading offsetWidth forces a reflow so the animation restarts
           instead of being coalesced away when the class is re-added. */
        void crtScreen.offsetWidth;
        crtScreen.classList.add('is-boot');
    }

    /* ---------- Theme ---------- */

    var toggle = document.getElementById('theme-toggle');
    var toggleLabel = toggle ? toggle.querySelector('.toggle__label') : null;

    function readStoredTheme() {
        try {
            var stored = localStorage.getItem('theme');
            return stored === 'day' || stored === 'night' ? stored : null;
        } catch (error) {
            return null;
        }
    }

    function renderTheme(theme) {
        root.dataset.theme = theme;
        if (toggleLabel) toggleLabel.textContent = toggleLabel.dataset[theme] || theme;
        if (toggle) toggle.setAttribute('aria-pressed', String(theme === 'day'));
    }

    function selectTheme(theme) {
        renderTheme(theme);
        try {
            localStorage.setItem('theme', theme);
        } catch (error) {
            /* Private mode or blocked storage: the choice simply does not persist. */
        }
        powerOn();
    }

    renderTheme(root.dataset.theme === 'day' ? 'day' : 'night');

    if (toggle) {
        toggle.addEventListener('click', function () {
            selectTheme(root.dataset.theme === 'day' ? 'night' : 'day');
        });
    }

    systemLight.addEventListener('change', function (event) {
        if (!readStoredTheme()) renderTheme(event.matches ? 'day' : 'night');
    });

    /* ---------- Scroll reveal ---------- */

    var revealables = document.querySelectorAll('.reveal');

    if (!reduceMotion.matches && 'IntersectionObserver' in window) {
        var revealObserver = new IntersectionObserver(
            function (entries, observer) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-in');
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
        );
        revealables.forEach(function (element) {
            revealObserver.observe(element);
        });
    } else {
        revealables.forEach(function (element) {
            element.classList.add('is-in');
        });
    }

    /* ---------- Navigation ---------- */

    var nav = document.querySelector('.nav');
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__menu a'));
    var pending = false;

    function updateStuck() {
        pending = false;
        if (nav) nav.classList.toggle('is-stuck', window.scrollY > 8);
    }

    window.addEventListener(
        'scroll',
        function () {
            if (pending) return;
            pending = true;
            requestAnimationFrame(updateStuck);
        },
        { passive: true }
    );

    updateStuck();

    var sections = navLinks
        .map(function (link) {
            return document.querySelector(link.getAttribute('href'));
        })
        .filter(Boolean);

    if (sections.length && 'IntersectionObserver' in window) {
        var spy = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    navLinks.forEach(function (link) {
                        link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
                    });
                });
            },
            { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
        );
        sections.forEach(function (section) {
            spy.observe(section);
        });
    }

    /* ---------- Print ---------- */

    /* Collapsed <details> cannot be forced open from CSS, so the print view —
       which is the full-CV view — expands them here and restores after. */
    var disclosures = Array.prototype.slice.call(document.querySelectorAll('details'));

    window.addEventListener('beforeprint', function () {
        disclosures.forEach(function (element) {
            element.dataset.wasOpen = String(element.open);
            element.open = true;
        });
    });

    window.addEventListener('afterprint', function () {
        disclosures.forEach(function (element) {
            element.open = element.dataset.wasOpen === 'true';
            delete element.dataset.wasOpen;
        });
    });

    powerOn();
})();

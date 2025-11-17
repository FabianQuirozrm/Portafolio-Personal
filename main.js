// Portafolio Fabian Quiroz - main.js (versión optimizada)

// Encapsular todo en IIFE para evitar fugas al scope global
(function () {
    'use strict';

    // Configuración
    const CONFIG = {
        particleCount: 50,
        particleMaxSize: 6,
        particleMinSize: 2,
        particleMaxDuration: 25,
        typewriterDelayStart: 2000,
        navOffset: 80,
        activeSectionOffset: 100
    };

    // Cache de selectores usados frecuentemente
    const cached = {
        body: document.body,
        nav: document.querySelector('nav'),
        navLinksContainer: document.querySelector('.nav-links') || document, // fallback
        heroBg: document.querySelector('.hero-bg'),
        particlesContainer: document.getElementById('particles'),
        typewriterEl: document.querySelector('.typewriter'),
        skillCardsContainer: document.querySelector('.skills') || document,
        socialLinksContainer: document.querySelector('.social-links') || document,
        sections: null // se llena dinámicamente
    };

    // Utils
    const raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : (fn) => setTimeout(fn, 16);
    const rIC = window.requestIdleCallback ? window.requestIdleCallback.bind(window) : (fn) => setTimeout(fn, 200);
    const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

    // Debounce simple
    function debounce(fn, wait = 100) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), wait);
        };
    }

    // ===== Navegación suave y active link (event delegation) =====
    function initNavigation() {
        // Actualizar cache de sections
        cached.sections = Array.from(document.querySelectorAll('section[id]'));

        // Delegación para enlaces de navegación (document para robustez)
        document.addEventListener('click', (e) => {
            const link = e.target.closest('.nav-link');
            if (!link) return;
            const href = link.getAttribute('href');
            if (!href || !href.startsWith('#')) return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (!target) return;

            const offsetTop = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - CONFIG.navOffset);
            window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        }, { passive: true });

        // Scroll handler optimizado para marcar enlace activo y parallax
        let ticking = false;
        function onScroll() {
            if (!ticking) {
                ticking = true;
                raf(() => {
                    updateActiveNavLink();
                    applyParallax();
                    ticking = false;
                });
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', debounce(() => {
            cached.sections = Array.from(document.querySelectorAll('section[id]'));
            updateActiveNavLink();
        }, 150));
        updateActiveNavLink(); // inicial
    }

    function updateActiveNavLink() {
        if (!cached.sections) return;
        const y = window.pageYOffset;
        let currentId = '';
        for (const section of cached.sections) {
            const rect = section.getBoundingClientRect();
            const top = rect.top + window.pageYOffset - CONFIG.activeSectionOffset;
            const bottom = top + rect.height;
            if (y >= top && y < bottom) {
                currentId = section.id;
                break;
            }
        }

        // Actualizar clases (uso de querySelectorAll mínimo)
        const links = document.querySelectorAll('.nav-link');
        links.forEach(link => {
            link.classList.remove('text-blue-600', 'font-semibold');
            const href = link.getAttribute('href');
            if (href === `#${currentId}`) {
                link.classList.add('text-blue-600', 'font-semibold');
            }
        });
    }

    // ===== Scroll reveal con IntersectionObserver =====
    function initScrollAnimations() {
        const revealElements = document.querySelectorAll('.reveal');
        if (!revealElements.length) return;

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    obs.unobserve(entry.target); // una vez activo, ya no observar
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        revealElements.forEach(el => observer.observe(el));
    }

    // ===== Sistema de partículas optimizado =====
    function initParticles() {
        const container = cached.particlesContainer;
        if (!container) return;

        // Limpieza inicial
        container.innerHTML = '';

        // Crear partículas de forma escalonada para evitar bloquear UI
        const createBatch = (count) => {
            for (let i = 0; i < count; i++) createParticle(container);
        };

        // Crear inicialmente la mitad y el resto en idle
        createBatch(Math.floor(CONFIG.particleCount / 2));
        rIC(() => createBatch(CONFIG.particleCount - Math.floor(CONFIG.particleCount / 2)));

        // Mantener número aproximado sin setInterval pesado
        const mutationObserver = new MutationObserver(() => {
            // Si hay menos, crear algunas más (no más de 5 a la vez)
            const deficit = CONFIG.particleCount - container.children.length;
            if (deficit > 0) createBatch(Math.min(deficit, 5));
        });
        mutationObserver.observe(container, { childList: true });
    }

    function createParticle(container) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * (CONFIG.particleMaxSize - CONFIG.particleMinSize) + CONFIG.particleMinSize;
        p.style.width = p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}%`;
        const duration = Math.random() * CONFIG.particleMaxDuration + 10;
        p.style.animationDuration = `${duration}s`;
        p.style.animationDelay = `${Math.random() * 5}s`;
        // Remover al terminar la animación
        p.addEventListener('animationend', () => p.remove(), { once: true });
        container.appendChild(p);
    }

    // ===== Typewriter limpio y reutilizable =====
    function initTypewriter() {
        const el = cached.typewriterEl;
        if (!el) return;

        const texts = [
            'Programador & Desarrollador',
            'Especialista en Automatización',
            'Creador de Soluciones Digitales',
            'Ingeniero de Software'
        ];
        let iText = 0, iChar = 0, deleting = false;

        function tick() {
            const full = texts[iText];
            const next = deleting ? full.slice(0, iChar - 1) : full.slice(0, iChar + 1);
            if (el.textContent !== next) el.textContent = next; // solo escribir si cambia

            if (!deleting) {
                iChar++;
                if (iChar === full.length) {
                    deleting = true;
                    setTimeout(tick, 1800);
                    return;
                }
            } else {
                iChar--;
                if (iChar === 0) {
                    deleting = false;
                    iText = (iText + 1) % texts.length;
                    setTimeout(tick, 500);
                    return;
                }
            }
            setTimeout(tick, deleting ? 50 : 100);
        }

        setTimeout(tick, CONFIG.typewriterDelayStart);
    }

    // ===== Tarjetas de habilidades (delegación) =====
    function initSkillCards() {
        const container = cached.skillCardsContainer;
        if (!container) return;

        container.addEventListener('pointerover', (e) => {
            const card = e.target.closest('.skill-card');
            if (!card) return;
            card.classList.add('skill-card--hover');
        });

        container.addEventListener('pointerout', (e) => {
            const card = e.target.closest('.skill-card');
            if (!card) return;
            card.classList.remove('skill-card--hover');
        });

        // click effect usando clase para animación en CSS
        container.addEventListener('click', (e) => {
            const card = e.target.closest('.skill-card');
            if (!card) return;
            card.classList.add('skill-card--active');
            setTimeout(() => card.classList.remove('skill-card--active'), 160);
        });
    }

    // ===== Enlaces sociales (delegación + ripple) =====
    function initSocialLinks() {
        const container = cached.socialLinksContainer;
        if (!container) return;

        container.addEventListener('click', (e) => {
            const link = e.target.closest('.social-link');
            if (!link) return;
            // ripple
            createRippleEffect(link, e);
            // permitir navegación como siempre
        });

        // hover pulse por CSS usando clase
        container.addEventListener('pointerover', (e) => {
            const link = e.target.closest('.social-link');
            if (!link) return;
            link.classList.add('social-link--hover');
        });
        container.addEventListener('pointerout', (e) => {
            const link = e.target.closest('.social-link');
            if (!link) return;
            link.classList.remove('social-link--hover');
        });
    }

    function createRippleEffect(element, event) {
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        element.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    }

    // ===== Menú móvil =====
    function initMobileMenu() {
        const btn = document.querySelector('.mobile-menu-btn');
        if (!btn || !cached.nav) return;

        btn.addEventListener('click', () => {
            cached.nav.classList.toggle('nav--open');
            const disabled = cached.nav.classList.contains('nav--open');
            toggleBodyScroll(disabled);
        }, { passive: true });
    }

    function toggleBodyScroll(disable) {
        cached.body.style.overflow = disable ? 'hidden' : '';
        // evitar salto de layout en mobile podría añadirse aquí (ej. padding-right)
    }

    // ===== Parallax centralizado =====
    function applyParallax() {
        const scrolled = window.pageYOffset;
        if (cached.heroBg) {
            cached.heroBg.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
        const particles = cached.particlesContainer;
        if (particles) {
            particles.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    }

    // ===== Animate numbers (solo una vez cuando aparecen) =====
    function animateNumbers() {
        const numbers = document.querySelectorAll('.number');
        if (!numbers.length) return;

        const obs = new IntersectionObserver((entries, o) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.textContent, 10) || 0;
                    let current = 0;
                    const steps = 50;
                    const increment = Math.max(1, Math.floor(target / steps));
                    const iv = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            el.textContent = String(target);
                            clearInterval(iv);
                        } else {
                            el.textContent = String(current);
                        }
                    }, 40);
                    o.unobserve(el);
                }
            });
        }, { threshold: 0.6 });

        numbers.forEach(n => obs.observe(n));
    }

    // ===== Lazy loading de imágenes con IO =====
    function initLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        if (!images.length) return;

        const io = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '200px 0px' });

        images.forEach(img => io.observe(img));
    }

    // ===== Inicialización principal =====
    function initAll() {
        initNavigation();
        initScrollAnimations();
        initParticles();
        initTypewriter();
        initSkillCards();
        initSocialLinks();
        initMobileMenu();
        initLazyLoading();
        animateNumbers();
    }

    // Inicializar cuando DOM listo
    document.addEventListener('DOMContentLoaded', initAll, { once: true });

    // Marca cuando la página carga recursos pesados
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    }, { once: true });

    // Exportar API mínima
    window.PortfolioJS = {
        initAll,
        initParticles,
        initTypewriter,
        animateNumbers
    };

    // Manejo básico de errores
    try {
        console.log('Portafolio de Fabian Quiroz - Optimizado e inicializado');
    } catch (err) {
        console.error('Error en inicialización del portafolio:', err);
    }
})();

/*!
* Start Bootstrap - Landing Page v6.0.6 (https://startbootstrap.com/theme/landing-page)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-landing-page/blob/master/LICENSE)
*/

document.addEventListener('DOMContentLoaded', function() {
    // Fade-in animation for feature icons
    const observeElements = (selector, animationClass, delay = 0) => {
        const elements = document.querySelectorAll(selector);
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add(animationClass);
                    }, index * delay);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        elements.forEach(el => {
            el.style.opacity = '0';
            observer.observe(el);
        });
    };

    // Animate feature icons on homepage
    observeElements('.features-icons-item', 'fade-in-up', 150);

    // Animate dashboard cards
    observeElements('.card', 'fade-in-scale', 100);

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        } else {
            navbar.style.boxShadow = 'none';
        }

        lastScroll = currentScroll;
    });

    // Button hover effects with ripple
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function(e) {
            this.style.transform = 'translateY(-2px)';
            this.style.transition = 'transform 0.3s ease';
        });

        button.addEventListener('mouseleave', function(e) {
            this.style.transform = 'translateY(0)';
        });

        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Card hover effects
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
            this.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 0.125rem 0.25rem rgba(0,0,0,0.075)';
        });
    });

    // Icon animation on hover
    const icons = document.querySelectorAll('.features-icons-icon i, .card-body i');
    icons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.transform = 'rotate(10deg) scale(1.2)';
            this.style.transition = 'transform 0.3s ease';
        });

        icon.addEventListener('mouseleave', function() {
            this.style.transform = 'rotate(0) scale(1)';
        });
    });

    // Parallax effect for masthead
    const masthead = document.querySelector('.masthead');
    if (masthead) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            masthead.style.transform = `translateY(${scrolled * 0.5}px)`;
        });
    }

    // Logo pulse animation on page load (homepage)
    const navbarLogos = document.querySelectorAll('.navbar-brand img');
    navbarLogos.forEach((logo, index) => {
        setTimeout(() => {
            logo.style.animation = 'pulse 1s ease-in-out';
        }, index * 200);
    });

    // Logo roll-in animation for dashboard banner
    const dashboardHeader = document.querySelector('header.bg-primary h1');
    if (dashboardHeader && dashboardHeader.textContent.includes('Dashboard')) {
        const dashboardLogo = document.createElement('img');
        dashboardLogo.src = '/assets/img/EllaRises.png';
        dashboardLogo.alt = 'Ella Rises Logo';
        dashboardLogo.classList.add('dashboard-logo-animated');
        dashboardLogo.style.maxHeight = '150px';
        dashboardLogo.style.marginBottom = '1rem';
        
        const headerContainer = dashboardHeader.closest('.text-center');
        if (headerContainer) {
            headerContainer.insertBefore(dashboardLogo, headerContainer.firstChild);
        }
    }

    // Counter animation for dashboard stats
    const animateCounter = (element, target, duration = 2000) => {
        let current = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = Math.round(target);
                clearInterval(timer);
            } else {
                element.textContent = Math.round(current);
            }
        }, 16);
    };

    // Social media icon bounce
    const socialIcons = document.querySelectorAll('footer .list-inline-item a i');
    socialIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.animation = 'bounce 0.5s ease';
        });
        
        icon.addEventListener('animationend', function() {
            this.style.animation = '';
        });
    });

    // Text typing effect for headers (optional)
    const typeWriter = (element, text, speed = 100) => {
        let i = 0;
        element.textContent = '';
        const typing = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typing);
            }
        }, speed);
    };

    // Loading animation
    window.addEventListener('load', () => {
        document.body.style.opacity = '0';
        setTimeout(() => {
            document.body.style.transition = 'opacity 0.5s ease';
            document.body.style.opacity = '1';
        }, 100);
    });
});
/*!
* Start Bootstrap - Landing Page v6.0.6 (https://startbootstrap.com/theme/landing-page)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-landing-page/blob/master/LICENSE)
*/

// ========================================
// FANCY ANIMATIONS
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Fade in animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const fadeInObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe feature items and call-to-action (but NOT dashboard cards)
    document.querySelectorAll('.features-icons-item, .call-to-action').forEach(el => {
        el.style.opacity = '0';
        fadeInObserver.observe(el);
    });

    // Floating animation for icons
    const icons = document.querySelectorAll('.features-icons-icon i, .card-body > i');
    icons.forEach((icon, index) => {
        icon.style.animation = `float 3s ease-in-out ${index * 0.2}s infinite`;
    });

    // Parallax effect on masthead
    const masthead = document.querySelector('.masthead');
    if (masthead) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            masthead.style.transform = `translateY(${scrolled * 0.5}px)`;
        });
    }

    // Smooth hover effects for buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05) translateY(-2px)';
            this.style.transition = 'all 0.3s ease';
        });
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) translateY(0)';
        });
    });

    // Card hover animations
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
            this.style.transition = 'all 0.3s ease';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        });
    });

    // Stagger animation for feature items
    const featureItems = document.querySelectorAll('.features-icons-item');
    featureItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 150);
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'all 0.6s ease';
    });

    // Stagger animation for dashboard cards (fade in one by one)
    const dashboardCards = document.querySelectorAll('.row.gx-4 > .col .card');
    if (dashboardCards.length > 0) {
        dashboardCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px) scale(0.95)';
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) scale(1)';
            }, index * 200 + 300);
        });
    }

    // Navbar shadow on scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                navbar.style.transition = 'box-shadow 0.3s ease';
            } else {
                navbar.style.boxShadow = 'none';
            }
        });
    }

    // Pulse animation for social icons
    const socialIcons = document.querySelectorAll('.list-inline-item a i');
    socialIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.animation = 'pulse 0.6s ease';
        });
        icon.addEventListener('animationend', function() {
            this.style.animation = '';
        });
    });

    // Text typewriter effect for headings (if h1 exists)
    const mainHeading = document.querySelector('h1.display-4');
    if (mainHeading && mainHeading.textContent) {
        const text = mainHeading.textContent;
        const parentContainer = mainHeading.closest('.bg-primary');
        
        // Set minimum height on container to prevent shifting
        if (parentContainer) {
            const currentHeight = parentContainer.offsetHeight;
            parentContainer.style.minHeight = currentHeight + 'px';
        }
        
        // Create invisible span with full text to preserve width
        const widthPreserver = document.createElement('span');
        widthPreserver.textContent = text;
        widthPreserver.style.visibility = 'hidden';
        widthPreserver.style.position = 'absolute';
        mainHeading.parentNode.insertBefore(widthPreserver, mainHeading);
        
        mainHeading.textContent = '';
        mainHeading.style.opacity = '1';
        mainHeading.style.minWidth = widthPreserver.offsetWidth + 'px';
        mainHeading.style.display = 'inline-block';
        
        let i = 0;
        
        function typeWriter() {
            if (i < text.length) {
                mainHeading.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            } else {
                // Clean up after animation completes
                widthPreserver.remove();
                mainHeading.style.minWidth = '';
            }
        }
        
        setTimeout(typeWriter, 300);
    }

    // Ripple effect on button clicks
    buttons.forEach(button => {
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

    // Handle "Go to page" functionality
    const goToPageBtn = document.getElementById('goToPageBtn');
    const pageNumberInput = document.getElementById('pageNumberInput');

    if (goToPageBtn && pageNumberInput) {
        goToPageBtn.addEventListener('click', function() {
            const pageNumber = parseInt(pageNumberInput.value);
            const totalPages = parseInt(pageNumberInput.max); // Using max attribute for total pages

            if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
                alert(`Please enter a valid page number between 1 and ${totalPages}.`);
                pageNumberInput.value = ''; // Clear invalid input
            } else {
                const currentPath = window.location.pathname.split('?')[0]; // Get path without query string
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('page', pageNumber);
                window.location.href = `${currentPath}?${urlParams.toString()}`;
            }
        });

        // Allow pressing Enter key to go to page
        pageNumberInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent form submission if input is inside a form
                goToPageBtn.click(); // Trigger the button click
            }
        });
    }
});


// Add keyframe animations via JavaScript
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
    
    .animate-fade-in {
        animation: fadeIn 0.8s ease forwards;
    }
    
    @keyframes fadeIn {
        from { 
            opacity: 0;
            transform: translateY(30px);
        }
        to { 
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: rippleEffect 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes rippleEffect {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
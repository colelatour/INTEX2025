/*!
* Start Bootstrap - Landing Page v6.0.6 (https://startbootstrap.com/theme/landing-page)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-landing-page/blob/master/LICENSE)
*/

// ========================================
// FANCY ANIMATIONS & UI INTERACTIVITY
// ========================================

// We wrap everything in an event listener to make sure the HTML is fully loaded 
// before we try to manipulate any elements. This prevents "element not found" errors.
document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. Scroll-Triggered Fade In ---
    // Instead of using a 'scroll' event listener (which fires constantly and slows down the browser),
    // we use the Intersection Observer API. It efficiently watches for when elements enter the screen.
    const observerOptions = {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Offset the trigger point slightly so it activates just before the user hits the exact spot
    };

    const fadeInObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            // If the element is on screen...
            if (entry.isIntersecting) {
                // ...add the CSS class that performs the animation...
                entry.target.classList.add('animate-fade-in');
                // ...and stop watching it. We only want it to fade in once.
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Select the feature icons and the call-to-action section.
    // We exclude the dashboard cards here because they have their own special stagger animation later.
    document.querySelectorAll('.features-icons-item, .call-to-action').forEach(el => {
        el.style.opacity = '0'; // Hide them initially so they can fade in
        fadeInObserver.observe(el); // Tell the observer to watch these elements
    });

    // --- 2. Floating Icon Animation ---
    // This gives the icons a gentle "hovering" motion.
    const icons = document.querySelectorAll('.features-icons-icon i, .card-body > i');
    icons.forEach((icon, index) => {
        // We add a slight delay based on the index (index * 0.2s). 
        // This ensures the icons don't all float in perfect sync, which looks robotic.
        // It creates a more organic, "wave-like" motion.
        icon.style.animation = `float 3s ease-in-out ${index * 0.2}s infinite`;
    });

    // --- 3. Parallax Effect ---
    // This creates depth by moving the background image slower than the rest of the page when scrolling.
    const masthead = document.querySelector('.masthead');
    if (masthead) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            // We move the background down by half the speed of the scroll (scrolled * 0.5).
            masthead.style.transform = `translateY(${scrolled * 0.5}px)`;
        });
    }

    // --- 4. Button Hover Effects ---
    // Adds a tactile feel to buttons—they grow slightly when hovered.
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05) translateY(-2px)'; // Grow and lift up
            this.style.transition = 'all 0.3s ease'; // Smooth the change
        });
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) translateY(0)'; // Return to normal
        });
    });

    // --- 5. Card Hover Effects ---
    // Similar to buttons, but for content cards. They lift up and cast a larger shadow.
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)'; // Significant lift
            this.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)'; // Deeper shadow for "3D" effect
            this.style.transition = 'all 0.3s ease';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)'; // Reset position
            this.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)'; // Reset shadow
        });
    });

    // --- 6. Staggered Feature Reveal ---
    // This runs immediately on load. It reveals feature items one by one.
    const featureItems = document.querySelectorAll('.features-icons-item');
    featureItems.forEach((item, index) => {
        // We use setTimeout with a multiplier (index * 150ms).
        // Item 1 waits 0ms, Item 2 waits 150ms, Item 3 waits 300ms, etc.
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 150);
        
        // Initial state before the timeout fires
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)'; // Start slightly lower so they slide up
        item.style.transition = 'all 0.6s ease';
    });

    // --- 7. Staggered Dashboard Card Reveal ---
    // Similar to features, but specific to the dashboard grid view.
    const dashboardCards = document.querySelectorAll('.row.gx-4 > .col .card');
    if (dashboardCards.length > 0) {
        dashboardCards.forEach((card, index) => {
            // Initial setup: invisible and slightly shrunk
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px) scale(0.95)';
            // Cubic-bezier gives it a specific "bouncy" feel rather than a linear movement
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            
            // Fire the reveal. We add a base delay of 300ms so they don't start 
            // until the page header has had a chance to render.
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) scale(1)';
            }, index * 200 + 300);
        });
    }

    // --- 8. Dynamic Navbar Shadow ---
    // Only shows a shadow under the navbar when the user has scrolled down a bit.
    // This keeps the design clean when at the very top of the page.
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

    // --- 9. Social Icon Pulse ---
    // A quick "heartbeat" animation when hovering over social media links.
    const socialIcons = document.querySelectorAll('.list-inline-item a i');
    socialIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.animation = 'pulse 0.6s ease';
        });
        // Important: Remove the animation property when it finishes. 
        // If we don't do this, the animation won't run a second time if the user hovers again.
        icon.addEventListener('animationend', function() {
            this.style.animation = '';
        });
    });

    // --- 10. Typewriter Effect ---
    // This creates the effect of the main headline being typed out character by character.
    const mainHeading = document.querySelector('h1.display-4');
    if (mainHeading && mainHeading.textContent) {
        const text = mainHeading.textContent;
        const parentContainer = mainHeading.closest('.bg-primary');
        
        // UX Fix: Set a minimum height on the container.
        // Without this, the blue header box might collapse and then expand as text appears,
        // causing a jarring layout shift.
        if (parentContainer) {
            const currentHeight = parentContainer.offsetHeight;
            parentContainer.style.minHeight = currentHeight + 'px';
        }
        
        // Layout Stability Trick:
        // We create an invisible clone of the text. This forces the browser to reserve 
        // the full width of the headline immediately. If we didn't do this, 
        // centered text would jitter left and right as new letters were added.
        const widthPreserver = document.createElement('span');
        widthPreserver.textContent = text;
        widthPreserver.style.visibility = 'hidden'; // Invisible but takes up space
        widthPreserver.style.position = 'absolute'; // Remove from flow temporarily to measure
        mainHeading.parentNode.insertBefore(widthPreserver, mainHeading);
        
        // Reset the visible heading to empty
        mainHeading.textContent = '';
        mainHeading.style.opacity = '1';
        mainHeading.style.minWidth = widthPreserver.offsetWidth + 'px'; // Set the width based on the invisible clone
        mainHeading.style.display = 'inline-block';
        
        let i = 0;
        
        // Recursive function to add one letter at a time
        function typeWriter() {
            if (i < text.length) {
                mainHeading.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100); // Wait 100ms before adding the next letter
            } else {
                // Cleanup: remove the invisible helper and reset width when done
                widthPreserver.remove();
                mainHeading.style.minWidth = '';
            }
        }
        
        // Start the typing after a short delay (300ms)
        setTimeout(typeWriter, 300);
    }

    // --- 11. Button Ripple Effect ---
    // A complex visual effect (like Material Design) where a circle expands from where you clicked.
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            
            // Calculate size: make the ripple circle big enough to cover the button
            const size = Math.max(rect.width, rect.height);
            
            // Calculate position: center the ripple on the mouse click coordinates relative to the button
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            // Apply styles to the ripple element
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            // Ensure the button handles the overflow so the ripple stays inside the button borders
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            // Remove the DOM element after animation to prevent memory leaks
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // --- 12. Pagination Logic ("Go to page") ---
    // Handles the input box where a user types a page number and hits "Go".
    const goToPageBtn = document.getElementById('goToPageBtn');
    const pageNumberInput = document.getElementById('pageNumberInput');

    if (goToPageBtn && pageNumberInput) {
        goToPageBtn.addEventListener('click', function() {
            const pageNumber = parseInt(pageNumberInput.value);
            const totalPages = parseInt(pageNumberInput.max); // We assume the HTML has max="10" etc.

            // Validation: Ensure it's a real number and within range.
            if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
                alert(`Please enter a valid page number between 1 and ${totalPages}.`);
                pageNumberInput.value = ''; // Clear the bad input
            } else {
                // Construct the new URL. 
                // We use URLSearchParams so we don't accidentally wipe out other filters 
                // (like ?search=Smith) when changing the page.
                const currentPath = window.location.pathname.split('?')[0]; 
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('page', pageNumber); // Update just the 'page' parameter
                window.location.href = `${currentPath}?${urlParams.toString()}`;
            }
        });

        // Usability Improvement: Allow the user to just hit "Enter" inside the input box
        pageNumberInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Stop standard form submission (if inside a <form>)
                goToPageBtn.click(); // Programmatically click the "Go" button
            }
        });
    }
});


// --- 13. Dynamic CSS Injection ---
// Instead of requiring a separate .css file, we inject the keyframe animations 
// directly into the document head. This makes this JS file self-contained.
const style = document.createElement('style');
style.textContent = `
    /* Float animation for icons */
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
    }
    
    /* Pulse animation for social links */
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
    
    /* Simple fade up animation */
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
    
    /* Ripple circle style */
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: rippleEffect 0.6s ease-out;
        pointer-events: none; /* Let clicks pass through it */
    }
    
    @keyframes rippleEffect {
        to {
            transform: scale(4); /* Grow large */
            opacity: 0; /* Fade out */
        }
    }
`;
document.head.appendChild(style);
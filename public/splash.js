// 2-Second Precise Splash Animation with GSAP loading check
(function(){
  'use strict';
  
  const logo = document.getElementById('logo');
  if (!logo) {
    console.warn('Logo element not found');
    ensureAppVisible();
    return;
  }

  console.log('Starting 2-second precise splash animation');

  // Function to ensure app is always visible
  function ensureAppVisible() {
    const root = document.getElementById('root');
    if (root) {
      root.style.opacity = '1';
      root.classList.add('loaded');
    }
  }

  // Function to run the splash animation
  function runSplashAnimation() {
    // Check if GSAP is loaded
    if (typeof gsap === 'undefined') {
      console.warn('GSAP not loaded, using fallback animation');
      useFallbackAnimation();
      return;
    }

    // Check for reduced motion
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(logo, { opacity: 1 });
      setTimeout(() => {
        finishSplash();
      }, 2000);
      return;
    }

    // Set initial state: logo completely hidden off-screen left
    gsap.set(logo, { 
      x: -400,        // Fixed pixel value to prevent jitter
      scale: 1, 
      opacity: 0,     // Start invisible
      visibility: 'hidden',  // Completely hidden until animation
      force3D: true   // GPU acceleration
    });

    // Load app content immediately with opacity overlay for smooth transition
    const root = document.getElementById('root');
    if (root) {
      root.style.opacity = '0.95'; // Slightly visible underneath
      root.classList.add('loaded');
    }

    // Create ultra-smooth 2-second timeline
    const tl = gsap.timeline({ onComplete: finishSplash });

    tl.to(logo, { 
        x: 0,           // Slide smoothly to center
        opacity: 1,     // Fade in as it slides
        visibility: 'visible',  // Make visible
        duration: 0.8,
        ease: "power2.out"  // Smoother easing
      })
      .to(logo, { 
        scale: 1.06,    // Gentle bounce up
        duration: 0.15,
        ease: "power1.out"
      })
      .to(logo, {
        scale: 1.0,     // Settle back smoothly
        duration: 0.15,
        ease: "power1.out"
      })
      .to({}, { 
        duration: 0.9   // Hold logo visible until 2s mark
      });
  }

  // Fallback animation without GSAP
  function useFallbackAnimation() {
    logo.style.opacity = '1';
    logo.style.visibility = 'visible';
    
    const root = document.getElementById('root');
    if (root) {
      root.style.opacity = '0.95';
      root.classList.add('loaded');
    }

    setTimeout(() => {
      finishSplash();
    }, 2000);
  }

  function finishSplash(){
    console.log('2-second smooth splash completed');
    
    // Ensure login is fully visible
    const root = document.getElementById('root');
    if (root) {
      root.style.opacity = '1';
    }
    
    // Remove splash with fade
    const splash = document.getElementById('splash');
    if (splash) {
      if (typeof gsap !== 'undefined') {
        gsap.to(splash, { 
          opacity: 0, 
          duration: 0.1,
          onComplete: () => {
            if (splash.parentNode) {
              splash.parentNode.removeChild(splash);
            }
          }
        });
      } else {
        // Fallback without GSAP
        splash.style.transition = 'opacity 0.1s';
        splash.style.opacity = '0';
        setTimeout(() => {
          if (splash.parentNode) {
            splash.parentNode.removeChild(splash);
          }
        }, 100);
      }
    }
    
    // Fire completion event
    window.dispatchEvent(new CustomEvent('splashComplete'));
  }

  // Wait for GSAP to load, with timeout
  let attempts = 0;
  const maxAttempts = 50; // 500ms total wait time
  
  function checkGSAP() {
    if (typeof gsap !== 'undefined' || attempts >= maxAttempts) {
      runSplashAnimation();
    } else {
      attempts++;
      setTimeout(checkGSAP, 10);
    }
  }

  // Start checking for GSAP
  checkGSAP();
})();

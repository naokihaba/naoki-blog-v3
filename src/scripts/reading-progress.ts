/**
 * Reading Progress Bar
 * Tracks scroll progress and displays it at the top of the page
 */

function initReadingProgress() {
  // Create progress bar element
  const progressBar = document.createElement('div');
  progressBar.id = 'reading-progress';
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 3px;
    background: var(--gradient-primary);
    z-index: 9999;
    transition: width 0.1s ease-out;
  `;
  document.body.appendChild(progressBar);

  // Update progress on scroll
  function updateProgress() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    const scrolled = window.scrollY;
    const progress = (scrolled / documentHeight) * 100;

    progressBar.style.width = `${Math.min(progress, 100)}%`;
  }

  // Throttle scroll event for better performance
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Initial update
  updateProgress();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReadingProgress);
} else {
  initReadingProgress();
}

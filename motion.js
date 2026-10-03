(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll('.scroll-reveal');

  if (targets.length && !prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, activeObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        activeObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -48px 0px' });

    document.documentElement.classList.add('motion-ready');
    targets.forEach((target) => revealObserver.observe(target));
  }

  const demo = document.querySelector('.journey-demo');
  const toggle = document.querySelector('.journey-demo-toggle');

  if (!demo || !toggle || prefersReducedMotion) return;

  let isInView = !('IntersectionObserver' in window);
  let isPaused = false;

  const updatePlayback = () => {
    demo.classList.toggle('is-playing', isInView && !isPaused && !document.hidden);
  };

  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    isPaused = !isPaused;
    toggle.setAttribute('aria-pressed', String(isPaused));
    toggle.textContent = isPaused ? 'Play animation' : 'Pause animation';
    updatePlayback();
  });

  if ('IntersectionObserver' in window) {
    const demoObserver = new IntersectionObserver(([entry]) => {
      isInView = entry.isIntersecting;
      updatePlayback();
    }, { threshold: 0.2 });

    demoObserver.observe(demo);
  } else {
    updatePlayback();
  }

  document.addEventListener('visibilitychange', updatePlayback);
})();
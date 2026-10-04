(() => {
  const section = document.getElementById('cta-zoom');
  if (!section) return;

  const stage = section.querySelector('.cta-zoom-stage');
  const map = section.querySelector('.cta-zoom-map');
  const sticky = section.querySelector('.cta-zoom-sticky');
  const caption = section.querySelector('.cta-zoom-caption');
  const finale = section.querySelector('.cta-zoom-finale');
  const focus = section.querySelector('[data-zoom-focus]');
  const months = [...section.querySelectorAll('.cta-zoom-month')];
  const pips = [...section.querySelectorAll('.cta-zoom-pips i')];
  const yearCount = section.querySelector('[data-zoom-year-count]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const captions = [
    'It starts with one week.',
    'Weeks add up to a month.',
    'Months add up to your year.'
  ];

  // Scroll progress (0-1) at which each item gets checked off as the camera pulls back.
  const weekSchedule = [
    [0.22, 0.06, 0.27, 0.32],
    [0.45, 0.49, 0.53, 0.57],
    [0.66, 0.7, 2, 2]
  ];
  const monthSchedule = [0.38, 0.61, 2];

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  let geometry = null;
  let currentLevel = -1;
  let captionTimer = 0;
  let ticking = false;

  const offsetWithin = (element, ancestor) => {
    let x = 0;
    let y = 0;
    let node = element;
    while (node && node !== ancestor) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent;
    }
    return { x, y };
  };

  const measure = () => {
    const mapWidth = map.offsetWidth;
    const mapHeight = map.offsetHeight;
    const stageWidth = stage.clientWidth;
    const stageHeight = stage.clientHeight;
    const enhanced = section.classList.contains('is-enhanced');
    // In the sticky layout the finale overlays the bottom of the stage, so the fully zoomed-out map must fit above it.
    const finaleSpace = enhanced ? finale.offsetHeight + 24 : 0;
    const fit = Math.min(1, (stageWidth - 48) / mapWidth, (stageHeight - finaleSpace - 40) / mapHeight);
    const focusOffset = offsetWithin(focus, map);
    const focusX = focusOffset.x + focus.offsetWidth / 2 - mapWidth / 2;
    const focusY = focusOffset.y + focus.offsetHeight / 2 - mapHeight / 2;
    const startZoom = clamp((Math.min(stageWidth, 760) * 0.5) / (focus.offsetWidth * fit), 1.8, 3);
    geometry = { fit, focusX, focusY, startZoom, finaleSpace };
  };

  const setLevel = (level) => {
    if (level === currentLevel) return;
    const firstRender = currentLevel === -1;
    currentLevel = level;
    section.dataset.level = String(level);
    section.style.setProperty('--zoom-level', String(level));
    window.clearTimeout(captionTimer);
    if (firstRender || reduceMotion.matches) {
      caption.textContent = captions[level];
      return;
    }
    caption.classList.add('is-swapping');
    captionTimer = window.setTimeout(() => {
      caption.textContent = captions[level];
      caption.classList.remove('is-swapping');
    }, 180);
  };

  const renderChecks = (progress) => {
    let completedMonths = 0;
    months.forEach((month, monthIndex) => {
      const weeks = month.querySelectorAll('.cta-zoom-week');
      let doneWeeks = 0;
      weeks.forEach((week, weekIndex) => {
        const done = progress >= weekSchedule[monthIndex][weekIndex];
        week.classList.toggle('is-done', done);
        if (done) doneWeeks += 1;
      });
      month.querySelector('.cta-zoom-bar i').style.setProperty('--fill', String(doneWeeks / weeks.length));
      const monthDone = progress >= monthSchedule[monthIndex];
      month.classList.toggle('is-done', monthDone);
      if (monthDone) completedMonths += 1;
    });
    pips.forEach((pip, index) => pip.classList.toggle('is-done', index < completedMonths));
    yearCount.textContent = String(completedMonths);
  };

  const render = () => {
    ticking = false;
    if (!geometry) measure();

    let progress = 1;
    if (section.classList.contains('is-enhanced')) {
      const rect = section.getBoundingClientRect();
      const stickyTop = parseFloat(getComputedStyle(sticky).top) || 0;
      const travel = section.offsetHeight - sticky.offsetHeight;
      progress = travel > 0 ? clamp((stickyTop - rect.top) / travel, 0, 1) : 1;
    }

    const zoomT = easeInOut(clamp((progress - 0.04) / 0.68, 0, 1));
    const zoom = Math.pow(geometry.startZoom, 1 - zoomT);
    const scale = geometry.fit * zoom;
    const pull = (zoom - 1) / (geometry.startZoom - 1 || 1);
    const tx = -geometry.focusX * scale * pull;
    const ty = -geometry.focusY * scale * pull - (geometry.finaleSpace / 2) * zoomT;
    if (section.classList.contains('is-enhanced')) {
      map.style.transform = `translate(-50%, -50%) translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${scale.toFixed(4)})`;
    } else {
      map.style.transform = '';
    }

    setLevel(progress < 0.2 ? 0 : progress < 0.5 ? 1 : 2);
    renderChecks(progress);
    section.classList.toggle('is-past-start', progress > 0.03);
    section.classList.toggle('is-finale', progress >= 0.76);
  };

  const requestRender = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(render);
  };

  const applyMode = () => {
    section.classList.toggle('is-enhanced', !reduceMotion.matches);
    geometry = null;
    currentLevel = -1;
    render();
  };

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', () => {
    geometry = null;
    requestRender();
  });
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', applyMode);

  applyMode();
})();

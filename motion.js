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
  const restart = document.querySelector('.journey-demo-restart');

  if (!demo || !toggle || !restart || prefersReducedMotion) return;

  const flow = demo.querySelector('.journey-flow');
  const yearCard = demo.querySelector('.journey-year');
  const yearEntry = yearCard.querySelector('.journey-year-entry');
  const yearCount = demo.querySelector('.journey-year-count');
  const yearFill = demo.querySelector('.journey-year-fill');
  const yearCheck = demo.querySelector('.journey-year-check');
  const quarterCard = demo.querySelector('.journey-quarter');
  const quarterRows = [...demo.querySelectorAll('.journey-month-item')];
  const quarterCount = demo.querySelector('.journey-quarter-count');
  const quarterFill = demo.querySelector('.journey-quarter-fill');
  const weeklyCard = demo.querySelector('.journey-weeks');
  const weeklyMonth = demo.querySelector('.journey-week-month');
  const weeklyCount = demo.querySelector('.journey-week-count');
  const weeklyFill = demo.querySelector('.journey-week-fill');
  const weeklyRows = [...demo.querySelectorAll('.journey-week-item')];
  const cursor = demo.querySelector('.journey-cursor');

  let isInView = !('IntersectionObserver' in window);
  let isPaused = false;
  let sequenceVersion = 0;

  const updatePlayback = () => {
    const shouldPlay = !isPaused && isInView && !document.hidden;
    demo.classList.toggle('is-playing', shouldPlay);
    demo.classList.toggle('is-paused', !shouldPlay);
  };

  toggle.hidden = false;
  restart.hidden = false;
  toggle.addEventListener('click', () => {
    isPaused = !isPaused;
    toggle.setAttribute('aria-pressed', String(isPaused));
    const label = isPaused ? 'Play sequence' : 'Pause sequence';
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    updatePlayback();
  });

  restart.addEventListener('click', () => {
    sequenceVersion += 1;
    isPaused = false;
    toggle.setAttribute('aria-pressed', 'false');
    toggle.setAttribute('aria-label', 'Pause sequence');
    toggle.title = 'Pause sequence';
    resetSequence();
    updatePlayback();
  });

  if ('IntersectionObserver' in window) {
    let hasStarted = false;
    const demoObserver = new IntersectionObserver(([entry]) => {
      const viewportHeight = entry.rootBounds ? entry.rootBounds.height : window.innerHeight;
      const fullyVisible = entry.intersectionRatio >= 0.98
        || entry.intersectionRect.height >= viewportHeight * 0.95;
      if (fullyVisible) hasStarted = true;
      isInView = fullyVisible || (hasStarted && entry.isIntersecting);
      updatePlayback();
    }, { threshold: Array.from({ length: 51 }, (_, i) => i / 50) });

    demoObserver.observe(demo);
  }

  updatePlayback();
  document.addEventListener('visibilitychange', updatePlayback);

  const wait = async (duration, version) => {
    let remaining = duration;

    while (remaining > 0) {
      if (version !== sequenceVersion) return false;

      if (!demo.classList.contains('is-playing')) {
        await new Promise(resolve => window.setTimeout(resolve, 80));
        continue;
      }

      const frameStart = performance.now();
      await new Promise(requestAnimationFrame);
      if (version === sequenceVersion && demo.classList.contains('is-playing')) {
        remaining -= performance.now() - frameStart;
      }
    }

    return version === sequenceVersion;
  };

  const waitUntilPlaying = async (version) => {
    while (version === sequenceVersion && !demo.classList.contains('is-playing')) {
      await new Promise(resolve => window.setTimeout(resolve, 80));
    }

    return version === sequenceVersion;
  };

  const moveCursor = async (target, version) => {
    if (!target || version !== sequenceVersion) return false;
    const demoRect = demo.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    cursor.style.setProperty('--cursor-x', `${targetRect.left - demoRect.left + targetRect.width / 2}px`);
    cursor.style.setProperty('--cursor-y', `${targetRect.top - demoRect.top + targetRect.height / 2}px`);
    cursor.classList.add('is-visible');
    return wait(85, version);
  };

  const clickTarget = async (target, action, version) => {
    if (!await moveCursor(target, version)) return false;
    if (!await waitUntilPlaying(version)) return false;
    cursor.classList.add('is-pressing');
    if (!await wait(30, version) || !await waitUntilPlaying(version)) {
      cursor.classList.remove('is-pressing');
      return false;
    }
    action();
    cursor.classList.remove('is-pressing');
    return wait(45, version);
  };

  const typeGoals = async (entries, texts, version) => {
    const copies = entries.map(entry => entry.querySelector('.journey-goal-copy'));
    copies.forEach(copy => { copy.textContent = ''; });
    if (!await moveCursor(entries[0], version)) return false;
    entries.forEach(entry => entry.classList.remove('is-skeleton'));
    const longest = Math.max(...texts.map(text => text.length));

    for (let index = 0; index < longest; index += 1) {
      if (!await wait(20, version) || !await waitUntilPlaying(version)) return false;
      copies.forEach((copy, i) => { copy.textContent = texts[i].slice(0, index + 1); });
    }

    return wait(38, version);
  };

  const clearEntry = (entry) => {
    entry.classList.add('is-skeleton');
    entry.querySelector('.journey-goal-copy').textContent = '';
  };

  const confettiColors = ['#dc4c3e', '#f2b84b', '#3fa66b', '#3d7bd9', '#9b59d0'];
  const launchConfetti = () => {
    const layer = document.createElement('span');
    layer.className = 'journey-confetti';
    layer.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 36; i += 1) {
      const piece = document.createElement('i');
      const angle = (15 + Math.random() * 60) * Math.PI / 180;
      const power = 160 + Math.random() * 180;
      piece.style.background = confettiColors[i % confettiColors.length];
      piece.style.setProperty('--dx', `${Math.cos(angle) * power}px`);
      piece.style.setProperty('--dy', `${-Math.sin(angle) * power}px`);
      piece.style.setProperty('--fall', `${60 + Math.random() * 120}px`);
      piece.style.setProperty('--spin', `${(Math.random() - 0.5) * 720}deg`);
      piece.style.animationDelay = `${Math.random() * 150}ms`;
      piece.style.animationDuration = `${1400 + Math.random() * 700}ms`;
      layer.append(piece);
    }
    yearCard.append(layer);
    window.setTimeout(() => layer.remove(), 2800);
  };

  const resetSequence = () => {
    yearCard.querySelectorAll('.journey-confetti').forEach(layer => layer.remove());
    flow.classList.remove('is-year-stage', 'is-quarter-stage');
    flow.classList.add('is-full-stage');
    cursor.classList.remove('is-visible', 'is-pressing');
    yearCard.classList.remove('is-current', 'is-complete');
    clearEntry(yearEntry);
    yearCount.textContent = '10 / 12 stories';
    yearFill.style.width = `${10 * 100 / 12}%`;
    yearCheck.classList.remove('is-complete');

    quarterRows.forEach((row) => {
      row.classList.remove('is-current', 'is-complete');
      clearEntry(row.querySelector('.journey-goal-entry'));
      row.querySelector('.journey-month-check').classList.remove('is-complete');
    });
    quarterCount.textContent = '0 / 3 months';
    quarterFill.style.width = '0%';

    weeklyRows.forEach((row) => {
      row.classList.remove('is-current', 'is-complete');
      clearEntry(row.querySelector('.journey-goal-entry'));
      row.querySelector('.journey-week-check').classList.remove('is-complete');
    });
    weeklyMonth.textContent = 'December';
    weeklyCount.textContent = '0 / 4 weeks';
    weeklyFill.style.width = '0%';
  };

  const monthGoals = ['Write story 10', 'Write story 11', 'Write story 12'];
  const weekGoals = ['Choose the story idea', 'Outline story 12', 'Draft story 12', 'Revise story 12'];

  const beat = 500;

  const runSequence = async () => {
    while (true) {
      const version = sequenceVersion;
      resetSequence();
      if (!await wait(400, version)) continue;

      yearCard.classList.add('is-current');
      if (!await typeGoals([yearEntry], ['Write 12 short stories'], version)) continue;
      if (!await wait(beat, version)) continue;
      yearCard.classList.remove('is-current');

      quarterCard.classList.add('is-current');
      const monthEntries = quarterRows.map(row => row.querySelector('.journey-goal-entry'));
      let typed = true;
      for (const [i, entry] of monthEntries.entries()) {
        if (!await typeGoals([entry], [monthGoals[i]], version)) { typed = false; break; }
      }
      if (!typed) continue;
      [0, 1].forEach((index) => {
        quarterRows[index].classList.add('is-complete');
        quarterRows[index].querySelector('.journey-month-check').classList.add('is-complete');
      });
      quarterCount.textContent = '2 / 3 months complete';
      quarterFill.style.width = `${200 / 3}%`;
      if (!await wait(beat, version)) continue;
      quarterCard.classList.remove('is-current');

      weeklyCard.classList.add('is-current');
      const weekEntries = weeklyRows.map(row => row.querySelector('.journey-goal-entry'));
      typed = true;
      for (const [i, entry] of weekEntries.entries()) {
        if (!await typeGoals([entry], [weekGoals[i]], version)) { typed = false; break; }
      }
      if (!typed) continue;

      let ok = true;
      for (const [weekIndex, row] of weeklyRows.entries()) {
        if (!await clickTarget(row.querySelector('.journey-week-check'), () => {
          row.classList.add('is-complete');
          row.querySelector('.journey-week-check').classList.add('is-complete');
        }, version)) { ok = false; break; }
        weeklyCount.textContent = `${weekIndex + 1} / 4 weeks`;
        weeklyFill.style.width = `${(weekIndex + 1) * 25}%`;
        if (!await wait(50, version)) { ok = false; break; }
      }
      if (!ok) continue;
      if (!await wait(beat, version)) continue;
      weeklyCard.classList.remove('is-current');

      const december = quarterRows[2];
      if (!await clickTarget(december.querySelector('.journey-month-check'), () => {
        december.classList.add('is-complete');
        december.querySelector('.journey-month-check').classList.add('is-complete');
        quarterCount.textContent = '3 / 3 months complete';
        quarterFill.style.width = '100%';
      }, version)) continue;
      if (!await wait(beat, version)) continue;

      if (!await clickTarget(yearCheck, () => {
        yearCard.classList.add('is-complete');
        yearCount.textContent = '12 / 12 stories';
        yearFill.style.width = '100%';
        yearCheck.classList.add('is-complete');
        launchConfetti();
      }, version)) continue;
      cursor.classList.remove('is-visible');
      if (!await wait(5000, version)) continue;
    }
  };

  resetSequence();
  runSequence();
})();

document.querySelectorAll('.js-learn-more').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector('.journey-demo');
    if (!target) return;
    event.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    history.replaceState(null, '', '#walkthrough');
  });
});

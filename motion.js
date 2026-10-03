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
  const yearState = demo.querySelector('.journey-year-state');
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
    toggle.textContent = isPaused ? 'Play sequence' : 'Pause sequence';
    updatePlayback();
  });

  restart.addEventListener('click', () => {
    sequenceVersion += 1;
    isPaused = false;
    toggle.setAttribute('aria-pressed', 'false');
    toggle.textContent = 'Pause sequence';
    resetSequence();
    updatePlayback();
  });

  if ('IntersectionObserver' in window) {
    const demoObserver = new IntersectionObserver(([entry]) => {
      isInView = entry.isIntersecting;
      updatePlayback();
    }, { threshold: 0.2 });

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
    return wait(170, version);
  };

  const clickTarget = async (target, action, version) => {
    if (!await moveCursor(target, version)) return false;
    if (!await waitUntilPlaying(version)) return false;
    cursor.classList.add('is-pressing');
    if (!await wait(55, version) || !await waitUntilPlaying(version)) {
      cursor.classList.remove('is-pressing');
      return false;
    }
    action();
    cursor.classList.remove('is-pressing');
    return wait(90, version);
  };

  const typeGoal = async (entry, text, version) => {
    const copy = entry.querySelector('.journey-goal-copy');
    entry.classList.remove('is-saved');
    copy.textContent = '';
    if (!await moveCursor(copy, version)) return false;
    entry.classList.remove('is-skeleton');

    for (const character of text) {
      if (!await wait(15, version) || !await waitUntilPlaying(version)) return false;
      copy.textContent += character;
    }

    return clickTarget(entry.querySelector('.journey-save'), () => entry.classList.add('is-saved'), version);
  };

  const resetSequence = () => {
    flow.classList.remove('is-quarter-stage', 'is-full-stage');
    flow.classList.add('is-year-stage');
    cursor.classList.remove('is-visible', 'is-pressing');
    yearCard.classList.remove('is-current', 'is-complete');
    quarterCard.classList.remove('is-current');
    weeklyCard.classList.remove('is-current');

    yearEntry.classList.add('is-skeleton');
    yearEntry.classList.remove('is-saved');
    yearCard.classList.remove('is-complete');
    yearEntry.querySelector('.journey-goal-copy').textContent = '';
    yearCount.textContent = '0 / 3 months';
    yearFill.style.width = '0%';
    yearState.textContent = 'In progress';
    yearCheck.classList.remove('is-complete');

    quarterRows.forEach((row) => {
      row.classList.remove('is-current', 'is-complete');
      row.querySelector('.journey-goal-entry').classList.add('is-skeleton');
      row.querySelector('.journey-goal-entry').classList.remove('is-saved');
      row.querySelector('.journey-goal-copy').textContent = '';
      row.querySelector('.journey-month-check').classList.remove('is-complete');
    });
    quarterCount.textContent = '0 / 3 months';
    quarterFill.style.width = '0%';

    weeklyRows.forEach((row) => {
      row.classList.remove('is-current', 'is-complete');
      row.querySelector('.journey-goal-entry').classList.add('is-skeleton');
      row.querySelector('.journey-goal-entry').classList.remove('is-saved');
      row.querySelector('.journey-goal-copy').textContent = '';
      row.querySelector('.journey-week-check').classList.remove('is-complete');
    });
    weeklyMonth.textContent = 'October';
    weeklyCount.textContent = '0 / 4 weeks';
    weeklyFill.style.width = '0%';
  };

  const months = [
    {
      name: 'October',
      goal: 'Write story 10',
      weeks: ['Choose the story idea', 'Outline story 10', 'Draft story 10', 'Revise story 10']
    },
    {
      name: 'November',
      goal: 'Write story 11',
      weeks: ['Choose the story idea', 'Outline story 11', 'Draft story 11', 'Revise story 11']
    },
    {
      name: 'December',
      goal: 'Write story 12',
      weeks: ['Choose the story idea', 'Outline story 12', 'Draft story 12', 'Revise story 12']
    }
  ];

  const runSequence = async () => {
    while (true) {
      const version = sequenceVersion;
      resetSequence();
      if (!await wait(250, version)) continue;
      if (!await typeGoal(yearEntry, 'Write 12 short stories', version)) continue;
      yearCard.classList.add('is-current');

      flow.classList.remove('is-year-stage');
      flow.classList.add('is-quarter-stage');
      if (!await wait(180, version)) continue;

      for (const [monthIndex, month] of months.entries()) {
        if (version !== sequenceVersion) break;
        const row = quarterRows[monthIndex];
        row.classList.add('is-current');
        if (!await typeGoal(row.querySelector('.journey-goal-entry'), month.goal, version)) break;
        row.classList.remove('is-current');
      }
      if (version !== sequenceVersion) continue;
      yearCard.classList.remove('is-current');

      flow.classList.remove('is-quarter-stage');
      flow.classList.add('is-full-stage');

      let completedMonths = 0;
      for (const [monthIndex, month] of months.entries()) {
        if (version !== sequenceVersion) break;
        const monthRow = quarterRows[monthIndex];
        weeklyMonth.textContent = month.name;
        monthRow.classList.add('is-current');
        weeklyRows.forEach((row) => {
          row.classList.remove('is-current', 'is-complete');
          row.querySelector('.journey-goal-entry').classList.add('is-skeleton');
          row.querySelector('.journey-goal-entry').classList.remove('is-saved');
          row.querySelector('.journey-goal-copy').textContent = '';
          row.querySelector('.journey-week-check').classList.remove('is-complete');
        });
        weeklyCount.textContent = '0 / 4 weeks';
        weeklyFill.style.width = '0%';

        if (!await wait(180, version)) break;
        for (const [weekIndex, row] of weeklyRows.entries()) {
          if (version !== sequenceVersion) break;
          row.classList.add('is-current');
          if (!await typeGoal(row.querySelector('.journey-goal-entry'), month.weeks[weekIndex], version)) break;
          row.classList.remove('is-current');
        }
        if (version !== sequenceVersion) break;

        for (const [weekIndex, row] of weeklyRows.entries()) {
          if (!await clickTarget(row.querySelector('.journey-week-check'), () => row.classList.add('is-complete'), version)) break;
          weeklyCount.textContent = `${weekIndex + 1} / 4 weeks complete`;
          weeklyFill.style.width = `${(weekIndex + 1) * 25}%`;
        }
        if (version !== sequenceVersion) break;

        if (!await clickTarget(monthRow.querySelector('.journey-month-check'), () => monthRow.classList.add('is-complete'), version)) break;
        monthRow.classList.remove('is-current');
        completedMonths += 1;
        quarterCount.textContent = `${completedMonths} / 3 months complete`;
        quarterFill.style.width = `${completedMonths * 100 / 3}%`;
        yearCount.textContent = `${completedMonths} / 3 months`;
        yearFill.style.width = `${completedMonths * 100 / 3}%`;
        yearState.textContent = `${completedMonths} of 3 months complete`;
        if (!await wait(180, version)) break;
      }
      if (version !== sequenceVersion) continue;

      if (!await clickTarget(yearCheck, () => {
        yearCard.classList.add('is-complete');
        yearCount.textContent = '3 / 3 months';
        yearFill.style.width = '100%';
        yearState.textContent = 'Year goal complete';
        yearCheck.classList.add('is-complete');
      }, version)) continue;
      cursor.classList.remove('is-visible');
      if (!await wait(800, version)) continue;
    }
  };

  resetSequence();
  runSequence();
})();
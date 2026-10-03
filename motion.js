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

  const updatePlayback = () => {
    demo.classList.add('is-playing');
    demo.classList.toggle('is-paused', isPaused || !isInView || document.hidden);
  };

  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    isPaused = !isPaused;
    toggle.setAttribute('aria-pressed', String(isPaused));
    toggle.textContent = isPaused ? 'Play sequence' : 'Pause sequence';
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

  const wait = async (duration) => {
    let remaining = duration;

    while (remaining > 0) {
      if (!demo.classList.contains('is-playing')) {
        await new Promise(resolve => window.setTimeout(resolve, 80));
        continue;
      }

      const frameStart = performance.now();
      await new Promise(requestAnimationFrame);
      if (demo.classList.contains('is-playing')) {
        remaining -= performance.now() - frameStart;
      }
    }
  };

  const moveCursor = async (target) => {
    if (!target) return;
    const demoRect = demo.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    cursor.style.setProperty('--cursor-x', `${targetRect.left - demoRect.left + targetRect.width / 2}px`);
    cursor.style.setProperty('--cursor-y', `${targetRect.top - demoRect.top + targetRect.height / 2}px`);
    cursor.classList.add('is-visible');
    await wait(360);
  };

  const clickTarget = async (target, action) => {
    await moveCursor(target);
    cursor.classList.add('is-pressing');
    await wait(110);
    action();
    cursor.classList.remove('is-pressing');
    await wait(200);
  };

  const typeGoal = async (entry, text) => {
    const copy = entry.querySelector('.journey-goal-copy');
    entry.classList.remove('is-saved');
    copy.textContent = '';
    await moveCursor(copy);

    for (const character of text) {
      await wait(24);
      copy.textContent += character;
    }

    await clickTarget(entry.querySelector('.journey-save'), () => entry.classList.add('is-saved'));
  };

  const resetSequence = () => {
    flow.classList.remove('is-quarter-stage', 'is-full-stage');
    flow.classList.add('is-year-stage');
    quarterCard.hidden = true;
    weeklyCard.hidden = true;
    cursor.classList.remove('is-visible', 'is-pressing');

    yearEntry.classList.remove('is-saved');
    yearCard.classList.remove('is-complete');
    yearEntry.querySelector('.journey-goal-copy').textContent = '';
    yearCount.textContent = '9 / 12 stories';
    yearFill.style.width = '75%';
    yearState.textContent = '9 stories complete';
    yearCheck.classList.remove('is-complete');

    quarterRows.forEach((row) => {
      row.classList.remove('is-current', 'is-complete');
      row.querySelector('.journey-goal-entry').classList.remove('is-saved');
      row.querySelector('.journey-goal-copy').textContent = '';
      row.querySelector('.journey-month-check').classList.remove('is-complete');
    });
    quarterCount.textContent = '0 / 3 months';
    quarterFill.style.width = '0%';

    weeklyRows.forEach((row) => {
      row.classList.remove('is-current', 'is-complete');
      row.querySelector('.journey-goal-entry').classList.remove('is-saved');
      row.querySelector('.journey-goal-copy').textContent = '';
      row.querySelector('.journey-week-check').classList.remove('is-complete');
    });
    weeklyCount.textContent = '0 / 4 weeks';
    weeklyFill.style.width = '0%';
  };

  const months = [
    {
      name: 'October',
      goal: 'Write story 10',
      weeks: ['Choose the story idea', 'Outline the story', 'Write the first draft', 'Revise and submit']
    },
    {
      name: 'November',
      goal: 'Write story 11',
      weeks: ['Choose the story idea', 'Outline the story', 'Write the first draft', 'Revise and submit']
    },
    {
      name: 'December',
      goal: 'Write story 12',
      weeks: ['Choose the story idea', 'Outline the story', 'Write the first draft', 'Revise and submit']
    }
  ];

  const runSequence = async () => {
    while (true) {
      resetSequence();
      await wait(450);
      await typeGoal(yearEntry, 'Write 12 short stories');

      quarterCard.hidden = false;
      flow.classList.remove('is-year-stage');
      flow.classList.add('is-quarter-stage');
      await wait(350);

      for (const [monthIndex, month] of months.entries()) {
        const row = quarterRows[monthIndex];
        row.classList.add('is-current');
        await typeGoal(row.querySelector('.journey-goal-entry'), month.goal);
        row.classList.remove('is-current');
      }

      weeklyCard.hidden = false;
      flow.classList.remove('is-quarter-stage');
      flow.classList.add('is-full-stage');

      let completedMonths = 0;
      for (const [monthIndex, month] of months.entries()) {
        const monthRow = quarterRows[monthIndex];
        weeklyMonth.textContent = month.name;
        monthRow.classList.add('is-current');
        weeklyRows.forEach((row) => {
          row.classList.remove('is-saved', 'is-complete');
          row.querySelector('.journey-goal-entry').classList.remove('is-saved');
          row.querySelector('.journey-goal-copy').textContent = '';
          row.querySelector('.journey-week-check').classList.remove('is-complete');
        });
        weeklyCount.textContent = '0 / 4 weeks';
        weeklyFill.style.width = '0%';

        await wait(350);
        for (const [weekIndex, row] of weeklyRows.entries()) {
          row.classList.add('is-current');
          await typeGoal(row.querySelector('.journey-goal-entry'), month.weeks[weekIndex]);
          row.classList.remove('is-current');
        }

        for (const [weekIndex, row] of weeklyRows.entries()) {
          await clickTarget(row.querySelector('.journey-week-check'), () => row.classList.add('is-complete'));
          weeklyCount.textContent = `${weekIndex + 1} / 4 weeks complete`;
          weeklyFill.style.width = `${(weekIndex + 1) * 25}%`;
        }

        await clickTarget(monthRow.querySelector('.journey-month-check'), () => monthRow.classList.add('is-complete'));
        monthRow.classList.remove('is-current');
        completedMonths += 1;
        quarterCount.textContent = `${completedMonths} / 3 months complete`;
        quarterFill.style.width = `${completedMonths * 100 / 3}%`;
        const completedStories = 9 + completedMonths;
        yearCount.textContent = `${completedStories} / 12 stories`;
        yearFill.style.width = `${completedStories * 100 / 12}%`;
        yearState.textContent = `${completedStories} stories complete`;
        await wait(400);
      }

      await clickTarget(yearCheck, () => {
        yearCard.classList.add('is-complete');
        yearCount.textContent = '12 / 12 stories';
        yearFill.style.width = '100%';
        yearState.textContent = 'Year goal complete';
        yearCheck.classList.add('is-complete');
      });
      cursor.classList.remove('is-visible');
      await wait(1800);
    }
  };

  runSequence();
})();
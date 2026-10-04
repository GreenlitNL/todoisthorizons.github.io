(() => {
  const section = document.getElementById('cta-goal');
  if (!section) return;

  const panel = section.querySelector('.cta-goal-panel');
  const form = section.querySelector('.cta-goal-form');
  const input = section.querySelector('#cta-goal-input');
  const chips = section.querySelectorAll('.cta-goal-chip');
  const plan = section.querySelector('.cta-goal-plan');
  const yearText = section.querySelector('.cta-goal-year-text');
  const yearCount = section.querySelector('[data-goal-year-count]');
  const yearBar = section.querySelector('[data-goal-year-bar]');
  const monthList = section.querySelector('.cta-goal-months');
  const weekList = section.querySelector('.cta-goal-weeks');
  const weekCount = section.querySelector('[data-goal-week-count]');
  const firstMonthLabel = section.querySelector('[data-goal-first-month]');
  const message = section.querySelector('.cta-goal-message');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const MAX_LENGTH = 60;
  const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 12.5 3.2 3.2L17 9"></path></svg>';

  const templates = [
    {
      match: /\b(run|running|marathon|5k|10k|half|jog|race|triathlon|cycle|cycling|swim)\b/i,
      months: ['Build a steady base', 'Add the long sessions', 'Peak, taper and race'],
      weeks: ['Get the right gear', 'Train three times', 'First long session', 'Easy recovery week']
    },
    {
      match: /\b(write|writing|book|novel|blog|story|stories|poem|poems|screenplay|newsletter)\b/i,
      months: ['Outline the whole thing', 'Write the first draft', 'Edit and polish'],
      weeks: ['Pick the core idea', 'Sketch the main characters', 'Outline every chapter', 'Write the opening page']
    },
    {
      match: /\b(learn|speak|language|spanish|french|german|italian|dutch|japanese|chinese|korean|portuguese|arabic|guitar|piano|code|coding|program)\b/i,
      months: ['Master the basics', 'Practise every day', 'Use it for real'],
      weeks: ['Pick a course or teacher', 'Practise 15 minutes a day', 'Learn the first 100 essentials', 'Book a first real session']
    },
    {
      match: /(save|saving|money|budget|debt|invest|€|\$|£|emergency fund)/i,
      months: ['Map where money goes', 'Cut and automate', 'Grow the buffer'],
      weeks: ['Track every expense', 'Cancel unused subscriptions', 'Set up an automatic transfer', 'Review the month\u2019s spending']
    },
    {
      match: /\b(launch|start|business|side project|startup|app|shop|store|company|product|podcast|channel)\b/i,
      months: ['Validate the idea', 'Build the first version', 'Launch to first users'],
      weeks: ['Talk to five potential users', 'Write down the core problem', 'Sketch the simplest solution', 'Pick a name and domain']
    },
    {
      match: /\b(fit|fitness|gym|stronger|strength|weight|lose|kg|lbs|health|healthy|yoga|workout|muscle|pull-?ups?|push-?ups?)\b/i,
      months: ['Build the habit', 'Increase the intensity', 'Make it stick'],
      weeks: ['Choose a weekly schedule', 'Work out three times', 'Prep healthy meals', 'Track progress and rest']
    },
    {
      match: /\b(read|reading|books)\b/i,
      months: ['Build a reading habit', 'Explore new genres', 'Finish strong'],
      weeks: ['Make a reading list', 'Read 20 minutes a day', 'Finish the first book', 'Share a favourite passage']
    }
  ];

  const fallback = {
    months: ['Lay the foundation', 'Build momentum', 'Make it real'],
    weeks: ['Define what done looks like', 'Break it into first steps', 'Block time in your calendar', 'Review and adjust']
  };

  let runId = 0;
  let celebrated = false;

  const wait = (ms) => new Promise(resolve => window.setTimeout(resolve, reduceMotion.matches ? 0 : ms));

  const cleanGoal = (raw) => {
    const text = String(raw || '')
      .replace(/[\u0000-\u001f\u007f<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_LENGTH);
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
  };

  const upcomingMonths = () => {
    const formatter = new Intl.DateTimeFormat('en', { month: 'long' });
    const now = new Date();
    return [1, 2, 3].map(offset => formatter.format(new Date(now.getFullYear(), now.getMonth() + offset, 1)));
  };

  const makeCheck = () => {
    const check = document.createElement('span');
    check.className = 'cta-goal-check';
    check.innerHTML = CHECK_SVG;
    return check;
  };

  const updateProgress = () => {
    const weeks = [...weekList.querySelectorAll('.cta-goal-week')];
    const done = weeks.filter(week => week.classList.contains('is-done')).length;
    weekCount.textContent = String(done);
    const firstMonth = monthList.firstElementChild;
    const monthDone = weeks.length > 0 && done === weeks.length;
    if (firstMonth) firstMonth.classList.toggle('is-done', monthDone);
    yearCount.textContent = monthDone ? '1' : '0';
    yearBar.style.width = `${(done / Math.max(weeks.length, 1)) * 100 / 3}%`;

    if (monthDone && !celebrated) {
      celebrated = true;
      section.classList.add('is-celebrating');
      message.textContent = 'Month one, done. Imagine a whole year like this.';
      launchConfetti();
    } else if (!monthDone && celebrated) {
      celebrated = false;
      section.classList.remove('is-celebrating');
      message.textContent = 'Tap a weekly goal to check it off.';
    } else if (!monthDone && done > 0) {
      message.textContent = `${weeks.length - done} more to finish ${firstMonthLabel.textContent}.`;
    }
  };

  const confettiColors = ['#ffffff', '#f2b84b', '#3fa66b', '#3d7bd9', '#9b59d0', '#ffd7d1'];
  const launchConfetti = () => {
    if (reduceMotion.matches) return;
    const layer = document.createElement('span');
    layer.className = 'cta-goal-confetti';
    layer.setAttribute('aria-hidden', 'true');
    [false, true].forEach(fromRight => {
      for (let i = 0; i < 40; i += 1) {
        const piece = document.createElement('i');
        const angle = (35 + Math.random() * 45) * Math.PI / 180;
        const power = 260 + Math.random() * 260;
        const dx = Math.cos(angle) * power * (fromRight ? -1 : 1);
        piece.style[fromRight ? 'right' : 'left'] = '24px';
        piece.style.background = confettiColors[i % confettiColors.length];
        piece.style.setProperty('--dx', `${dx}px`);
        piece.style.setProperty('--dy', `${-Math.sin(angle) * power}px`);
        piece.style.setProperty('--fall', `${120 + Math.random() * 160}px`);
        piece.style.setProperty('--spin', `${(Math.random() - 0.5) * 900}deg`);
        piece.style.animationDelay = `${Math.random() * 180}ms`;
        piece.style.animationDuration = `${1600 + Math.random() * 900}ms`;
        layer.append(piece);
      }
    });
    panel.append(layer);
    window.setTimeout(() => layer.remove(), 3000);
  };

  const typeInto = async (element, text, id) => {
    element.textContent = '';
    element.classList.add('is-typing');
    if (reduceMotion.matches) {
      element.textContent = text;
    } else {
      const perChar = Math.max(14, Math.min(32, 700 / text.length));
      for (const char of text) {
        if (id !== runId) return false;
        element.textContent += char;
        await wait(perChar);
      }
    }
    element.classList.remove('is-typing');
    return id === runId;
  };

  const buildPlan = async (goal) => {
    const id = ++runId;
    const template = templates.find(item => item.match.test(goal)) || fallback;
    const monthNames = upcomingMonths();

    celebrated = false;
    section.classList.remove('is-celebrating');
    section.classList.add('is-planned');
    monthList.replaceChildren();
    weekList.replaceChildren();
    weekCount.textContent = '0';
    yearCount.textContent = '0';
    yearBar.style.width = '0%';
    firstMonthLabel.textContent = monthNames[0];
    message.textContent = '';
    plan.hidden = false;
    panel.querySelectorAll('.cta-goal-confetti').forEach(layer => layer.remove());

    const yearCard = section.querySelector('.cta-goal-year');
    yearCard.classList.remove('cta-goal-pop');
    void yearCard.offsetWidth;
    yearCard.classList.add('cta-goal-pop');

    if (!(await typeInto(yearText, goal, id))) return;
    await wait(160);

    for (let i = 0; i < template.months.length; i += 1) {
      if (id !== runId) return;
      const item = document.createElement('li');
      item.className = 'cta-goal-pop';
      const label = document.createElement('small');
      label.textContent = monthNames[i];
      const title = document.createElement('span');
      title.textContent = template.months[i];
      item.append(label, title, makeCheck());
      monthList.append(item);
      await wait(140);
    }

    await wait(120);
    for (let i = 0; i < template.weeks.length; i += 1) {
      if (id !== runId) return;
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cta-goal-week cta-goal-pop';
      button.setAttribute('aria-pressed', 'false');
      const text = document.createElement('span');
      text.textContent = template.weeks[i];
      button.append(text, makeCheck());
      button.addEventListener('click', () => {
        const done = !button.classList.contains('is-done');
        button.classList.toggle('is-done', done);
        button.setAttribute('aria-pressed', String(done));
        updateProgress();
      });
      item.append(button);
      weekList.append(item);
      await wait(120);
    }

    if (id === runId) message.textContent = 'Tap a weekly goal to check it off.';
  };

  const submitGoal = (raw) => {
    const goal = cleanGoal(raw);
    if (!goal) {
      form.classList.remove('is-shaking');
      void form.offsetWidth;
      form.classList.add('is-shaking');
      input.focus();
      return;
    }
    input.value = goal;
    buildPlan(goal);
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitGoal(input.value);
  });

  form.addEventListener('animationend', () => form.classList.remove('is-shaking'));

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      input.value = chip.textContent;
      submitGoal(chip.textContent);
    });
  });
})();

(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.contact-status');

  const setStatus = (message, state) => {
    status.textContent = message;
    status.dataset.state = state || '';
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const originalLabel = submitButton.textContent;
    submitButton.textContent = 'Sending…';
    submitButton.disabled = true;
    setStatus('', '');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        form.reset();
        setStatus('Thanks! Your message has been sent. We\u2019ll get back to you soon.', 'success');
      } else {
        setStatus(data.message || 'Your message couldn\u2019t be sent. Please try again.', 'error');
      }
    } catch (error) {
      setStatus('Something went wrong. Check your connection and try again.', 'error');
    } finally {
      submitButton.textContent = originalLabel;
      submitButton.disabled = false;
    }
  });
})();

(() => {
  if (window.__xpXeroLoaded) return;
  window.__xpXeroLoaded = true;

  const { q, qa, clean, text } = window.XP;

  function getFieldValue(block) {
    const mail = q("a[href^='mailto:']", block);
    if (mail) return clean(text(mail));

    const candidates = qa('span', block)
      .map(el => clean(text(el)))
      .filter(Boolean);

    if (candidates.length) return candidates[candidates.length - 1];
    return clean(text(block));
  }

  function buildPayload() {
    const contact = {
      name: clean(text(q('h1.cnt-ContactHeader__title'))),
      primaryPerson: '',
      email: '',
      phone: '',
      invoiceReminders: '',
      billingAddress: ''
    };

    const detailBlocks = qa('.cnt-ContactHeaderDetails .xui-margin-right-small');

    for (const block of detailBlocks) {
      const title = clean(text(q('title', block)));
      const value = getFieldValue(block);
      const fullText = clean(text(block));

      if (title === 'Primary person') contact.primaryPerson = value;
      else if (title === 'Email') contact.email = value;
      else if (title === 'Phone number') contact.phone = value;
      else if (title === 'Billing address') contact.billingAddress = value;
      else if (/^Invoice reminders:/i.test(fullText)) {
        contact.invoiceReminders = fullText.replace(/^.*Invoice reminders:\s*/i, '');
      }
    }

    if (!contact.email) {
      contact.email = clean(text(q("a[href^='mailto:']")));
    }

    let lastAcceptedQuoteNumber = '';
    const rows = qa('table.xui-readonlytable tbody tr');

    for (const row of rows) {
      const cells = qa('td', row);
      if (cells.length < 8) continue;

      const type = clean(text(cells[0]));
      const number = clean(text(cells[1]));
      const status = clean(text(q('.xui-tagcontent', row)) || text(cells[7]));

      if (type === 'Quote' && status === 'Accepted') {
        lastAcceptedQuoteNumber = number;
        break;
      }
    }

    return { contact, lastAcceptedQuoteNumber };
  }

  async function copyPayload(button) {
    const payload = buildPayload();
    await window.XP.setStoredPayload(payload);

    const json = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(json);
    } catch (e) {
      // Storage is the important part. Clipboard is a bonus.
      console.warn('Clipboard write failed', e);
    }

    console.log('Saved Xero payload', payload);
    const old = button.textContent;
    button.textContent = 'Copied';
    setTimeout(() => {
      button.textContent = old;
    }, 1200);
  }

  function injectButton() {
    const isContactPage = /\/contacts\/contact\//.test(location.href);
    if (!isContactPage) return;

    const actions = q('.xui-pageheading--actions .xui-actions');
    if (!actions) return;
    if (q('[data-copy-contact-details="true"]', actions)) return;

    const editBtn = q('button[data-automationid="CONTACT_HEADER_ACTIONS_EDIT"]', actions)
      || qa('button', actions).find(b => clean(text(b)) === 'Edit');

    if (!editBtn) return;

    const copyBtn = editBtn.cloneNode(true);
    copyBtn.setAttribute('data-copy-contact-details', 'true');
    copyBtn.type = 'button';
    copyBtn.textContent = 'Copy Contact Details';
    copyBtn.disabled = false;
    copyBtn.removeAttribute('disabled');
    copyBtn.setAttribute('aria-disabled', 'false');

    copyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await copyPayload(copyBtn);
      } catch (err) {
        console.error(err);
        alert('Failed to save Xero contact details');
      }
    });

    editBtn.insertAdjacentElement('afterend', copyBtn);
  }

  window.XP.observe(injectButton);
})();

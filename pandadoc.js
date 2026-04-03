(() => {
  if (window.__xpPandaLoaded) return;
  window.__xpPandaLoaded = true;

  startWatcher();

  function startWatcher() {
    setInterval(() => {
      injectInviteButton();
      handleRecipientDialog();
    }, 800);
  }

  // ----------------------------
  // FIND + INJECT BUTTON (robust)
  // ----------------------------
  function injectInviteButton() {
    const inviteBtn = findInviteButton();
    if (!inviteBtn) return;

    const parent = inviteBtn.parentElement;
    if (!parent) return;

    if (parent.querySelector('[data-fill-from-xero]')) return;

    const fillBtn = inviteBtn.cloneNode(true);

    fillBtn.setAttribute('data-fill-from-xero', 'true');
    fillBtn.disabled = false;
    fillBtn.removeAttribute('disabled');

    // Fix text
    const label = fillBtn.querySelector('span:not(:has(svg))');
    if (label) label.textContent = 'Fill from Xero';
    else fillBtn.textContent = 'Fill from Xero';

    fillBtn.onclick = async () => {
      const payload = await XP.getStoredPayload();

      if (!payload) {
        XP.showToast('No Xero data found', 'error');
        return;
      }

      fillDocument(payload);
      XP.showToast('Filled from Xero', 'success');
    };

    inviteBtn.insertAdjacentElement('afterend', fillBtn);

    console.log('[XP] Button injected');
  }

  // ----------------------------
  // BETTER FINDER (THIS WAS YOUR ISSUE)
  // ----------------------------
  function findInviteButton() {
    // Try multiple ways, PandaDoc changes classes like socks
    return (
      document.querySelector('button[data-testid="invite_collaborator_btn"]') ||
      Array.from(document.querySelectorAll('button')).find(b =>
        XP.text(b).toLowerCase().includes('invite')
      )
    );
  }

  // ----------------------------
  // FILL DOCUMENT FIELDS
  // ----------------------------
  function fillDocument(payload) {
    const mappings = [
      { p: 'Homeowner Full Name', s: 'contact.primaryPersonOrName' },
      { p: '+353 89 123 4567', s: 'contact.phone' },
      { p: 'hello@email.com', s: 'contact.email' },
      { p: 'Site Address', s: 'contact.billingAddress' },
      { p: 'Eircode', s: 'contact.eircode' },
      { p: 'QU-0000', s: 'lastAcceptedQuoteNumber' }
    ];

    mappings.forEach(({ p, s }) => {
      const el = document.querySelector(
        `textarea[placeholder="${p}"], input[placeholder="${p}"]`
      );

      const value = XP.getValueFromPayload(payload, s);

      XP.setField(el, value);
    });
  }

  // ----------------------------
  // HANDLE RECIPIENT MODAL
  // ----------------------------
  function handleRecipientDialog() {
    const dialog = Array.from(document.querySelectorAll('[role="dialog"]'))
      .find(d => d.textContent.includes('Create new recipient'));

    if (!dialog) return;

    if (dialog.querySelector('[data-fill-recipient]')) return;

    const actions = dialog.querySelector('[class*="ActionsPrimary"]');
    if (!actions) return;

    const btn = document.createElement('button');
    btn.textContent = 'Fill from Xero';
    btn.setAttribute('data-fill-recipient', 'true');

    Object.assign(btn.style, {
      marginRight: '8px',
      padding: '8px 12px',
      borderRadius: '8px',
      border: '1px solid #ccc',
      background: '#f8f9fb',
      cursor: 'pointer'
    });

    btn.onclick = async () => {
      const payload = await XP.getStoredPayload();

      if (!payload) {
        XP.showToast('No Xero data found', 'error');
        return;
      }

      fillRecipient(dialog, payload);
      XP.showToast('Recipient filled', 'success');
    };

    actions.prepend(btn);
  }

  // ----------------------------
  // FILL RECIPIENT FORM
  // ----------------------------
  function fillRecipient(dialog, payload) {
    const fullName = XP.getValueFromPayload(payload, 'contact.primaryPersonOrName');
    const email = XP.getValueFromPayload(payload, 'contact.email');
    const phone = XP.getValueFromPayload(payload, 'contact.phone');

    const { firstName, lastName } = XP.splitName(fullName);

    const firstNameInput = dialog.querySelector('input[name="firstName"]');
    const lastNameInput = dialog.querySelector('input[name="lastName"]');
    const emailInput = dialog.querySelector('input[name^="searchField"]');
    const phoneInput = dialog.querySelector('input[name="phone"]');

    XP.setField(firstNameInput, firstName);
    XP.setField(lastNameInput, lastName);
    XP.setField(emailInput, email);
    XP.setField(phoneInput, phone);
  }
})();
(() => {
  if (window.__xpPandaLoaded) return;
  window.__xpPandaLoaded = true;

  console.log('[XP] pandadoc.js loaded', location.href);

  function init() {
    XP.observe(() => {
      injectInviteFillButton();
      injectRecipientFillButton();
      // injectFloatingFillButton();
    });
  }

  function injectInviteFillButton() {
    const inviteBtn =
      document.querySelector('button[data-testid="invite_collaborator_btn"]') ||
      Array.from(document.querySelectorAll('button')).find(
        (b) => XP.clean(b.textContent) === 'Invite'
      );

    if (!inviteBtn) return;

    const parent = inviteBtn.parentElement;
    if (!parent) return;

    if (parent.querySelector('[data-xp-fill-doc-btn="true"]')) return;

    const fillBtn = document.createElement('button');
    fillBtn.type = 'button';
    fillBtn.className = inviteBtn.className;
    fillBtn.setAttribute('data-xp-fill-doc-btn', 'true');
    fillBtn.disabled = false;
    fillBtn.removeAttribute('disabled');
    fillBtn.setAttribute('aria-disabled', 'false');
    fillBtn.style.pointerEvents = 'auto';
    fillBtn.style.opacity = '1';

    fillBtn.innerHTML = inviteBtn.innerHTML;

    const textNode = Array.from(fillBtn.querySelectorAll('span')).find(
      (span) => !span.querySelector('svg')
    );

    if (textNode) {
      textNode.textContent = 'Fill from Xero';
    } else {
      fillBtn.textContent = 'Fill from Xero';
    }

    fillBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const payload = await XP.getStoredPayload();

      if (!payload) {
        XP.showToast('No saved Xero data found', 'error');
        return;
      }

      const settings = await XP.getSettings();
      fillDocumentFields(payload, settings);

      XP.showToast('Document filled from Xero', 'success', settings.toastSeconds);
    });

    inviteBtn.insertAdjacentElement('afterend', fillBtn);
  }

  function injectRecipientFillButton() {
    const dialog = Array.from(document.querySelectorAll('[role="dialog"]')).find(
      (d) => XP.clean(d.textContent).includes('Create new recipient')
    );

    if (!dialog) return;
    if (dialog.querySelector('[data-xp-fill-recipient-btn="true"]')) return;

    const createBtn = Array.from(dialog.querySelectorAll('button')).find(
      (b) => XP.clean(b.textContent) === 'Create'
    );

    if (!createBtn) return;

    const createBtnWrapper = createBtn.parentElement;
    if (!createBtnWrapper) return;

    const fillBtn = document.createElement('button');
    fillBtn.type = 'button';
    fillBtn.className = createBtn.className;
    fillBtn.setAttribute('data-xp-fill-recipient-btn', 'true');
    fillBtn.disabled = false;
    fillBtn.removeAttribute('disabled');
    fillBtn.setAttribute('aria-disabled', 'false');
    fillBtn.style.pointerEvents = 'auto';
    fillBtn.style.opacity = '1';
    fillBtn.textContent = 'Fill from Xero';

    fillBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const payload = await XP.getStoredPayload();

      if (!payload) {
        XP.showToast('No saved Xero data found', 'error');
        return;
      }

      fillRecipientDialog(dialog, payload);

      const settings = await XP.getSettings();
      XP.showToast('Recipient filled from Xero', 'success', settings.toastSeconds);
    });

    createBtnWrapper.before(fillBtn);
  }

  function injectFloatingFillButton() {
    if (document.querySelector('#xp-floating-fill-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'xp-floating-fill-btn';
    btn.type = 'button';
    btn.textContent = 'Fill from Xero';

    Object.assign(btn.style, {
      position: 'fixed',
      right: '20px',
      bottom: '20px',
      zIndex: '2147483647',
      padding: '12px 16px',
      border: 'none',
      borderRadius: '10px',
      background: '#2563eb',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '600',
      lineHeight: '1',
      cursor: 'pointer',
      boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
      pointerEvents: 'auto'
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#1d4ed8';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.background = '#2563eb';
    });

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const payload = await XP.getStoredPayload();

      if (!payload) {
        XP.showToast('No saved Xero data found', 'error');
        return;
      }

      const settings = await XP.getSettings();

      const dialog = Array.from(document.querySelectorAll('[role="dialog"]')).find(
        (d) => XP.clean(d.textContent).includes('Create new recipient')
      );

      if (dialog) {
        fillRecipientDialog(dialog, payload);
        XP.showToast('Recipient filled from Xero', 'success', settings.toastSeconds);
        return;
      }

      fillDocumentFields(payload, settings);
      XP.showToast('Document filled from Xero', 'success', settings.toastSeconds);
    });

    const mount = document.body || document.documentElement;
    if (mount) {
      mount.appendChild(btn);
    }
  }

  function fillRecipientDialog(dialog, payload) {
    const fullName = XP.getValueFromPayload(payload, 'contact.primaryPersonOrName');
    const email = XP.getValueFromPayload(payload, 'contact.email');
    const phone = XP.getValueFromPayload(payload, 'contact.phone');

    const { firstName, lastName } = XP.splitName(fullName);

    const firstNameInput = dialog.querySelector('input[name="firstName"]');
    const lastNameInput = dialog.querySelector('input[name="lastName"]');
    const emailInput =
      dialog.querySelector('input[name^="searchField"]') ||
      Array.from(dialog.querySelectorAll('input')).find((i) =>
        i.closest('[aria-haspopup="true"]')
      );
    const phoneInput = dialog.querySelector('input[name="phone"]');

    XP.setField(firstNameInput, firstName);
    XP.setField(lastNameInput, lastName);
    XP.setField(emailInput, email);
    XP.setField(phoneInput, phone);
  }

  function fillDocumentFields(payload, settings) {
    const mappings = settings?.documentMappings || [];

    mappings.forEach(({ placeholder, source }) => {
      const field = document.querySelector(
        `textarea[placeholder="${cssEscape(placeholder)}"], input[placeholder="${cssEscape(placeholder)}"]`
      );

      if (!field) return;

      const value = XP.getValueFromPayload(payload, source);
      XP.setField(field, value);
    });
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') {
      return window.CSS.escape(value);
    }
    return String(value).replace(/["\\]/g, '\\$&');
  }

  init();
})();
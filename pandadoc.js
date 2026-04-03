
(() => {
  if (window.__xpPandaLoaded) return;
  window.__xpPandaLoaded = true;

  const XP = window.XP;
  const { q, qa, clean } = XP;

  function findDialog() {
    return qa('[role="dialog"]').find(d => clean(d.textContent).includes('Create new recipient')) || null;
  }

  function fillRecipientDialog(dialog, payload) {
    const contact = payload?.contact || payload || {};
    const fullName = clean(contact.primaryPerson || contact.name || '');
    const { firstName, lastName } = XP.splitName(fullName);

    const firstNameInput = q('input[name="firstName"]', dialog);
    const lastNameInput = q('input[name="lastName"]', dialog);
    const emailInput = q('input[name^="searchField-"]', dialog) || qa('input', dialog).find(i => i.closest('[aria-haspopup="true"]'));
    const phoneInput = q('input[name="phone"]', dialog);

    XP.setField(firstNameInput, firstName);
    XP.setField(lastNameInput, lastName);
    XP.setField(emailInput, clean(contact.email || ''));
    XP.setField(phoneInput, clean(contact.phone || ''));
  }

  async function injectRecipientDialogButton(dialog) {
    if (!dialog) return;
    if (q('[data-xp-fill-recipient="true"]', dialog)) return;

    const buttons = qa('button', dialog);
    const createBtn = buttons.find(b => clean(b.textContent) === 'Create')
      || q('.styled__ActionsPrimary-sc-fd2a24d9-2 button', dialog)
      || q('.kovBBT', dialog);

    const primaryActions = createBtn?.closest('.styled__ActionsPrimaryItem-sc-fd2a24d9-3')?.parentElement
      || createBtn?.parentElement?.parentElement
      || q('.styled__ActionsPrimary-sc-fd2a24d9-2', dialog)
      || q('[class*="ActionsPrimary"]', dialog);

    if (!primaryActions) return;

    const fillBtn = createBtn ? createBtn.cloneNode(true) : document.createElement('button');
    fillBtn.setAttribute('data-xp-fill-recipient', 'true');
    fillBtn.type = 'button';
    fillBtn.textContent = 'Fill from Xero';
    fillBtn.disabled = false;
    fillBtn.removeAttribute('disabled');
    fillBtn.setAttribute('aria-disabled', 'false');
    fillBtn.style.pointerEvents = 'auto';
    fillBtn.style.opacity = '1';
    fillBtn.style.cursor = 'pointer';

    fillBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const payload = await XP.getStoredPayload();
      const settings = await XP.getSettings();
      if (!payload) {
        XP.showToast('No saved Xero details found yet. Use Copy Contact Details in Xero first.', 'error', settings.toastSeconds);
        return;
      }
      fillRecipientDialog(dialog, payload);
      XP.showToast('Recipient details filled from Xero', 'success', settings.toastSeconds);
      const old = fillBtn.textContent;
      fillBtn.textContent = 'Filled';
      setTimeout(() => {
        fillBtn.textContent = old;
      }, 1200);
    });

    const wrapper = document.createElement('div');
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '8px';
    wrapper.appendChild(fillBtn);

    if (createBtn && createBtn.parentElement) createBtn.parentElement.before(wrapper);
    else primaryActions.prepend(wrapper);
  }

  function byPlaceholder(placeholder) {
    return q(`textarea[placeholder="${placeholder}"], input[placeholder="${placeholder}"]`);
  }

  async function fillDocumentFields(payload) {
    const settings = await XP.getSettings();
    const mappings = Array.isArray(settings.documentMappings) ? settings.documentMappings : [];
    let filled = 0;
    for (const row of mappings) {
      const placeholder = clean(row?.placeholder || '');
      if (!placeholder) continue;
      const value = XP.getValueFromPayload(payload, row?.source || '');
      const target = byPlaceholder(placeholder);
      if (target && XP.setField(target, value)) filled += 1;
    }
    return filled;
  }

  async function injectDocumentButton() {
    const inviteBtn = document.querySelector('button[data-testid="invite_collaborator_btn"]');
    if (!inviteBtn) return;
    if (document.querySelector('[data-xp-fill-doc="true"]')) return;

    const fillBtn = inviteBtn.cloneNode(true);
    fillBtn.setAttribute('data-xp-fill-doc', 'true');
    fillBtn.type = 'button';
    fillBtn.disabled = false;
    fillBtn.removeAttribute('disabled');
    fillBtn.setAttribute('aria-disabled', 'false');
    fillBtn.style.pointerEvents = 'auto';
    fillBtn.style.opacity = '1';

    const labelNodes = qa('span', fillBtn);
    const textSpan = labelNodes.find(s => !s.querySelector('svg'));
    if (textSpan) textSpan.textContent = 'Fill from Xero';
    else fillBtn.textContent = 'Fill from Xero';

    fillBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const payload = await XP.getStoredPayload();
      const settings = await XP.getSettings();
      if (!payload) {
        XP.showToast('No saved Xero details found yet. Use Copy Contact Details in Xero first.', 'error', settings.toastSeconds);
        return;
      }
      const filled = await fillDocumentFields(payload);
      XP.showToast(`Filled ${filled} PandaDoc field${filled === 1 ? '' : 's'} from Xero`, 'success', settings.toastSeconds);
      if (textSpan) textSpan.textContent = 'Filled';
      else fillBtn.textContent = 'Filled';
      setTimeout(() => {
        if (textSpan) textSpan.textContent = 'Fill from Xero';
        else fillBtn.textContent = 'Fill from Xero';
      }, 1200);
    });

    inviteBtn.insertAdjacentElement('afterend', fillBtn);
  }

  function maybeAutoFillDialog() {
    const dialog = findDialog();
    if (!dialog) return;
    injectRecipientDialogButton(dialog);
  }

  window.XP.observe(() => {
    maybeAutoFillDialog();
    injectDocumentButton();
  });
})();

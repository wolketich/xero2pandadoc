
function renderField(label, value) {
  return `
    <div class="card">
      <div class="label">${label}</div>
      <div class="value ${value ? '' : 'empty'}">${value || 'Not available'}</div>
    </div>
  `;
}

async function load() {
  const data = await chrome.storage.local.get(['xeroPayload']);
  const payload = data.xeroPayload || null;
  const contact = payload?.contact || {};
  const html = payload
    ? [
        renderField('Name', contact.primaryPerson || contact.name || ''),
        renderField('Email', contact.email || ''),
        renderField('Phone', contact.phone || ''),
        renderField('Billing address', contact.billingAddress || ''),
        renderField('Last accepted quote', payload.lastAcceptedQuoteNumber || ''),
        renderField('Saved at', payload.savedAt || '')
      ].join('')
    : '<div class="card empty">No saved Xero payload yet. Go copy one from a Xero contact page.</div>';
  document.getElementById('content').innerHTML = html;

  document.getElementById('copyBtn').disabled = !payload;
  document.getElementById('copyBtn').addEventListener('click', async () => {
    if (!payload) return;
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    document.getElementById('copyBtn').textContent = 'Copied';
    setTimeout(() => document.getElementById('copyBtn').textContent = 'Copy JSON', 1200);
  });
}

document.getElementById('optionsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());
load();

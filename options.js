
const DEFAULT_SETTINGS = {
  documentMappings: [
    { placeholder: 'Homeowner Full Name', source: 'contact.primaryPersonOrName' },
    { placeholder: '+353 89 123 4567', source: 'contact.phone' },
    { placeholder: 'hello@email.com', source: 'contact.email' },
    { placeholder: 'Site Address', source: 'contact.billingAddress' },
    { placeholder: 'Eircode', source: 'contact.eircode' },
    { placeholder: 'QU-0000', source: 'lastAcceptedQuoteNumber' }
  ],
  toastSeconds: 2.2,
  xeroAutoCopyToClipboard: true
};

const SOURCE_OPTIONS = [
  ['contact.primaryPersonOrName', 'Contact name, preferred'],
  ['contact.primaryPerson', 'Primary person'],
  ['contact.name', 'Contact name'],
  ['contact.email', 'Email'],
  ['contact.phone', 'Phone'],
  ['contact.billingAddress', 'Billing address'],
  ['contact.eircode', 'Eircode from billing address'],
  ['lastAcceptedQuoteNumber', 'Last accepted quote number'],
  ['savedAt', 'Saved at timestamp']
];

function el(tag, attrs = {}, text = '') {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'className') node.className = v;
    else node.setAttribute(k, v);
  });
  if (text) node.textContent = text;
  return node;
}

function buildRow(row = { placeholder: '', source: 'contact.primaryPersonOrName' }) {
  const wrap = el('div', { className: 'row mapping-row' });
  const placeholder = el('input', { type: 'text', 'data-role': 'placeholder', value: row.placeholder || '' });
  const source = el('select', { 'data-role': 'source' });
  SOURCE_OPTIONS.forEach(([value, label]) => {
    const option = el('option', { value }, label);
    if (value === row.source) option.selected = true;
    source.appendChild(option);
  });
  const remove = el('button', { type: 'button', 'data-role': 'remove' }, 'Remove');
  remove.addEventListener('click', () => wrap.remove());
  wrap.append(placeholder, source, remove);
  return wrap;
}

function render(settings) {
  const rows = document.getElementById('mappingRows');
  rows.innerHTML = '';
  (settings.documentMappings || []).forEach(row => rows.appendChild(buildRow(row)));
  document.getElementById('toastSeconds').value = settings.toastSeconds ?? DEFAULT_SETTINGS.toastSeconds;
  document.getElementById('xeroAutoCopyToClipboard').value = String(settings.xeroAutoCopyToClipboard ?? true);
}

async function load() {
  const data = await chrome.storage.local.get(['settings']);
  const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
  render(settings);
}

async function save() {
  const rows = Array.from(document.querySelectorAll('.mapping-row')).map(row => ({
    placeholder: row.querySelector('[data-role="placeholder"]').value.trim(),
    source: row.querySelector('[data-role="source"]').value
  })).filter(row => row.placeholder);

  const settings = {
    documentMappings: rows,
    toastSeconds: Number(document.getElementById('toastSeconds').value || DEFAULT_SETTINGS.toastSeconds),
    xeroAutoCopyToClipboard: document.getElementById('xeroAutoCopyToClipboard').value === 'true'
  };

  await chrome.storage.local.set({ settings });
  document.getElementById('status').textContent = 'Settings saved';
  setTimeout(() => document.getElementById('status').textContent = '', 1800);
}

document.getElementById('addRowBtn').addEventListener('click', () => {
  document.getElementById('mappingRows').appendChild(buildRow());
});

document.getElementById('saveBtn').addEventListener('click', save);
document.getElementById('resetBtn').addEventListener('click', async () => {
  await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  render(DEFAULT_SETTINGS);
  document.getElementById('status').textContent = 'Defaults restored';
  setTimeout(() => document.getElementById('status').textContent = '', 1800);
});

load();

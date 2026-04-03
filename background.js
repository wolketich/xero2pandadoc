
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

async function ensureDefaults() {
  const current = await chrome.storage.local.get(['settings']);
  const merged = { ...DEFAULT_SETTINGS, ...(current.settings || {}) };
  await chrome.storage.local.set({ settings: merged });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureDefaults();
  console.log('Xero to PandaDoc Helper installed');
});

chrome.runtime.onStartup?.addListener(() => {
  ensureDefaults();
});

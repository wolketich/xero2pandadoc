console.log('[XP background] service worker started');

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

const PANDA_HOST = 'app.pandadoc.com';

async function injectPandaScripts(tabId) {
  if (!tabId) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['shared.js', 'pandadoc.js']
    });
    console.log('[XP background] Injected PandaDoc scripts into tab', tabId);
  } catch (err) {
    console.warn('[XP background] PandaDoc injection skipped:', err?.message || err);
  }
}

function isPandaDocUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname === PANDA_HOST;
  } catch {
    return false;
  }
}

// Normal page loads
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId !== 0) return;
  chrome.tabs.get(details.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab?.url) return;
    if (isPandaDocUrl(tab.url)) {
      injectPandaScripts(details.tabId);
    }
  });
});

// SPA history changes
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId !== 0) return;
  if (isPandaDocUrl(details.url)) {
    injectPandaScripts(details.tabId);
  }
});

// Hash changes like #/documents/... and #/templates-next...
chrome.webNavigation.onReferenceFragmentUpdated.addListener((details) => {
  if (details.frameId !== 0) return;
  if (isPandaDocUrl(details.url)) {
    injectPandaScripts(details.tabId);
  }
});
(() => {
  if (window.__xpSharedLoaded) return;
  window.__xpSharedLoaded = true;

  console.log('[XP] shared.js loaded', location.href);
  
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

  const XP = {
    q(selector, root = document) {
      return root.querySelector(selector);
    },

    qa(selector, root = document) {
      return Array.from(root.querySelectorAll(selector));
    },

    clean(text) {
      return (text || '').replace(/\s+/g, ' ').trim();
    },

    text(el) {
      return XP.clean(el?.textContent || '');
    },

    async getStoredPayload() {
      try {
        if (chrome?.storage?.local) {
          const data = await chrome.storage.local.get(['xeroPayload']);
          return data.xeroPayload || null;
        }
      } catch (e) {}

      // fallback
      try {
        const raw = localStorage.getItem('xeroPayload');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },

    async setStoredPayload(payload) {
      const data = {
        ...payload,
        savedAt: new Date().toISOString()
      };

      try {
        if (chrome?.storage?.local) {
          await chrome.storage.local.set({ xeroPayload: data });
          return;
        }
      } catch (e) {}

      // fallback
      localStorage.setItem('xeroPayload', JSON.stringify(data));
    },

    async getSettings() {
      const data = await chrome.storage.local.get(['settings']);
      return { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
    },

    async saveSettings(settings) {
      const merged = { ...DEFAULT_SETTINGS, ...(settings || {}) };
      await chrome.storage.local.set({ settings: merged });
      return merged;
    },

    setField(el, value) {
      if (!el || value == null) return false;

      const tag = (el.tagName || '').toLowerCase();
      const proto =
        tag === 'textarea'
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;

      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

      if (setter) setter.call(el, value);
      else el.value = value;

      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));

      return true;
    },

    splitName(fullName) {
      const parts = XP.clean(fullName).split(' ').filter(Boolean);

      if (parts.length === 0) {
        return { firstName: '', lastName: '' };
      }

      if (parts.length === 1) {
        return { firstName: parts[0], lastName: '' };
      }

      return {
        firstName: parts.slice(0, -1).join(' '),
        lastName: parts.slice(-1)[0]
      };
    },

    extractEircode(address) {
      const match = XP.clean(address).match(/\b([AC-FHKNPRTV-Y]\d{2}|D6W)\s?[0-9AC-FHKNPRTV-Y]{4}\b/i);
      return match ? match[0].toUpperCase() : '';
    },

    getValueFromPayload(payload, source) {
      const p = payload || {};
      const contact = p.contact || {};

      const map = {
        'contact.name': XP.clean(contact.name || ''),
        'contact.primaryPerson': XP.clean(contact.primaryPerson || ''),
        'contact.primaryPersonOrName': XP.clean(contact.primaryPerson || contact.name || ''),
        'contact.email': XP.clean(contact.email || ''),
        'contact.phone': XP.clean(contact.phone || ''),
        'contact.billingAddress': XP.clean(contact.billingAddress || ''),
        'contact.eircode': XP.extractEircode(contact.billingAddress || ''),
        'lastAcceptedQuoteNumber': XP.clean(p.lastAcceptedQuoteNumber || ''),
        'savedAt': XP.clean(p.savedAt || '')
      };

      return map[source] ?? '';
    },

    showToast(message, type = 'info', seconds = 2.2) {
      if (!message) return;

      const existing = document.querySelector('.xp-toast-container');
      const container = existing || document.createElement('div');

      if (!existing) {
        container.className = 'xp-toast-container';
        Object.assign(container.style, {
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: '2147483647',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none'
        });
        document.documentElement.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.textContent = message;

      const bg =
        type === 'error'
          ? '#b42318'
          : type === 'success'
            ? '#067647'
            : '#1d2939';

      Object.assign(toast.style, {
        background: bg,
        color: '#fff',
        fontSize: '13px',
        lineHeight: '1.35',
        borderRadius: '10px',
        padding: '10px 12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
        maxWidth: '360px',
        opacity: '0',
        transform: 'translateY(-4px)',
        transition: 'opacity 150ms ease, transform 150ms ease'
      });

      container.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      });

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-4px)';
        setTimeout(() => toast.remove(), 180);
      }, Math.max(1, seconds) * 1000);
    },

    observe(callback) {
      const observer = new MutationObserver(() => callback());

      observer.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true
      });

      callback();
      return observer;
    }
  };

  window.XP = XP;
})();
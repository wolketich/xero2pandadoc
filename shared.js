(() => {
  if (window.__xpSharedLoaded) return;
  window.__xpSharedLoaded = true;

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
      return this.clean(el?.textContent || '');
    },
    async getStoredPayload() {
      const data = await chrome.storage.local.get(['xeroPayload']);
      return data.xeroPayload || null;
    },
    async setStoredPayload(payload) {
      await chrome.storage.local.set({
        xeroPayload: {
          ...payload,
          savedAt: new Date().toISOString()
        }
      });
    },
    setField(el, value) {
      if (!el || value == null) return false;
      const tag = (el.tagName || '').toLowerCase();
      const proto = tag === 'textarea'
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
      const parts = this.clean(fullName).split(' ').filter(Boolean);
      if (parts.length === 0) return { firstName: '', lastName: '' };
      if (parts.length === 1) return { firstName: parts[0], lastName: '' };
      return {
        firstName: parts.slice(0, -1).join(' '),
        lastName: parts.slice(-1)[0]
      };
    },
    extractEircode(address) {
      const match = this.clean(address).match(/\b([AC-FHKNPRTV-Y]\d{2}|D6W)\s?[0-9AC-FHKNPRTV-Y]{4}\b/i);
      return match ? match[0].toUpperCase() : '';
    },
    flashButton(button, text = 'Copied', revertText = null) {
      if (!button) return;
      const original = revertText || button.__xpOriginalText || this.text(button);
      button.textContent = text;
      setTimeout(() => {
        button.textContent = original;
      }, 1200);
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

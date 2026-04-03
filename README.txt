Xero to PandaDoc Helper v1.1.0

What it does
- Xero: adds "Copy Contact Details" beside Edit on contact pages.
- PandaDoc recipient dialog: adds "Fill from Xero" beside Create as soon as the dialog appears.
- PandaDoc document page: adds "Fill from Xero" beside Invite.
- Stores the last Xero payload in chrome.storage.local so PandaDoc can use it without relying on clipboard.

Supported pages
- Xero contact pages under https://go.xero.com/* with /contacts/contact/
- PandaDoc pages under https://app.pandadoc.com/*
  - recipient dialog can appear on templates-next or templates routes
  - document page can appear under /a/#/documents/

How to install
1. Unzip this folder.
2. Open chrome://extensions
3. Turn on Developer mode.
4. Click Load unpacked.
5. Choose the unzipped extension folder.

How to use
1. Open a Xero contact page.
2. Click Copy Contact Details.
3. Open PandaDoc.
4. When the Create new recipient dialog appears, use Fill from Xero.
5. On the document page, use Fill from Xero beside Invite.

Notes
- Clipboard copy is attempted from Xero too, but storage is the main bridge.
- If PandaDoc changes a selector later, the content scripts may need a small update.

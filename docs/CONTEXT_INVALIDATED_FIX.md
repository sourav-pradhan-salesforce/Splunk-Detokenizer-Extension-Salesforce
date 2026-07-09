# 🚨 ERROR: "Extension context invalidated"

## What This Means:

Your extension was reloaded, but the web page still has the old version of the content script running. The old script can't talk to the new background worker.

---

## ✅ THE FIX (10 seconds):

### Go to your Splunk tab and press F5 (refresh page)

That's it! Problem solved.

---

## Why This Happens:

```
Before Reload:
┌──────────────┐         ┌──────────────┐
│  Splunk Page │ ◄─────► │  Background  │
│  (old script)│   ✅    │  (old worker)│
└──────────────┘         └──────────────┘
         Works fine!


After Reload (without refreshing page):
┌──────────────┐         ┌──────────────┐
│  Splunk Page │  ──X──► │  Background  │
│  (old script)│   ❌    │  (NEW worker)│
└──────────────┘         └──────────────┘
    Can't talk! ❌ "Extension context invalidated"


After Refresh:
┌──────────────┐         ┌──────────────┐
│  Splunk Page │ ◄─────► │  Background  │
│  (NEW script)│   ✅    │  (NEW worker)│
└──────────────┘         └──────────────┘
         Works again! ✅
```

---

## Always Remember:

```
Extension Reload → Page Refresh → Test
     (Step 1)    →   (Step 2)    → (Step 3)
```

**Never skip Step 2!**

---

## Quick Recovery:

You just saw this error. To fix it right now:

1. Go to Splunk tab
2. Press **F5** (or Ctrl+R / Cmd+R)
3. Wait for page to reload
4. Try detokenizing again

Should work perfectly now!

---

## Prevention:

Every time you reload the extension at chrome://extensions/, immediately:

1. Switch to ALL tabs that use the extension
2. Refresh each one (F5)
3. Then test

This becomes muscle memory after a few times!

---

**TL;DR: Extension reloaded → Refresh Splunk page → Done!**

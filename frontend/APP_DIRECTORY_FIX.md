# App Directory Conflict Fix

## Problem

Next.js found two `app/` directories:
- `frontend/app/` (conflicting - deleted)
- `frontend/src/app/` (correct location)

This caused the error: "invariant expected layout router to be mounted"

## ✅ Solution

Deleted the conflicting `frontend/app/` directory. Now Next.js will only use `frontend/src/app/`.

## 🔄 Next Steps

**Restart the frontend server**:

In your frontend terminal:
1. Press `Ctrl+C` to stop
2. Run: `npm run dev`
3. Visit: `http://localhost:3000`

## 📁 Correct Structure

```
frontend/
  src/
    app/
      layout.tsx  ✅ Root layout
      page.tsx    ✅ Home page
      talent/     ✅ Talent portal
      business/   ✅ Business portal
    components/
      ui/         ✅ shadcn/ui components
    lib/
      utils.ts    ✅ Helper functions
```

The app should now load without errors!

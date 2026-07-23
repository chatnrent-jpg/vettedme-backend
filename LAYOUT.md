# VettedME Platform — Local Layout

**Canonical GitHub repo:** https://github.com/chatnrent-jpg/vettedme-backend

## What lives here

| Path | Purpose |
|------|---------|
| `src/` | **VettedME / VettedPay Node API** (primary product surface) |
| `prisma/` | VettedME database schema |
| `frontend/` | VettedME / VettedPay UI packages |
| `package.json` | Node scripts (`npm run dev` → `src/index.ts`) |

This repo historically also contains older Python/FastAPI healthcare paths (`app/`, `strategy/`, Streamlit, etc.).  
**Do not use those for VettedCare.** The healthcare platform is separate:

→ https://github.com/chatnrent-jpg/offercare-backend  
→ Local: `C:\VettedCare.ai\vettedcare-healthcare\backend`

## Remotes

```text
origin   → https://github.com/chatnrent-jpg/vettedme-backend.git
offercare → https://github.com/chatnrent-jpg/offercare-backend.git  (legacy only)
```

## Quick start (VettedME Node API)

```powershell
cd C:\VettedCare.ai\vettedme-platform\backend
npm install --legacy-peer-deps
npm run db:generate
npm run dev
```

Default API: `http://localhost:8080`

## Cleanup already applied (Jul 2026)

- Restored accidentally deleted tracked files (`src/`, `prisma/`, etc.) from GitHub HEAD
- Removed nested `vettedme-backend-TEMP/` duplicate folder
- Pointed `origin` at `vettedme-backend`
- Ignored Python caches, venvs, and TEMP leftovers

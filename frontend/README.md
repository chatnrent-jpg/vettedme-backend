# VETTED Frontend - Dual Portal Application

**Next.js 15 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui**

## 🎯 Dual Portal Structure

### VettedME Portal (`/talent`)
**For Nigerian tech professionals**
- Three-tier verification journey
- Portfolio audit interface
- Sandboxed code lab
- AI technical viva
- Digital passport display
- Trust score dashboard

### VettedPay Portal (`/business`)
**For Western B2B buyers**
- Pre-verified talent pool browser
- Contract creation interface
- Escrow wallet management
- Milestone tracking dashboard
- Payment release controls

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit:
- Homepage: http://localhost:3000
- Talent Portal: http://localhost:3000/talent
- Business Portal: http://localhost:3000/business

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Homepage (dual CTA)
│   │   ├── globals.css         # Tailwind styles
│   │   ├── talent/             # VettedME portal
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx        # Talent landing
│   │   │   ├── dashboard/
│   │   │   ├── assessment/
│   │   │   └── passport/
│   │   └── business/           # VettedPay portal
│   │       ├── layout.tsx
│   │       ├── page.tsx        # Business landing
│   │       ├── dashboard/
│   │       ├── talent/
│   │       ├── contracts/
│   │       └── escrow/
│   └── components/             # Shared components
│       └── ui/                 # shadcn/ui components
├── public/
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🎨 Design System

### Color Palette
- **Primary (Blue)**: VettedME branding
- **Success (Green)**: VettedPay branding
- **Purple**: Trust scores, verification badges
- **Slate**: UI chrome, backgrounds

### Typography
- **Font**: Inter (Google Fonts)
- **Scale**: Tailwind default scale

### Components
- Built with **shadcn/ui** (Radix UI primitives)
- Fully accessible (ARIA compliant)
- Dark mode support
- Responsive design

## 🔗 API Integration

Configure backend URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/api/v1
```

API routes are proxied through Next.js:
- `/api/*` → Backend `/api/v1/*`

## 📦 Key Dependencies

- **next**: 15.0.3
- **react**: 19.0.0
- **typescript**: 5.6.3
- **tailwindcss**: 4.0.0
- **@radix-ui**: Latest UI primitives
- **lucide-react**: Icon library
- **axios**: HTTP client
- **zod**: Schema validation

## 🚢 Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Railway
```bash
railway up
```

### Docker
```bash
docker build -t vetted-frontend .
docker run -p 3000:3000 vetted-frontend
```

## 🎯 Next Steps

### For Prompt 2-10:
1. Implement shadcn/ui components
2. Build assessment flow interfaces
3. Create dashboard visualizations
4. Add API integration layer
5. Implement authentication
6. Build passport public view
7. Create escrow management UI
8. Add real-time updates
9. Implement video interview UI
10. Polish and deploy

---

**Built with ❤️ for VETTED - Trust Infrastructure for Cross-Border Tech Talent**

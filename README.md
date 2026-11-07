# akod-yumso

YUMSO snacks public website: a single-page site built with Next.js and Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 (or the port shown in the terminal).

## Configure

- **WhatsApp number:** `src/lib/whatsapp.tsx` → `WHATSAPP_NUMBER` (country code + number, digits only)
- **Products:** `src/data/products.ts`
- **Contact details:** `src/app/page.tsx` (Contact section)

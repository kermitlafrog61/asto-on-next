# AstroClub KIMEP

A web application for the AstroClub on KIMEP featuring image uploads, event registration, merchandise, and an admin panel.

## Features

- **Main Page**: Welcome page with AstroClub branding and navigation
- **Image Upload**: Upload astrophotography images with your name (shows who uploaded each image)
- **Event Registration**: Register for multiple astronomy events
- **Merchandise**: Browse and view AstroClub merchandise
- **Admin Panel**: Full management system (accessible only via URL `/admin`)
  - Manage uploads: view, delete, bulk operations, download with optional name overlay, zip downloads
  - Manage events: create, edit, delete events
  - View registrations
  - Manage merchandise: add, edit, delete items, upload photos

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a `.env.local` file in the root directory:
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

3. Run the development server:

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

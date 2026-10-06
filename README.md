# SPRT — Worker Task & App Download Landing

A high-conversion web application with real-time mode switching between **"Continue to Download" Mode** and **"App Registration Task" Mode**, managed via an integrated `/admin` control dashboard.

---

## 🚀 Features

- **Dynamic Dual Modes**:
  - **Continue to Download Mode**: Clean, modern, high-converting hero screen with a direct CTA leading to the target App Store / OneLink URL (`https://phygitals.onelink.me/1HmK/o45tvhth`). Supports optional countdown auto-redirect.
  - **App Registration Task Mode**: Full step-by-step worker guide with VPN location requirement notice (USA/Germany), step 1-4 instructions, 1-click referral code copy box (`e406a482d8da`), and proof submission checklist.
- **Admin Control Dashboard (`/admin` / `admin.html`)**:
  - Protected with PIN (Default: `admin123`).
  - 1-Click active mode switcher with real-time feedback.
  - Live preview iframe to view changes before and after saving.
  - Editable Target Download URL, Referral Code, Auto-redirect delay, and custom text.
  - Cloud KV state persistence + local caching.
  - `config.json` generator and exporter.

---

## 🛠 Admin Access

1. Open `/admin` (or `/admin/index.html` / `admin.html`) in your browser.
2. Enter the admin PIN:
   - **Default PIN**: `admin123`
3. Toggle between **"Continue to Download"** or **"App Registration Task Guide"**.
4. Click **Save & Publish Changes**.

---

## 📁 Project Structure

```
sprt/
├── index.html         # Main public landing page (auto-switches based on active mode)
├── admin/
│   └── index.html     # Dedicated /admin dashboard route
├── admin.html         # Root alias for direct admin access
├── config.json        # Static configuration file
├── js/
│   └── app-config.js  # Configuration loader & cloud sync manager
└── README.md          # Project documentation
```

---

## 🌐 Quick URL Overrides (Testing)

You can preview either mode directly via URL query parameters:
- `https://your-domain.com/?mode=download` — Force "Continue to Download" view
- `https://your-domain.com/?mode=task` — Force "App Task Guide" view

# 🌾 SmartFarm — Static Farm Management App

![HTML](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Ready-brightgreen)
![No Backend](https://img.shields.io/badge/No%20Backend-localStorage-orange)

> A complete farm management app that runs entirely in the browser. No server, no database, no installation. All data stored in `localStorage`.

**Live Demo:** `https://yourusername.github.io/smartfarm`

---

## Features

- **Livestock Module** — Register animals, log daily weight/milk/eggs, track health records and vaccinations with due-date alerts, QR codes per animal
- **Crops Module** — Plot registration, input logging (fertilizer, pesticide, etc.), harvest recording, yield and profit per plot
- **Executive Dashboard** — 12-month financial trend, livestock ROI, mortality rate, farm value, circular economy recommendations
- **Transactions** — Income and expense tracker with running net profit
- **Module Manager** — Admin can toggle modules on/off
- **Demo Data** — Loads sample animals, plots, and transactions on first visit so you can explore immediately

---

## How It Works

All data is stored in your browser's `localStorage`. There is no server or database. Data persists between sessions on the same device and browser. Clearing browser data will reset the app.

---

## Deploy to GitHub Pages

### Step 1 — Fork or clone this repo

```bash
git clone https://github.com/yourusername/smartfarm.git
cd smartfarm
```

### Step 2 — Push to GitHub

```bash
git add .
git commit -m "Deploy SmartFarm"
git push origin main
```

### Step 3 — Enable GitHub Pages

1. Go to your repo on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Select **main** branch → **/ (root)**
5. Click **Save**

Your site will be live at: `https://yourusername.github.io/smartfarm`

---

## Demo Login

| Field | Value |
|---|---|
| Email | `admin@smartfarm.com` |
| Password | `password` |

Or click **Register** to create your own account.

---

## File Structure

```
smartfarm/
├── index.html              Entry point (redirects to login or dashboard)
├── login.html              Login page
├── register.html           Registration page
├── dashboard.html          Main overview dashboard
├── livestock.html          Animal list with search and filters
├── livestock-add.html      Add new animal form
├── livestock-view.html     Animal profile, logs, health records
├── livestock-edit.html     Edit animal details
├── crops.html              Crop plots list
├── crops-add.html          Add new plot form
├── crops-view.html         Plot detail, inputs, harvests
├── executive.html          Full analytics dashboard
├── transactions.html       Income and expense tracker
├── admin.html              Module manager
└── assets/
    ├── css/app.css         Global stylesheet
    └── js/
        ├── app.js          Core data layer (localStorage)
        └── nav.js          Shared navigation builder
```

---

## Data Storage

All data uses `localStorage` with the prefix `sf_`:

| Key | Contents |
|---|---|
| `sf_users` | User accounts |
| `sf_session` | Current logged-in user |
| `sf_animals` | Livestock records |
| `sf_animalLogs` | Daily animal logs |
| `sf_healthRecords` | Vaccination and treatment records |
| `sf_plots` | Crop plots |
| `sf_cropInputs` | Fertilizer, pesticide, etc. |
| `sf_harvests` | Harvest records |
| `sf_transactions` | Income and expense records |
| `sf_modules` | Module active/inactive state |

---

## Limitations (localStorage vs Real Backend)

| Feature | This App | PHP + MySQL Version |
|---|---|---|
| Multi-device sync | ❌ | ✅ |
| Data backup | Manual export only | ✅ Automatic |
| Multiple users sharing data | ❌ | ✅ |
| Large data sets | Limited (~5MB) | Unlimited |
| Hosting cost | Free (GitHub Pages) | Free (InfinityFree) |

---

## Tech Stack

- Pure HTML, CSS, JavaScript — zero frameworks
- Chart.js (CDN) for charts
- Google Fonts for typography
- localStorage for all data persistence

---

## License

MIT — free to use, modify, and distribute.

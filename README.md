# iPad Wall Clock Dashboard

A minimal, always-on wall dashboard designed to **revive an old iPad** (tested on iPad Air 1, iOS 12), combining time, weather, and daily devotional content in a calm, glass-style interface.

This project is intentionally simple, stable, and distraction-free — meant to live on a wall, not be interacted with constantly.

---

## ✨ Features

- 🕒 **Live clock** (ES5, Safari iOS 12 compatible)
- 📅 **Date in natural language** (e.g. *1 de febrero de 2026*)
- 🌡️ **Current weather + next hours forecast**
- 🌧️ Smart rain indicator
- 📖 **Catecismo Menor de Westminster**
  - One question every **3 days**
  - Spanish, Reformed, public-domain based
- 🌗 **Automatic night mode** (20:00–06:00)
- 🧊 Elegant *fake glass* UI (no real blur → better performance)
- 🖼️ Rotating background images
- 🔌 100% static (no backend, no API keys)
- 📱 Wall-mounted friendly (portrait layout)

---

## 🧠 Design Principles

- Reuse old hardware instead of discarding it
- Avoid heavy frameworks
- Prefer stability over features
- Minimal visual noise
- Calm, contemplative presence in the home

This is not a “smart display” — it’s a **digital object**.

---

## 🛠 Tech Stack

- HTML / CSS / JavaScript (ES5 only)
- GitHub Pages (static hosting)
- Open-Meteo API (weather, no API key required)
- Local JSON data for catechism content

---

## 📷 Screenshots

> Screenshots include background blur for privacy.

### Night mode – vertical layout

![Night mode 1](docs/screenshots/1a-blur.jpg)

![Night mode 2](docs/screenshots/1b-blur.jpg)

---

## 📖 Catechism Content

- **Title:** Catecismo Menor de Westminster  
- **Language:** Spanish  
- **Cycle:** One question every 3 days  
- **Structure:** Question & Answer  
- **Source:**  
  Based on the Westminster Shorter Catechism (public domain).  
  Spanish wording adapted for devotional and educational use.

Files:
data/
├── westminster-meta.json
├── westminster-01-36.json
├── westminster-37-86.json
└── westminster-87-107.json


---

## 🚀 Setup

1. Clone the repository
2. Add your own images to `/assets`
3. Enable **GitHub Pages** (Settings → Pages → main / root)
4. Open the site on the iPad
5. **Add to Home Screen**
6. Enable **Guided Access** (recommended)

---

## 🧪 Hardware Tested

- ✅ iPad Air 1  
- iOS 12.5.x  
- Safari / Home Screen Web App mode  

---

## 📌 Notes

- Designed to run **24/7**
- No cookies, no tracking
- Works offline except for weather updates
- Catechism content works fully offline once loaded

---

## 🙏 Closing

This project exists at the intersection of:
- craftsmanship
- restraint
- theology
- and engineering pragmatism

Soli Deo Gloria.

# Daily Time Record

A lightweight, self-contained web app for tracking hours worked toward a total hour requirement — built for logging OJT hours, but works for any hours-based schedule.

## Features

- **Setup** — set a start date, total hours required, and standard hours per day. Generates a day-by-day schedule automatically, with an option to skip weekends.
- **Progress** — see hours logged, hours remaining, percent complete, and an estimated completion date, with a progress bar.
- **Daily log** — each day is editable:
  - Enter actual hours worked.
  - Mark a day as **Work day**, **Absent**, or **Holiday** from the row's actions menu (⋯). Absent/holiday days count as 0 hours and don't count against your logged total.
  - Remove a day, or add extra days at the end if you fall short of the target.
- **Hours logged** only counts days that have actually passed (today or earlier) and are marked as worked — future/pending days don't inflate your total.
- **Light / dark / system theme** toggle in the top bar.
- **Autosaves** to your device automatically — no account or login needed. Nothing is sent anywhere else.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure/markup |
| `style.css` | All styling (minimal design language: monochrome, typography-driven) |
| `script.js` | App logic — schedule generation, storage, stats, rendering |

Keep all three files in the same folder — `index.html` links to the other two by relative path.

## Usage

1. Open `index.html` in any modern browser (double-click it, or host the folder anywhere).
2. Fill in the setup fields and click **Generate schedule**.
3. Log hours day by day as you go. Your data is saved automatically on that device/browser.

## Notes

- Data is stored locally in the browser the app is opened in — it won't sync across different browsers or devices.
- Use **Clear all data** in the setup card to wipe your schedule and start over.

---

© 2026 Nicklaus Karl Vergel Rosales

# Currency Converter (EUR/USD)

Small React single-page application built as a technical test.

## Features

- Simulated live EUR/USD rate (starts at 1.1, updates every 3s)
- Convert EUR ↔ USD
- Polling to refresh output automatically
- Override FX rate with auto-disable when drift ≥ 2%
- Continuity when switching currencies
- History table (last 5 conversions)
- Simple UX improvements (flags, clean layout)

## Tech Stack

- React
- Vite
- JavaScript (no extra libraries)

## Run locally

npm install
npm run dev

## Build

npm run build

## Deploy (GitHub Pages)

npm run deploy

## Notes

This project was implemented within a 2-hour time constraint.
See:
- todo.md for shortcuts / improvements
- roadmap.md for future features

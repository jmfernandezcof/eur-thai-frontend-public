# ArtI · The Thaislator — PWA

A trilingual (Spanish ↔ English ↔ Thai) travel companion for Thailand. It is mobile-first and
installable from the browser, and it is built with no framework and no bundler.

**Live app:** https://eurthai.nomadprompters.es ·
**Backend:** [thaislator-api](https://github.com/jmfernandezcof/thaislator-api)

> This is a portfolio project by [Nomad Prompters](https://nomadprompters.es). It is a sanitized
> snapshot of a private repository. Secrets, operational notes and commit history have been removed.

## Features

- **Translator:** Thai ↔ Spanish/English with transliteration, back-translation and a blind
  verification pass. The result can be read aloud in Thai.
- **Menu reader:** take a photo of a Thai menu and get each dish with its protein, allergens,
  spice level and vegan/vegetarian flags.
- **Sign reader:** take a photo of a sign and get the same photo back with the Thai text replaced by
  its translation.
- **Phrasebook:** 114 essential phrases with recorded native-style audio (female and male voices),
  usable offline.
- **Currency converter:** EUR/USD/GBP ↔ THB with live ECB rates.
- **Emergency numbers:** local emergency services, the tourism police and 12 embassies.
- **Places and weather:** recommended destinations and forecasts from the Thai Meteorological
  Department.
- **Fully localized UI** in Spanish, English and Thai, plus legal, privacy and cookie notices.

AI features are in a private beta: each tester gets a personal invite code with a credit budget.

## Engineering notes

- **Vanilla HTML/CSS/JS** split into small modules (`js/`), loaded in order, with no build step.
- **PWA:** a manifest and a versioned service worker for offline use and installation.
- **Self-hosted fonts, icons and flags:** no third-party requests for assets.
- **Nginx in Docker** serves a read-only mount, with security headers and a Content Security
  Policy (`nginx.conf`).
- **Content lives in JSON** (`data/`, `i18n/`), separate from code.

## Stack

HTML · CSS · JavaScript · Service Worker · Nginx · Docker · Traefik · Cloudflare

## License

© Nomad Prompters. All rights reserved. Shared for portfolio review only. Flag icons come from
[circle-flags](https://github.com/HatScripts/circle-flags) and icons from [Tabler](https://tabler.io)
(MIT).

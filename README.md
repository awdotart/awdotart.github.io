# Adrian Romero — Personal Website

This repository contains my personal website, built with plain HTML, CSS, and JavaScript.

## Overview

The site is organized into three main pages:

- `index.html` — Main academic profile (physics, current status, papers).
- `beyond-physics.html` — Beyond Physics content (cycling, travel, Xima, videos, cocktails, and art highlights).
- `arte.html` — AW Art page with full art galleries.

## Main Features

- Responsive layout for desktop and mobile.
- Sticky header/navigation.
- Auto-play carousels with manual controls.
- Separate art page for easy sharing.
- Xima section with:
  - Official website button
  - Play Xima button
  - YouTube videos button
  - Scientific Xima PDF download

## Project Structure

- `index.html` — Home / science profile
- `beyond-physics.html` — General/lifestyle sections
- `arte.html` — Art galleries
- `styles.css` — Global styles
- `script.js` — Carousel behavior and interactions
- Image/PDF assets in the root folder (e.g. `oil1.jpeg`, `x2.png`, `portadaxima.png`, `ximaciencia.pdf`)

## Run Locally

Use a local server (recommended):

```bash
cd awart
python3 -m http.server 8080

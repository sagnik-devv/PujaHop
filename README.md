# 🪔 PUJO NAVIGATION — Kolkata Durga Puja Smart Navigation & Pandal Hopping Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-green?style=for-the-badge&logo=leaflet)
![CSS3](https://img.shields.io/badge/Design%20System-Heritage%20Aesthetic-red?style=for-the-badge)
![Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)

**Your Puja. Your Route. Your Hop.**  
*Kolkata’s premier geospatial navigation, crowd intelligence, and cultural guide for 248+ Durga Puja pandals.*

[Explore Pandals](http://localhost:3000/explore) • [Smart Metro Guide](http://localhost:3000/metro) • [Itinerary Planner](http://localhost:3000/planner) • [Live Route Finder](http://localhost:3000/route)

</div>

---

## 📖 Overview

**PUJO NAVIGATION** is a modern, high-performance web platform built to solve the ultimate festive challenge in Kolkata: navigating millions of visitors across hundreds of Durga Puja pandals safely, efficiently, and culturally immersed.

From iconic crowd magnets like **Sreebhumi Sporting Club** and **Ekdalia Evergreen** to contemporary social awakening art installations in **Haridevpur** and traditional Rajbari heritage pujas, PUJO NAVIGATION delivers real-time metro connectivity, walking itineraries, crowd telemetry, heritage eatery pitstops, and master artisan cultural dossiers.

---

## ✨ Core Features

### 1. 📍 248+ Geo-Tagged Pandals with Live Intelligence
- **Geographic Precision**: Comprehensive verified database of 248+ Kolkata Durga Pujas categorized across North Kolkata, South Kolkata, Salt Lake, New Town, Behala, Haridevpur, and Central heritage districts.
- **Dynamic Crowd Level Indicator**: Historical and estimated rush status (`Low`, `Moderate`, `Heavy Rush`, `Peak Surge`, `🔥 Insane Footfall`).
- **Pandal Hero Showcases**: Pinned #1 ranking for **Sreebhumi Sporting Club** (BAPS Akshardham Replica) and spotlight on **Haridevpur Adarsha Samity** (Muktir Alo).
- **Authentic Cover Media**: 202 genuine festival cover photos replacing generic placeholders, optimized into sub-150KB web assets for instant 60 FPS scrolling.

### 2. 🚇 Kolkata Metro Puja Guide & Reference
- **All 45 Stations Mapped**: North-South Blue Line, East-West Green Line (underwater tunnel), Purple Line, and Orange Line.
- **Metro-Centric Hopping**: Filter and discover pandals by proximity to any metro station, complete with walking distance, transit times, and direct Google Maps navigation from station gates.
- **"📍 Nearest Metro to Me"**: Instant geolocation detection auto-identifies your closest metro terminal with distance in meters.

### 3. 🗺️ Smart Route Optimizer & Day Planner (`/route` & `/planner`)
- **TSP Routing Engine**: Solves the Travelling Salesperson Problem via nearest-neighbor geospatial optimization, sequencing saved pandals into the most time- and fuel-efficient circuit.
- **Multi-Stop Itineraries**: Add custom starting points or detect current live location, set departure times, and receive estimated arrival windows factoring in festive pedestrian blockades.
- **One-Click Route from Favorites**: Plan your custom day plan directly from saved bookmarks with a single click.

### 4. 🍢 Heritage Eateries & Food Pitstops
- **Verified Street Food & Cabins**: Ingested curated data for legendary Kolkata food institutions, sweet shops, kathi roll joints, and century-old cabins near every major puja hub.
- **Route-Integrated Dining**: Automatically suggests iconic food pitstops along your planned pandal hopping trail.

### 5. 🎨 Curated Art, Architecture & Cultural Dossier
- **Master Artisans & Sculptors**: Detailed dossiers covering pratima styles (Kumartuli masters, Ekchala vs theme clay sculpture), lighting installations (Chandannagar neon), and structural engineering.
- **Committee Statements**: Creative philosophy quotes, current and historical theme archives, and award accolades (Biswa Bangla Sharad Samman).
- **Official Socials**: Verified direct links to official club Facebook pages and Instagram handles.

### 6. ⚡ Blazing Fast, Anti-Lag Performance
- **Image Compression**: Raw 400MB+ PNG photos converted to responsive, progressive 1200px JPEGs via Apple `sips` tooling, cutting asset weight by 96%.
- **Zero Compositor Jitter**: Hardware-accelerated CSS styling, removing heavy backdrop-filters and GPU-choking filter chains.
- **Map Decoupling**: Leaflet marker layer retains references without destroying and re-mounting 248 DOM nodes on hover.
- **Progressive Explore Batching**: 32-card initial batches with instant load-more triggers for silky smooth exploration.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) | Server-Side Rendering (SSR) & Static Site Generation (SSG for 263+ pages) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe models for pandals, metros, eateries, and routing algorithms |
| **Styling** | Vanilla CSS3 (Custom Design System) | Rich Kolkata festive palette: Vermilion Red, Terracotta, Soft Gold, and Dark Obsidian |
| **Mapping** | [Leaflet](https://leafletjs.com/) + OpenStreetMap | Interactive spatial map with custom pins, live user location, and route polylines |
| **Icons** | Custom SVG Components | Scalable, zero-dependency icon library tailored for transit & cultural emblems |
| **Data Engine** | Node.js + Ingestion Scripts | CSV dataset transforms, geocoding validation, and automated image pipelines |

---

## 📁 Project Architecture

```plaintext
PujarHop/
├── app/                               # Next.js App Router Pages
│   ├── layout.tsx                     # Global layout, toast & favorites providers
│   ├── page.tsx                       # Home page (Hero, Trending, Metro Hopping, Stats)
│   ├── globals.css                    # Luxury Bengal heritage design system & tokens
│   ├── explore/                       # 248 Pandal catalog with Metro Reference toggle
│   ├── pandal/[id]/                   # Pandal detail page with Art & Cultural Dossier
│   ├── route/                         # 2-point smart route calculation & alternatives
│   ├── planner/                       # Multi-stop day itinerary optimizer
│   ├── metro/                         # Dedicated Kolkata Metro Hopping Guide
│   ├── nearby/                        # Geolocation proximity pandal radar
│   ├── favorites/                     # Saved pandals drawer with 1-click plan export
│   ├── emergency/                     # Police, medical, and fire emergency helpline
│   └── about/                         # Platform heritage mission & cultural roots
├── components/                        # Reusable UI Components
│   ├── Navbar.tsx                     # Sticky header with quick search & navigation
│   ├── Footer.tsx                     # Bengal cultural footer & quick links
│   ├── PandalCard.tsx                 # Luxury card with authentic photo & transit chips
│   ├── LeafletMap.tsx                 # Geospatial map with live location pin
│   ├── MetroPujaPlanner.tsx           # Interactive metro-centric puja discovery
│   ├── CrowdBadge.tsx                 # Crowd level badge with live pulse indicator
│   └── Icons.tsx                      # Handcrafted SVG transit and cultural icons
├── lib/                               # Data Models, Utilities & Algorithms
│   ├── api.ts                         # Data access layer for pandals, metros, and art
│   ├── types.ts                       # TypeScript interface definitions
│   ├── geo.ts                         # Haversine distance and geometric calculations
│   ├── location-service.ts            # 5-tier robust GPS / IP / cache location engine
│   ├── route-optimizer.ts             # Traveling Salesperson routing algorithm
│   ├── generated-pujas.ts             # 248 fully geocoded pandal database
│   ├── generated-metro.ts             # 45 Kolkata Metro stations across all lines
│   ├── generated-food.ts              # Verified nearby eateries & heritage cabins
│   └── generated-art-details.ts       # 248-record art, philosophy & socials dataset
├── public/                            # Static Assets
│   └── images/
│       └── pandals/                   # 200+ authentic optimized puja cover photos
└── scripts/                           # Data pipelines & automation scripts
    ├── process-pandal-images.py       # Image resizing, format conversion & linking
    └── import-data.mjs                # CSV data parsing & geocoding normalizer
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.17.0 or higher recommended)
- `npm` or `pnpm`

### 1. Clone the Repository
```bash
git clone https://github.com/sagnik-devv/PujarHop.git
cd PujarHop
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

### 4. Build for Production
```bash
npm run build
npm run start
```
*Compiles all static routes with 100% type-safety across 263+ statically optimized HTML pages.*

---

## 👥 The Team

PUJO NAVIGATION was conceptualized, designed, and built with ❤️ for the city of Kolkata by:

<div align="center">

| Name | Role | GitHub |
|---|---|---|
| **Sagnik Chakraborty** | Core Architecture, Routing Engine & Data Systems | [![GitHub](https://img.shields.io/badge/GitHub-sagnik--devv-181717?style=flat&logo=github)](https://github.com/sagnik-devv) |
| **Debalin Sinha** | Frontend Engineering, Design Systems & UX | [![GitHub](https://img.shields.io/badge/GitHub-debalin--devv-181717?style=flat&logo=github)](https://github.com/debalin-devv/) |
| **Kanak Goswami** | Data Integration, Geospatial Mapping & Research | [![GitHub](https://img.shields.io/badge/GitHub-goswamikonok--hash-181717?style=flat&logo=github)](https://github.com/goswamikonok-hash) |

</div>

---

## 📜 License & Cultural Attribution

This project is created to celebrate the UNESCO Intangible Cultural Heritage of Humanity — **Durga Puja in Kolkata**. All puja imagery and committee themes remain the cultural and intellectual heritage of their respective clubs, artists, and organizers.

Built with dedication for Kolkata. **শুভ শারদীয়া! Happy Pandal Hopping!**

# 🪔 PUJO NAVIGATION (PujoHop) — Kolkata Durga Puja Smart Navigation & Real-Time Hopping Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.2-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![InsForge](https://img.shields.io/badge/InsForge-PostgreSQL%20%26%20Realtime-10B981?style=for-the-badge&logo=postgresql&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![Design System](https://img.shields.io/badge/Design%20System-Bengal%20Heritage-B33927?style=for-the-badge)

**Your Puja. Your Route. Your Hop.**  
*Kolkata’s premier geospatial navigation, multi-modal transit engine, crowd intelligence, and collaborative social hopping platform for 248+ Durga Puja pandals.*

[Explore Pandals](http://localhost:3000/explore) • [Smart Metro Guide](http://localhost:3000/metro) • [Bus Navigator](http://localhost:3000/bus) • [Smart Route Finder](http://localhost:3000/route) • [Itinerary Planner](http://localhost:3000/planner) • [Hop with Friends](http://localhost:3000/hop)

</div>

---

## 📖 Overview

**PUJO NAVIGATION (PujoHop)** is an advanced, high-performance web platform engineered to solve Kolkata's grandest urban mobility challenge: guiding millions of festive revellers across hundreds of Durga Puja pandals smoothly, safely, and culturally immersed.

Recognized worldwide as a **UNESCO Intangible Cultural Heritage of Humanity**, Kolkata's Durga Puja transforms the city into an open-air art gallery. However, navigating pedestrian barricades, massive crowd surges, and road diversions requires sophisticated coordination. 

PUJO NAVIGATION combines **geospatial routing algorithms**, **real-time crowd telemetry**, **multi-modal transit intelligence (Metro + Bus + Walking + Cabs)**, **collaborative live group rooms ("Hop with Friends")**, and **curated cultural dossiers** into a unified, mobile-first experience.

---

## ✨ Core Highlights & Capabilities

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 🪔 PUJO NAVIGATION                      │
                  └──────────────────────────┬──────────────────────────────┘
                                             │
      ┌────────────────────┬─────────────────┼─────────────────┬──────────────────┐
      ▼                    ▼                 ▼                 ▼                  ▼
┌──────────────┐   ┌───────────────┐  ┌─────────────┐   ┌─────────────┐   ┌──────────────┐
│  248+ PANDAL │   │  MULTI-MODAL  │  │  MULTI-STOP │   │  HOP ROOMS  │   │   CIVIC &    │
│  INTELLIGENCE│   │  TRANSIT (M/B)│  │ TSP PLANNER │   │ LIVE RADAR  │   │ HERITAGE DINE│
└──────────────┘   └───────────────┘  └─────────────┘   └─────────────┘   └──────────────┘
```

### 1. 📍 248+ Geo-Tagged Pandals with Live Telemetry
- **Verified Geographic Accuracy**: Over 248 pandals mapped across North Kolkata, South Kolkata, Salt Lake, New Town, Behala, Haridevpur, and Central heritage districts.
- **Dynamic Crowd Level Indicator**: Live rush categorization (`Low`, `Moderate`, `High`, `Surge`, `Extremely High`, `🔥 Insane Footfall`).
- **Pandal Hero Spotlights**: Pinned high-priority showcases such as **Sreebhumi Sporting Club** (BAPS Akshardham Replica), **Ekdalia Evergreen**, **Suruchi Sangha**, and **Haridevpur Adarsha Samity** (*Muktir Alo*).
- **Authentic Cover Media**: 200+ authentic festival photographs processed into sub-150KB web assets for instant 60 FPS scrolling with zero GPU choke.

### 2. 🚇 Kolkata Metro Puja Guide (All 45 Stations Mapped)
- **Complete Network Coverage**: All operational lines mapped—North-South Blue Line, East-West Green Line (featuring the underwater Hooghly River tunnel), Purple Line, and Orange Line.
- **Metro-Centric Hopping**: Filter pandals within easy walking distance of any metro gate, complete with step-by-step gate directions and estimated pedestrian transit times.
- **"📍 Nearest Metro to Me"**: Proximity detection identifies your nearest metro terminal with precision distance calculations in meters.

### 3. 🚌 Kolkata Bus Route Navigator (180+ Routes, 54+ Transit Hubs)
- **Comprehensive Bus Network**: Ingested and mapped 180+ active Kolkata & Howrah bus routes connecting every major puja zone.
- **Bus Stop-to-Pandal Mapping**: Direct correlation between 54+ bus stops and nearby pandals with AC / Non-AC filters and hot route indicators.
- **Transit Hubs**: Instant connection details for major hubs like Shyambazar 5-Point, Esplanade, Gariahat, Ultadanga, and Ruby Crossing.

### 4. 🧭 Multi-Modal Route Comparison & Smart Scoring (`/route`)
- **Side-by-Side Mode Comparison**: Compare Walking, Metro Transit, Bus Transit, and Cab/Auto routes side-by-side.
- **Festive Route Scoring Formula**: Evaluates travel options dynamically based on:
  $$\text{Score} = \text{Base Speed} \times \text{Transit Efficiency} - (\text{Crowd Penalty} + \text{Festive Pedestrian Congestion Factor})$$
- **External Handover**: One-tap deep-linking to Google Maps and OpenStreetMap for turn-by-step audio navigation.

### 5. 🗺️ Multi-Stop Itinerary Planner & TSP Engine (`/planner`)
- **Travelling Salesperson (TSP) Optimization**: Sequentially arranges saved pandals into the shortest, most energy-efficient circuit using nearest-neighbor geospatial heuristics.
- **Customizable Day Plans**: Set starting points (custom landmark or live GPS), adjust arrival windows, drag-and-drop to reorder stops, and plan food breaks.
- **One-Click Export from Bookmarks**: Instantly convert your saved favorites into a cohesive hopping circuit.

### 6. 👥 "Hop with Friends" Real-Time Group Rooms (`/hop`)
- **Synchronized Live GPS Radar**: Share your live position securely with hopping buddies on an interactive real-time map (`HopMap`).
- **Collaborative Puja Bucket List**: Add, upvote, and coordinate pandals collectively with room members in real-time.
- **Meetup Pandal Pinning**: Designate a target pandal as the group meetup hub with automatic distance calculation for all members.
- **Instant QR Room Sharing**: Generate and scan QR codes (`HopRoomQRCode`) for seamless one-tap mobile room joins without app downloads.
- **Powered by InsForge Realtime**: Backed by PostgreSQL BaaS with low-latency WebSocket presence and location channels.

### 7. 🚻 Civic Amenities & Heritage Eateries
- **Clean Restrooms Radar (`/nearby-toilets`)**: Mapped public toilets, metro restrooms, and pay-and-use amenities across Kolkata with hygiene indicators and wheelchair accessibility flags.
- **Heritage Food Pitstops**: Curated legendary food institutions, century-old heritage cabins (e.g., Mitra Cafe, Basanta Cabin), roll joints, and sweet shops along your pandal trails.

### 8. 🎨 Art, Sculpture & Cultural Dossier (`/pandal/[id]`)
- **Master Artisans & Sculptors**: Chronicles Pratima traditions—Kumartuli clay masters, traditional *Ekchala* sabeki vs. contemporary thematic art.
- **Chandannagar Illumination**: Details on iconic lighting installations and dynamic light gates.
- **Curator & Theme Archives**: Artistic philosophy statements, social awakening themes, and official Biswa Bangla Sharad Samman accolades.
- **Official Socials**: Verified links to committee Facebook pages and Instagram handles.

### 9. 🤖 AI Puja Assistant & Bilingual Experience
- **Interactive AI Guide (`AIAssistant`)**: Instant conversational recommendations for crowd trends, secret food spots, and tailored hopping suggestions.
- **Full Bilingual Support**: Native toggle between **English** and **Bengali (বাংলা)** for authentic local accessibility.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend Framework** | [Next.js 15 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/) | High-performance Server & Client Components with static generation |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Strictly typed data models for pandals, transit, and routing |
| **Backend & Realtime** | [InsForge BaaS](https://insforge.dev) | PostgreSQL database, Auth, Realtime channels, and Edge functions |
| **Mapping Engine** | [Leaflet](https://leafletjs.com/) + OpenStreetMap | Interactive spatial map, custom marker pins, user radar, and polylines |
| **QR Engine** | `qrcode` | Instant vector QR code generation for room sharing |
| **Styling & Theme** | Vanilla CSS3 (Custom Design System) | Rich Bengal festive palette: *Sindoor Red*, *Terracotta*, *Alpana White*, *Soft Gold*, & *Dark Obsidian* |
| **Location Services** | 5-Tier Geolocation Engine | Multi-fallback GPS, HTML5 Geolocation API, IP fallbacks, and cached coords |

---

## 📁 Project Architecture

```plaintext
PujarHop/
├── app/                               # Next.js App Router Pages
│   ├── layout.tsx                     # Global layout, auth, language & favorites providers
│   ├── page.tsx                       # Landing page (Hero search, trending, quick transit)
│   ├── globals.css                    # Luxury Bengal heritage design tokens & styles
│   ├── explore/                       # 248+ Pandal catalog with multi-facet filtering
│   ├── pandal/[id]/                   # Pandal detail page with Art & Cultural Dossier
│   ├── route/                         # Multi-modal route finder & scoring comparison
│   ├── planner/                       # TSP-powered multi-stop day itinerary optimizer
│   ├── metro/                         # Dedicated Kolkata Metro Hopping Guide (45 stations)
│   ├── bus/                           # Dedicated Kolkata Bus Route Navigator (180+ routes)
│   ├── hop/                           # Real-time group rooms ("Hop with Friends")
│   │   ├── page.tsx                   # Room creation and join portal
│   │   ├── join/                      # QR & code entry gateway
│   │   └── room/[code]/               # Live room dashboard, radar map & shared itinerary
│   ├── nearby/                        # Geolocation proximity radar
│   ├── nearby-toilets/                # Public restrooms and hygiene amenities map
│   ├── favorites/                     # Saved pandals drawer with 1-click plan export
│   ├── emergency/                     # Police, medical, and fire emergency helplines
│   ├── login/                         # User authentication & session management
│   └── about/                         # Platform heritage mission & cultural roots
├── components/                        # Reusable UI & Geospatial Components
│   ├── AIAssistant.tsx                # Interactive AI festival chatbot advisor
│   ├── CrowdBadge.tsx                 # Live crowd level indicator with pulse animations
│   ├── FavoriteButton.tsx             # Bookmark toggle with persistent storage
│   ├── Footer.tsx                     # Heritage footer with cultural attribution
│   ├── HopMap.tsx                     # Live multiplayer radar map with member markers
│   ├── HopMemberList.tsx              # Active room members, sharing status & compass
│   ├── HopRoomQRCode.tsx              # Vector QR generator for instant room joins
│   ├── Icons.tsx                      # Handcrafted SVG transit and cultural iconography
│   ├── LeafletMap.tsx                 # Core interactive map with layer toggles
│   ├── MetroPujaPlanner.tsx           # Metro-centric pandal discovery component
│   ├── MobileBottomNav.tsx            # Sticky mobile bottom navigation bar
│   ├── Navbar.tsx                     # Responsive header with search and language toggle
│   ├── PandalCard.tsx                 # Luxury card with authentic photo & transit badges
│   ├── RouteCard.tsx                  # Transit option summary card (Metro/Walk/Bus/Cab)
│   ├── RouteComparison.tsx            # Side-by-side travel options & scoring formula
│   ├── SearchBar.tsx                  # Real-time search with autocomplete suggestions
│   └── TransportCard.tsx              # Transit mode details card
├── lib/                               # Data Access, Models & Utilities
│   ├── api.ts                         # Unified data query interface
│   ├── auth-context.tsx               # InsForge authentication state provider
│   ├── favorites-context.tsx          # Saved bookmarks state & sync
│   ├── geo.ts                         # Haversine distance, bearings & geometric utilities
│   ├── guest-id.ts                    # Anonymous persistent guest identifier for hop rooms
│   ├── hop-room.ts                    # Realtime hop room management & Postgres integration
│   ├── i18n.ts                        # English & Bengali (বাংলা) translations dictionary
│   ├── insforge.ts                    # InsForge client initialization
│   ├── language-context.tsx           # Multi-language context provider
│   ├── location-service.ts            # 5-tier robust GPS / IP / cache location engine
│   ├── realtime-location.ts           # WebSocket live location publisher & subscriber
│   ├── routing-service.ts             # OSRM & local multi-stop routing calculations
│   ├── generated-pujas.ts             # 248 fully geocoded pandal database
│   ├── generated-metro.ts             # 45 Kolkata Metro stations across all lines
│   ├── generated-buses.ts             # 180 bus routes, 54 stop hubs & pandal mappings
│   ├── generated-art-details.ts       # Art, sculptors, lighting, and committee socials
│   ├── generated-food.ts              # Curated eateries, street food, and heritage cabins
│   └── generated-toilets.ts           # Clean public restrooms & accessibility points
├── public/                            # Static Assets
│   ├── icon.png                       # Platform logo
│   └── images/pandals/                # 200+ authentic optimized puja cover photos
└── scripts/                           # Data Processing & Test Automation Pipelines
    ├── import-data.mjs                # CSV data parsing & geocoding normalizer
    ├── parse-toilets.mjs              # Restroom dataset parser
    ├── process-pandal-images.py       # Image resizing, JPEG optimization & linking
    ├── test-collaborative-pandals.mjs # Hop room itinerary tests
    └── test-hop-e2e.mjs               # Realtime room end-to-end integration tests
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.18.0 or higher recommended)
- `npm`, `pnpm`, or `yarn`

### 1. Clone the Repository
```bash
git clone https://github.com/sagnik-devv/PujarHop.git
cd PujarHop
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_INSFORGE_URL=https://j4g5vd5y.ap-southeast.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your_insforge_anon_key_here
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Development Server
```bash
npm run dev
```
Open your browser and visit:
```
http://localhost:3000
```

### 5. Production Build
```bash
npm run build
npm run start
```
*Compiles static and dynamic routes with 100% type-safety across all pandal and transit endpoints.*

---

## 👥 The Engineering & Design Team

**PUJO NAVIGATION** was conceptualized, engineered, and designed with devotion for the City of Joy by:

<div align="center">

| Member | Focus & Contributions | Profile |
|---|---|---|
| **Sagnik Chakraborty** | Core Architecture, Routing Optimization, Data Pipelines & Backend Systems | [![GitHub](https://img.shields.io/badge/GitHub-sagnik--devv-181717?style=flat&logo=github)](https://github.com/sagnik-devv) |
| **Debalin Sinha** | Frontend Engineering, Bengal Heritage Design System & Mobile UX | [![GitHub](https://img.shields.io/badge/GitHub-debalin--devv-181717?style=flat&logo=github)](https://github.com/debalin-devv/) |
| **Kanak Goswami** | Transit Intelligence, Geospatial Ingestion & Cultural Research | [![GitHub](https://img.shields.io/badge/GitHub-goswamikonok--hash-181717?style=flat&logo=github)](https://github.com/goswamikonok-hash) |

</div>

---

## 📜 Cultural Heritage & Ethical Attribution

This project is created to honor and support the **UNESCO Intangible Cultural Heritage of Humanity** — **Durga Puja in Kolkata**. 

- All pandal themes, artisan tributes, and committee imagery remain the cultural and intellectual property of their respective clubs, sculptors, and organizers.
- Civic data (Metro and Bus routes) is structured for public accessibility and festive crowd management.

---

<div align="center">

**শুভ শারদীয়া! Happy Pandal Hopping!**  
*Built with ❤️ for Kolkata.*

</div>

# UniMapr 📍📅
**UniMapr** is a mobile-first application designed to help university students discover events, manage schedules, and navigate campus spaces in one unified platform.

The project was inspired by the fragmented student experience at large universities, where events, calendars, and navigation are spread across multiple disconnected systems.This app explores how these workflows can be consolidated into a single, student-centric app.


This project is an **active MVP / work-in-progress**, built to explore real-world mobile app development, backend integration, and product thinking.

---

## 🚀 What UniMapr Is About
University life is fragmented across multiple tools: event pages, maps, calendars, group chats, and spreadsheets. UniMapr aims to unify these into a single, student-centric experience where users can:

- Discover what’s happening on campus
- Manage personal and shared schedules
- Navigate locations easily
- Engage socially around events and campus activity

---
## ▶️ Demo


https://github.com/user-attachments/assets/36576f31-5484-4fb9-b753-50564adab094




---
## 🛠 Tech Stack

### Frontend
- **Expo (React Native)** — cross-platform mobile development
- **Expo Router** — file-based routing
- **JavaScript + TypeScript (mixed)**

### Backend & Services
- **Supabase**
  - Authentication
  - PostgreSQL database
  - Storage
  - Row Level Security (RLS)
  - live time subscriptions

### Maps & Calendar
- **Mapbox** — interactive campus maps
- **iCal parsing** — calendar ingestion & syncing
- Custom calendar utilities & hooks
- react-native-calendar-kit (howljs)

---
## What Users Can Do

- Sign up and manage a personal profile
- View and edit their timetable
- Import external calendars (iCal)
- Browse upcoming events
- View campus locations on a map
- Create posts and interact socially (like, comment, share)
- Manage personal events and preferences

---
## 📂 Project Structure

```text
app/            # Screens and routes (Expo Router)
components/     # Reusable UI components
services/       # Supabase & API logic
lib/            # Shared utilities (calendar, hooks)
constants/      # App constants and config
assets/         # Images, icons, styles
```
---
## 🧠 What I Learned Doing this project

### Mobile & Frontend Engineering
- Structuring a real-world Expo / React Native application
- Managing navigation with file-based routing
- Building reusable component layers
- Handling async data and UI state safely

### Client–Server Architecture
- Client-server request/response flow
- REST APIs using HTTP methods (GET, POST, PUT, DELETE)
- Stateless communication between mobile client and backend

### Networking & Web Fundamentals
- **IP addresses** as unique identifiers for devices
- **DNS** as the translation layer between domains and IPs
- **HTTP vs HTTPS** and TLS-based encryption
- Understanding **latency** and its impact on UX

### Backend & Databases
- Using **SQL (PostgreSQL)** for structured relational data
- Data normalization to reduce redundancy
- Understanding trade-offs with denormalization for performance
- Indexing strategies for faster reads
- Pagination and windowed queries for scalability

### Supabase Services
- Authentication flows and session handling
- Secure access using Row Level Security (RLS)
- Storage buckets for user-generated content
- Service-layer abstraction instead of inline queries

### Cloud & Distributed Systems (Conceptual)
- Blob storage concepts (e.g., Amazon S3-style buckets)
- CDN usage to reduce latency
- Horizontal vs vertical scaling
- Load balancing fundamentals
- Replication and availability strategies

### Repo Hygiene & Engineering Discipline
- Proper `.gitignore` usage
- Environment variable separation
- Commit hygiene and logical commit grouping

### Product & Architecture Trade-offs
- Speed vs long-term architecture
- MVP decision-making
- When to abstract vs move fast

---

## 🔧 What I Can Improve / Next Steps

- Maybe migrate to TypeScript
- Automated testing (unit + integration)
- Performance optimisation for large calendars
- Notifications and reminders (yet to do)
- Accessibility improvements
- UI/UX consistency and polish (some parts are made using AI, some parts are extremely basic)
- CI/CD pipeline setup
- Improved system modularisation
- testing on real devices this will help improve the UX, button, color, haptic feedback etc

---

## ▶️ How to Run Locally

### 🔸1. Install dependencies
```bash
npm install
```

### 🔸2.Create a .env file using .env.example:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_MAPBOX_TOKEN=
```

### 🔸3. Start the App
```
npx expo start
```

You can run the app using:
iOS Simulator
Android Emulator
Expo Go (limited)
Development build

---
### 📚 Sources & Learning Resources
- Expo Documentation — https://docs.expo.dev
- React Native Docs — https://reactnative.dev
- Supabase Docs — https://supabase.com/docs
- Mapbox Docs — https://docs.mapbox.com
- iCalendar Specification — https://icalendar.org
- System Design fundamentals (scaling, caching, APIs)

---
## Use of Existing Libraries & AI Assistance

This project uses established open-source libraries where appropriate rather than reimplementing solved problems.

The calendar functionality is built using `react-native-calendar-kit`, which was adapted and integrated into UniMapr’s UI, state management, and data flow to fit the product’s requirements.

AI tools were used selectively to accelerate development, primarily for:
- exploring implementation approaches
- refining logic in complex areas (calendar handling and map integration)
- reducing boilerplate

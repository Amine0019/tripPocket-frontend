# ✈️ TripPocket — Frontend Web Application

![Angular](https://img.shields.io/badge/Angular-18.2-DD0031.svg?logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg?logo=typescript)
![Signals](https://img.shields.io/badge/Reactive-Angular%20Signals-purple.svg)
![RxJS](https://img.shields.io/badge/RxJS-7.8-B7178C.svg?logo=reactivex)
![SCSS](https://img.shields.io/badge/Style-SCSS-CC6699.svg?logo=sass)
![Chart.js](https://img.shields.io/badge/Charts-Chart.js-FF6384.svg?logo=chartdotjs)
![Google Gemini](https://img.shields.io/badge/Chatbot-Gemini%203.8%20Flash-4285F4.svg?logo=google)

TripPocket Frontend is a responsive single-page web application (SPA) built with **Angular 18** and **TypeScript**. Designed with an **architecture 100% based on Standalone Components and native Angular Signals**, it provides a front-office for travelers and an administrative back-office for travel managers.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Frontoffice vs Backoffice](#-frontoffice-vs-backoffice)
- [Technology Stack](#-technology-stack)
- [Architecture & Design Patterns](#-architecture--design-patterns)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Environment Configuration](#-environment-configuration)
- [Installation & Running](#-installation--running)
- [Available Scripts](#-available-scripts)
- [Application Routes](#-application-routes)
- [Connecting with the Backend](#-connecting-with-the-backend)

---

## 🚀 Key Features

* **Modern Standalone Architecture**: No legacy `NgModule` declarations — all components, directives, and pipes are lightweight and standalone.
* **Fine-Grained Reactivity (Signals)**: Seamless state updates with Angular `signal()`, `computed()`, and reactive stores (`TravelStore`).
* **Authentication & Role Protection**:
  * JWT access token management and HttpOnly refresh token cookie support.
  * Route protection using functional guards (`authGuard` and `roleGuard`).
  * Google OAuth2 One-Tap authentication integration.
* **Expense & Budget Tracking (`expensemodule`)**:
  * Real-time expense tracking by trip and category (`FOOD`, `TRANSPORT`, `ACCOMMODATION`, `ACTIVITIES`, `OTHER`).
  * Trip budget setting, percentage consumed calculation, and over-budget visual indicators.
* **Conversational AI Assistant**:
  * Floating, multilingual AI chatbot widget integrated into the traveler layout, connected to **Google Gemini 3.8 Flash**.
* **Admin AI Tools**:
  * Automated trip itinerary and marketing tagline generator connected to Groq AI.

---

## 🧭 Frontoffice vs Backoffice

### 🏖️ Frontoffice (Traveler Space)
| Page / Component | Route | Description |
| :--- | :--- | :--- |
| **Explore Trips** | `/trips` | Search, filter by pace, destination, and budget, view trip cards. |
| **Trip Details** | `/trips/:id` | Day-by-day itinerary view, highlight tags, activity list, and pricing. |
| **Activities** | `/activities` | Explore local activities and add them to travel plans. |
| **Booking Tunnel** | `/booking/:tripId` | Select travelers, review total price, choose payment method, and confirm booking. |
| **My Reservations** | `/reservations` | View booking history, confirmation numbers, and real-time status. |
| **Expenses & Budget** | `/expenses` | Track trip expenses, view category breakdowns, and monitor spending budgets. |
| **AI Travel Assistant** | Floating Widget | Ask questions, discover tips, and get advice in real time. |
| **Account & Profile** | `/profile` | Manage personal profile details and session. |

### 🛠️ Backoffice (Admin Space)
Accessible only by users with the `ROLE_ADMIN` role at `/admin/*`:

| Page / Component | Route | Description |
| :--- | :--- | :--- |
| **Admin Dashboard** | `/admin/dashboard` | Key performance indicators (KPIs), booking statistics, and charts. |
| **User Management** | `/admin/users` | List, search, edit roles, toggle active/disabled status, and view profiles. |
| **Trip Management** | `/admin/trips` | Full CRUD for trips, cover image upload, and AI itinerary generation. |
| **Activity Catalog** | `/admin/activities` | Create and associate activities with trips. |
| **Reservation Moderation** | `/admin/reservations` | Review, validate, or cancel traveler reservations. |

---

## 🛠 Technology Stack

* **Framework**: Angular 18.2 (Standalone Components)
* **Language**: TypeScript 5.5
* **Reactivity**: Angular Signals (`signal`, `computed`), RxJS 7.8
* **Styling**: SCSS (CSS variables, responsive design, custom animations)
* **UI Libraries**:
  * Angular CDK / Material 18.2
  * FontAwesome Free 7.3
  * SweetAlert2 (Modals & alerts)
  * Chart.js 4.5 (Analytics & visualizations)
* **Build System**: Angular CLI 18.2, Vite/esbuild bundler

---

## 📂 Project Structure

```text
tripPocket-frontend/
├── package.json
├── angular.json
├── tsconfig.json
└── src/
    ├── index.html
    ├── styles.scss                 # Global design system & theme variables
    ├── environments/
    │   ├── environment.ts          # Local development API URLs
    │   └── environment.prod.ts     # Production settings
    └── app/
        ├── app.component.ts        # Root component hosting Navbar, RouterOutlet, Chatbot
        ├── app.config.ts           # Providers (provideRouter, provideHttpClient, etc.)
        ├── app.routes.ts           # Functional routing table with Guards
        ├── core/
        │   ├── guards/             # authGuard, roleGuard
        │   ├── interceptors/       # HTTP interceptors (JWT auth injection)
        │   ├── models/             # TypeScript interfaces & enums
        │   └── services/           # Api services (Auth, Trip, Activity, Reservation, Toast, TravelStore)
        ├── pages/
        │   ├── admin/              # Admin dashboard, users, trips, reservations
        │   ├── booking/            # Booking checkout flow
        │   ├── expenses/           # Expenses & budget tracking page
        │   ├── explore-trips/      # Trips catalog
        │   ├── trip-details/       # Trip details & itinerary
        │   └── login / register / forgot-password / reset-password
        └── shared/
            ├── components/         # Navbar, ExpenseCard, Modal, EmptyState, ChatbotUser
            ├── directives/         # Fallback image directive
            └── models/             # Shared view models & enums
```

---

## 📋 Prerequisites

* **Node.js**: `v18.x` or `v20.x` (LTS recommended)
  ```powershell
  node -v
  ```
* **npm**: `v9.x` or `v10.x`
  ```powershell
  npm -v
  ```

---

## ⚙️ Environment Configuration

The backend API URL and Google OAuth Client ID are configured in [src/environments/environment.ts](file:///d:/TripPocket/tripPocket-frontend/src/environments/environment.ts):

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8089/tripPocketBackend/api',
  googleClientId: '947242197289-ne1ij44tp18ij1t1anbo1ud50cftimfk.apps.googleusercontent.com'
};
```

---

## 🏃 Installation & Running

1. **Navigate to the frontend directory**:
   ```powershell
   cd tripPocket-frontend
   ```

2. **Install project dependencies**:
   ```powershell
   npm install
   ```

3. **Start the development server**:
   ```powershell
   npm start
   ```
   *(or `npx ng serve`)*

4. **Access the application**:
   Open your browser and navigate to:
   ```text
   http://localhost:4200/
   ```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm start` | Starts the Angular development server on `http://localhost:4200` with hot-reload. |
| `npm run build` | Compiles the application and generates the production bundle in `dist/`. |
| `npm test` | Executes unit tests via Karma and Jasmine. |
| `npx tsc --noEmit` | Runs strict TypeScript type checking across the entire project. |
| `npm run lint` | Runs Angular ESLint to verify code quality. |

---

## 🗺️ Application Routes

```text
/                              -> Redirects to /trips
/login                         -> Sign In (Email/Password or Google)
/register                      -> Sign Up
/forgot-password               -> Request password reset link
/reset-password                -> Reset password with token

[Traveler Protected - authGuard]
/trips                         -> Catalog of available trips
/trips/:id                     -> Trip itinerary, activities & details
/activities                    -> Catalog of activities
/booking/:tripId               -> Reservation & checkout tunnel
/reservations                  -> Traveler's booking history
/expenses                      -> Expense tracking & budget management
/profile                       -> User profile settings

[Admin Protected - authGuard + roleGuard: ROLE_ADMIN]
/admin/dashboard               -> Analytics & KPIs
/admin/users                   -> User list & roles
/admin/trips                   -> Trip management (Add/Edit + AI)
/admin/activities              -> Activity management
/admin/reservations            -> Reservation approval & moderation
```

---

## 🔗 Connecting with the Backend

To ensure all frontend features work seamlessly:
1. Start the Spring Boot backend (`tripPocket-backend`) on port `8089`.
2. Confirm the context path is `http://localhost:8089/tripPocketBackend/api`.
3. In your browser on `http://localhost:4200`, log in or register to acquire your JWT token and start exploring!

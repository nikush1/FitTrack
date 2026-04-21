# FitTrack 🏋️

A mobile-first fitness tracking web app built with React, Firebase, and Tailwind CSS. Log your diet, workouts, and weight — all in one place, with real-time sync across devices.

---

## Features

- **Dashboard** — Daily overview of calories, protein, workout streak, and an AI-powered fitness tip tailored to your goals.
- **Diet Tracker** — Log meals with calorie and protein counts; track progress toward daily goals.
- **Workout Logger** — Record exercises with sets, reps, weight, and duration.
- **Weight Tracker** — Log body weight over time with a progress chart (Recharts).
- **Profile** — Set your fitness goal (cut / maintain / bulk), calorie & protein targets, and preferred weight unit (kg / lbs).
- **Authentication** — Email/password sign-up and login via Firebase Auth.
- **Streak tracking** — Automatically calculated from consecutive workout days.
- **Firestore security rules** — Each user can only read/write their own data.

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | React 18, React Router v6           |
| Styling      | Tailwind CSS 3                      |
| Charts       | Recharts 2                          |
| Date utils   | date-fns 3                          |
| Backend/DB   | Firebase (Auth + Firestore)         |
| Build tool   | Vite 7                              |

---

## Project Structure

```
fittrack/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── .env.example
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── context/
    │   ├── AuthContext.jsx       # Firebase Auth state & user profile
    │   └── AppContext.jsx        # Global data (diet, workout, weight logs)
    ├── pages/
    │   ├── Auth.jsx              # Login / Sign-up page
    │   ├── Dashboard.jsx         # Home screen with daily summary
    │   ├── Diet.jsx              # Meal logging
    │   ├── Workout.jsx           # Exercise logging
    │   ├── Weight.jsx            # Weight logging & chart
    │   └── Profile.jsx           # User settings & goals
    ├── components/
    │   ├── BottomNav.jsx         # Mobile navigation bar
    │   ├── Modal.jsx             # Reusable modal dialog
    │   ├── Toast.jsx             # Toast notifications
    │   ├── ProgressBar.jsx       # Calorie/protein progress indicator
    │   └── EmptyState.jsx        # Empty list placeholder
    ├── firebase/
    │   ├── config.js             # Firebase initialisation
    │   └── firestore.js          # Firestore read/write helpers
    └── utils/
        └── fitnessSuggestion.js  # Rule-based daily tip generator
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with **Firestore** and **Authentication** (Email/Password) enabled

### 1. Clone and install

```bash
git clone <your-repo-url>
cd fittrack
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your Firebase credentials:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Deploy Firestore rules and indexes

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore
```

### 4. Run locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 5. Build for production

```bash
npm run build
npm run preview   # optional: preview the production build locally
```

---

## Available Scripts

| Command         | Description                        |
|-----------------|------------------------------------|
| `npm run dev`   | Start the Vite dev server          |
| `npm run build` | Build for production               |
| `npm run preview` | Preview the production build     |

---

## Firestore Data Model

| Collection    | Document fields                                                        |
|---------------|------------------------------------------------------------------------|
| `users`       | `name`, `goal`, `calorieGoal`, `proteinGoal`, `weightUnit`            |
| `dietLogs`    | `userId`, `date`, `food`, `calories`, `protein`, `createdAt`          |
| `workoutLogs` | `userId`, `date`, `exercise`, `sets`, `reps`, `weight`, `duration`, `createdAt` |
| `weightLogs`  | `userId`, `date`, `weight`, `createdAt`                               |

Security rules ensure every user can only access documents where `userId == auth.uid`.

---

## Environment Variables Reference

All variables must be prefixed with `VITE_` to be exposed to the browser by Vite.

| Variable                          | Description                        |
|-----------------------------------|------------------------------------|
| `VITE_FIREBASE_API_KEY`           | Firebase project API key           |
| `VITE_FIREBASE_AUTH_DOMAIN`       | Firebase auth domain               |
| `VITE_FIREBASE_PROJECT_ID`        | Firestore project ID               |
| `VITE_FIREBASE_STORAGE_BUCKET`    | Firebase storage bucket            |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID                    |
| `VITE_FIREBASE_APP_ID`            | Firebase app ID                    |
| `VITE_FIREBASE_MEASUREMENT_ID`    | Google Analytics measurement ID    |

---

## License

MIT

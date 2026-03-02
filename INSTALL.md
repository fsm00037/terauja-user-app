# Installation Guide - Terauja User App

Follow these steps to set up and run the Patient Application locally.

## 📋 Prerequisites
- **Node.js** (LTS version recommended)
- **npm** (comes with Node.js)

## 🛠️ Step-by-Step Setup

### 1. Install Dependencies
Navigate to the project directory and run:

```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory. This project heavily relies on **Firebase**, so ensure you have the following keys configured if needed:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- (and other Firebase config variables)

### 3. Running the Development Server
Start the application in development mode:

```bash
npm run dev
```

The application will be available at [http://localhost:3001](http://localhost:3001) (or the port specified in the terminal, usually 3001 to avoid conflict with the main frontend).

## 🚀 Production Build

To create an optimized production build:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

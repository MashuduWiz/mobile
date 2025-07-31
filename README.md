# Mobile Inventory App

A mobile inventory management application built with Ionic Vue and Capacitor.

## App Configuration

### App Identifier
- **App ID**: `com.mobileinventory.app`
- **App Name**: Mobile Inventory
- **Platform**: Android (iOS support can be added later)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Scanbot SDK License Setup
To use the barcode scanner functionality, you need a Scanbot SDK license:

1. Visit [Scanbot SDK License](https://scanbot.io/sdk-license/)
2. Request a license key for your app
3. Provide the app identifier: `com.mobileinventory.app`
4. Replace the placeholder in `src/services/scanbotService.ts`:
   ```typescript
   licenseKey: "YOUR_ACTUAL_LICENSE_KEY_HERE"
   ```

### 3. Build and Run
```bash
# Development
npm run dev

# Build for production
npm run build

# Add Android platform
npx cap add android

# Sync changes
npx cap sync

# Open in Android Studio
npx cap open android
```

## Features

- **Barcode Scanner**: Single and multiple barcode scanning
- **Inventory Management**: Track and manage inventory items
- **Route Planning**: Plan delivery routes with Google Maps integration
- **User Authentication**: Firebase-based authentication system

## Project Structure

```
src/
├── components/          # Reusable Vue components
├── pages/              # Page components
├── services/           # API and external service integrations
├── stores/             # Pinia state management
├── types/              # TypeScript type definitions
└── views/              # Main view components
```

## Dependencies

- **Ionic Vue**: UI framework
- **Capacitor**: Native functionality
- **Scanbot SDK**: Barcode scanning
- **Firebase**: Authentication and backend
- **Google Maps**: Location and routing services 
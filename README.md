# Countdown Timer App

A beautiful iOS countdown timer app built with React Native and Expo. Set a target date, track your progress with a todo list, and watch the time tick down with smooth animations.

![React Native](https://img.shields.io/badge/React_Native-0.76-blue)
![Expo](https://img.shields.io/badge/Expo-SDK_52-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

## Features

- **Animated Countdown Timer** - Real-time countdown with days, hours, minutes, and seconds
- **Todo List** - Track tasks related to your countdown goal with progress indicator
- **Date Picker** - Native iOS-style date and time selector
- **Beautiful Animations** - Smooth transitions powered by Reanimated 3
- **Particle Effects** - Floating background particles for visual appeal
- **Haptic Feedback** - Tactile responses on interactions
- **Dark Theme** - Elegant purple/blue gradient design
- **Data Persistence** - Your countdown and todos are saved locally

## Screenshots

The app features:
- A stunning gradient background with floating particles
- Large, animated countdown digits
- Clean todo list with completion tracking
- Smooth modal animations for date selection

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app on your iOS device (for testing)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd counterDownMobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. Scan the QR code with Expo Go on your iPhone

### Running on Simulator

If you have Xcode installed (Mac only):
```bash
npx expo run:ios
```

## Project Structure

```
src/
├── components/
│   ├── CountdownTimer.tsx    # Animated countdown display
│   ├── TodoItem.tsx          # Individual todo with animations
│   ├── TodoList.tsx          # Todo list with progress bar
│   ├── DatePickerModal.tsx   # Date/time picker modal
│   └── ParticleBackground.tsx # Floating particle effects
├── screens/
│   └── HomeScreen.tsx        # Main screen
├── types/
│   └── index.ts              # TypeScript interfaces
└── utils/
    ├── time.ts               # Time calculation helpers
    └── storage.ts            # AsyncStorage persistence
```

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and build tools
- **TypeScript** - Type-safe JavaScript
- **react-native-reanimated** - High-performance animations
- **react-native-gesture-handler** - Native gesture handling
- **expo-linear-gradient** - Gradient backgrounds
- **expo-haptics** - Haptic feedback
- **@react-native-async-storage/async-storage** - Local data persistence
- **@react-native-community/datetimepicker** - Native date picker

## Usage

1. **Set a Target Date** - Tap "Set Target Date" and choose your countdown destination
2. **Add a Title** - Tap the title area to name your countdown event
3. **Add Tasks** - Use the input field to add tasks related to your goal
4. **Track Progress** - Check off tasks as you complete them
5. **Reset** - Use "Reset Countdown" to start fresh

## Building for Production

### iOS Build
```bash
npx expo build:ios
# or with EAS
eas build --platform ios
```

### Android Build
```bash
npx expo build:android
# or with EAS
eas build --platform android
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

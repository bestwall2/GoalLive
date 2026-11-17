# GoalLive — Expo React Native starter

A dark, lightweight football companion app for Android and iOS, built with JavaScript and Expo SDK 58.

## Included
- Home dashboard with league filters and match cards
- Fixtures screen
- League standings screen
- Football news screen
- Match-centre detail view
- Responsive dark UI and bottom navigation

## Requirements
- Node.js 22.13.0 or newer
- Expo Go for SDK 58, or an SDK 58 development build

## Run
1. Clone this repository.
2. Install dependencies: `npm install`.
3. Align Expo package versions if needed: `npx expo install --fix`.
4. Start the development server: `npx expo start`.
5. Scan the QR code with the SDK 58 version of Expo Go.

## SDK compatibility
This project targets Expo SDK 58, React 19.3.0 and React Native 0.88.0. It was upgraded to match the Expo Go SDK 58 shown in the compatibility error. If you still see a version mismatch, remove the local `node_modules` and `.expo` folders, run `npm install`, then start Expo again.

## Important data note
The app currently uses clearly labelled sample data. It does **not** yet provide real live scores, verified fixtures, news, video streams, or match events. Connect a licensed football-data provider and your own backend before production. Do not embed unauthorised broadcast streams.

## Next production steps
- Choose a football data provider (fixtures, live scores, standings, line-ups, events).
- Add a backend proxy so API keys are not shipped in the mobile app.
- Add favourites, notifications, search, team pages, match statistics and Arabic/French/English localisation.
- Replace the placeholder app identifiers in `app.json` before publishing.

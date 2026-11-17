# GoalLive — Expo React Native starter

A dark, lightweight football companion app for Android and iOS, built with JavaScript and Expo.

## Included
- Home dashboard with league filters and match cards
- Fixtures screen
- League standings screen
- Football news screen
- Match-centre detail view
- Responsive dark UI and bottom navigation

## Run
1. Install Node.js (LTS).
2. In this folder run `npm install`.
3. Run `npx expo start`.
4. Scan the QR code with Expo Go, or use an Android/iOS simulator.

## Important data note
The app currently uses clearly labelled sample data. It does **not** yet provide real live scores, verified fixtures, news, video streams, or match events. Connect a licensed football-data provider and your own backend before production. Do not embed unauthorised broadcast streams.

## Next production steps
- Choose a football data provider (fixtures, live scores, standings, line-ups, events).
- Add a backend proxy so API keys are not shipped in the mobile app.
- Add favourites, notifications, search, team pages, match statistics and Arabic/French/English localisation.
- Replace the placeholder app identifiers in `app.json` before publishing.

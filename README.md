# GoalLive — Expo React Native football app

A lightweight dark-themed football companion app for Android and iOS, built with JavaScript and Expo SDK 58.

## Live football data

GoalLive uses the public REST API from [rezarahiminia/livescoreFootball](https://github.com/rezarahiminia/livescoreFootball).

- API base: `https://worldcup26.ir/get/soccer`
- No API key is currently required by the provider's documentation.
- The app discovers available competitions from the API; it does not hard-code fake teams, scores, fixtures or standings.
- Fixtures, live scores and results come from the selected competition's `fixtures` endpoint.
- League tables come from `standings`.
- Match centre loads the stored summary and important play-by-play events.
- Match cards refresh periodically while Home or Fixtures is open. Pull down to refresh manually.

## Current API coverage and limitations

The provider currently verifies coverage mainly for England and Spain. The app displays only competitions returned by its available-leagues endpoint. A competition can have no matches or standings if the provider has not stored those data yet.

The API currently does **not** provide a validated league-wide top-scorers endpoint or a general football-news feed. Match-specific news/videos may be included in a match summary when available. GoalLive does not invent these data and does not provide unauthorised live TV streams.

The provider reads stored MongoDB snapshots. Real-time freshness depends on its separate upstream listener and last successful sync, not on the mobile app polling interval. Check the provider's API documentation and service metadata for current freshness and coverage.

## Provider documentation

- [Source repository](https://github.com/rezarahiminia/livescoreFootball)
- [API guide](https://worldcup26.ir/football-api)
- [Interactive API docs](https://worldcup26.ir/api-docs)
- [API service metadata](https://worldcup26.ir/get/soccer/meta)

## Requirements

- Node.js 22.13.0 or newer
- Expo Go compatible with SDK 58, or an SDK 58 development build

## Run

1. Clone this repository.
2. Install dependencies: `npm install`.
3. Align Expo package versions if needed: `npx expo install --fix`.
4. Start the development server: `npx expo start --clear`.
5. Scan the QR code with Expo Go.

## SDK compatibility

This project targets Expo SDK 58, React 19.3.0 and React Native 0.88.0. If local dependencies are out of sync, remove `node_modules` and `.expo`, run `npm install`, then `npx expo install --fix`.

## Data and licensing

GoalLive consumes the provider's public API. The provider repository's ISC licence applies to its source code; it does not by itself grant a separate licence to third-party football data, logos, images, news, or video. Review the provider's terms and data rights before publishing or monetising the app.

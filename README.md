# Scorecard

An offline Rummy scorekeeper for iPhone and Android, built with React Native and Expo.

## Included

- Ordered 2–6-player setup; seats are never alphabetized or rearranged after start.
- Configurable cumulative elimination score (default 200), first drop (24), and middle drop (48).
- Per-round winner, manual score, first-drop, and middle-drop entry.
- Automatic elimination at the configured total, full round history, and undo-last-round.
- Live, player-specific drop insight: safe points remaining, projected total after either drop, and optional estimated-hand comparison.
- Local, on-device persistence with no account, server, payments, or card gameplay.

## Run locally

1. Install Node.js LTS and Xcode on a Mac.
2. In this folder, run `npm install`.
3. Start the app with `npm run ios`, then open it in an iOS Simulator or Expo Go.

## Publish to the App Store

The app is configured for Expo Application Services (EAS), but actual publishing requires the account owner to supply an Apple Developer membership and App Store Connect access.

1. Replace `com.scorecard.app` in `app.json` with a unique bundle identifier owned by the publisher.
2. Create the app record in App Store Connect, set the privacy policy/support URLs, age rating, category, price, and screenshots.
3. Authenticate the publisher with Expo and Apple, then run `npx eas-cli@latest build --platform ios --profile production`.
4. Test the build through TestFlight and submit the selected build for App Review.

Before submission, verify all final store metadata and the published privacy policy with the account owner.

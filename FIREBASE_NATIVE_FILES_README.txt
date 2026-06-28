You need two files here before building natively (EAS build will fail
without them, since app.json references them):

1. `GoogleService-Info.plist` — download from Firebase Console:
   Project Settings > Your apps > iOS app > download this file.
2. `google-services.json` — same screen, but for your Android app.

If you haven't registered iOS/Android apps in Firebase yet:
  Firebase Console > Project Settings > Add app > iOS / Android
  - iOS bundle ID must match `expo.ios.bundleIdentifier` in app.json.
  - Android package name must match `expo.android.package` in app.json.

Until these files exist, **Expo Go and `expo start` still work fine** —
this only affects native EAS builds. If you're not using Firebase yet,
remove the two `googleServicesFile` lines from app.json and the build
will proceed without them (auth will just stay in guest mode).

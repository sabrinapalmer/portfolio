# Map for iPhone

A native shell (Capacitor 7) around the same page the website serves at `/map`. The page detects the
shell and switches location, voice and screen-on to native plugins so directions continue with the
screen locked. Nothing here has been built or run on a device yet.

## First build (on the Mac)

Needs Xcode, Node 20+, and CocoaPods (`brew install cocoapods`).

```
git pull
npm install            # in the repo root (provides the map library)
cd ios-app
npm install
npm run sync           # copies public/map into www/ and updates the Xcode project
npm run open           # opens Xcode
```

In Xcode:

1. Select the **App** target, then **Signing & Capabilities**. Tick "Automatically manage signing"
   and choose your team.
2. If Xcode says the bundle identifier `com.sabrinapalmer.map` is taken or you want another, change it
   there and in `capacitor.config.json`.
3. Plug in the iPhone, choose it as the run destination, press Run.
4. On the phone, allow location "While Using the App" when asked. When you start directions, iOS may
   ask again to allow location in the background: choose "Change to Always Allow" or keep
   "While Using"; a blue location indicator shows while directions run with the screen locked.

## After changing the web page

`npm run sync` again, then Run in Xcode. The app carries its own copy of the page, so website
deploys do not change an installed app.

## What is native

| Function | Plugin |
|---|---|
| Location, including screen locked while directions run | @capacitor-community/background-geolocation |
| Spoken directions (plays over silent mode and in the background) | @capacitor-community/text-to-speech |
| Screen stays on during directions | @capacitor-community/keep-awake |

`Info.plist` already has the two location usage descriptions and the `location` and `audio`
background modes.

## Not done yet

- Launch screen is the Capacitor default.
- No App Store listing, privacy policy, or TestFlight setup.
- The app still uses the free public routing and search servers, which do not permit a sold app.

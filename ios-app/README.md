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

| Function | Where |
|---|---|
| Location, including screen locked while directions run | @capacitor-community/background-geolocation |
| Spoken directions (lowers other audio only while speaking) | `VoicePlugin` in `App/AppDelegate.swift` |
| Screen stays on during directions | @capacitor-community/keep-awake |
| Next turn on the lock screen and in the Dynamic Island | `LiveNavPlugin` in `App/AppDelegate.swift`, drawn by the `BrinaNavWidget` target |
| In-app purchases | capacitor-plugin-cdv-purchase |

`Info.plist` has the location usage descriptions, the `location` and `audio` background modes, and
`NSSupportsLiveActivities`.

## One-time setup: the lock screen widget target

The lock-screen and Dynamic Island view needs its own Xcode target. The code is already in the repo;
Xcode has to create the target around it once.

1. Open the project (`npm run open`). File > New > Target... > **Widget Extension** > Next.
2. Product Name: `BrinaNavWidget`. Tick **Include Live Activity**. Untick Include Configuration App Intent.
   Finish, and choose **Activate** if asked about the scheme.
3. Xcode creates a `BrinaNavWidget` folder with sample files. Delete its generated `.swift` files
   (Move to Trash), then drag `ios/App/BrinaNavWidget/BrinaNavWidget.swift` from Finder into that group.
   Tick only the BrinaNavWidget target. Keep Xcode's own `Info.plist` and `Assets.xcassets`.
4. Select `App/NavActivity.swift` > File inspector (right panel) > Target Membership: tick both **App**
   and **BrinaNavWidget**.
5. BrinaNavWidget target > General: Minimum Deployments **iOS 16.1**. Signing & Capabilities: same Team
   as the App. Its bundle id should be `com.sabrinapalmer.map.BrinaNavWidget`.
6. Build and run on an iPhone, start directions, lock the phone.

The app still runs on iOS 15; there the lock-screen view is simply not shown.

## CarPlay (switched off until Apple approves)

The code is in place: `App/CarPlay.swift` (car screen, turn panel, `CarNavPlugin`), `App/SceneDelegate.swift`,
and the car-mode map page (`/map/?car=1`). It stays off until both steps below are done, so builds without it
behave exactly as before.

1. Ask Apple for the CarPlay navigation entitlement: https://developer.apple.com/contact/carplay/ ,
   choose **Navigation (turn-by-turn)**, app BrinaMaps (`com.sabrinapalmer.map`). Approval can take weeks.
2. When it is granted, add an `App.entitlements` file to the App target with
   `com.apple.developer.carplay-maps` = YES, set Build Settings > Code Signing Entitlements to `App/App.entitlements`,
   and regenerate the provisioning profile (Xcode does this with automatic signing).
3. Add this to `App/Info.plist` (it switches the app to scenes; `SceneDelegate` takes over the phone window):

```xml
<key>UIApplicationSceneManifest</key>
<dict>
	<key>UIApplicationSupportsMultipleScenes</key>
	<true/>
	<key>UISceneConfigurations</key>
	<dict>
		<key>UIWindowSceneSessionRoleApplication</key>
		<array>
			<dict>
				<key>UISceneConfigurationName</key>
				<string>Phone</string>
				<key>UISceneDelegateClassName</key>
				<string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>
				<key>UISceneStoryboardFile</key>
				<string>Main</string>
			</dict>
		</array>
		<key>CPTemplateApplicationSceneSessionRoleApplication</key>
		<array>
			<dict>
				<key>UISceneConfigurationName</key>
				<string>CarPlay</string>
				<key>UISceneDelegateClassName</key>
				<string>$(PRODUCT_MODULE_NAME).CarPlaySceneDelegate</string>
			</dict>
		</array>
	</dict>
</dict>
```

4. Test: run on the iPhone simulator, then I/O > External Displays > CarPlay. Start directions on the phone;
   the car screen shows the map following you and the next turn. Check that the phone app still opens links and
   restores purchases after the switch to scenes.

What the car screen does now: mirrors directions started on the phone. Not yet: choosing a destination or
searching from the car screen.

## Not done yet

- Launch screen is the Capacitor default.

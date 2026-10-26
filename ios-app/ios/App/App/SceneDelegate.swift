// The phone screen as a "scene". Only used once CarPlay is turned on: CarPlay needs the app to run on scenes, and
// then the phone window comes from here (Main.storyboard, BrinaViewController) instead of AppDelegate.
// Unused while Info.plist has no UIApplicationSceneManifest. See ios-app/README.md, "CarPlay".
import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?   // created from Main.storyboard by the scene configuration

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        for c in URLContexts { _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: c.url, options: [:]) }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
    }
}

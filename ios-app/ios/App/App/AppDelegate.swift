import UIKit
import Capacitor
import AVFoundation

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

// MARK: - Voice directions
// Speaks directions with the system voice. Other audio (music, videos, podcasts) is lowered only while a direction is
// being spoken, then handed back at full volume; spoken-word apps pause briefly instead of talking over the voice.
// (The community text-to-speech plugin kept other audio lowered the whole time the app was open.)
@objc(VoicePlugin)
public class VoicePlugin: CAPPlugin, CAPBridgedPlugin, AVSpeechSynthesizerDelegate {
    public let identifier = "VoicePlugin"
    public let jsName = "Voice"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "speak", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise)
    ]
    private let synth = AVSpeechSynthesizer()
    private var waiting: CAPPluginCall?

    override public func load() { synth.delegate = self }

    @objc func speak(_ call: CAPPluginCall) {
        let text = call.getString("text") ?? ""
        let lang = call.getString("lang") ?? "en-US"
        DispatchQueue.main.async {
            if self.synth.isSpeaking { self.synth.stopSpeaking(at: .immediate) }
            self.waiting?.resolve(); self.waiting = call
            guard !text.isEmpty else { call.resolve(); self.waiting = nil; return }
            let session = AVAudioSession.sharedInstance()
            try? session.setCategory(.playback, mode: .voicePrompt, options: [.duckOthers, .interruptSpokenAudioAndMixWithOthers])
            try? session.setActive(true)
            let u = AVSpeechUtterance(string: text)
            u.voice = AVSpeechSynthesisVoice(language: lang)
            u.rate = AVSpeechUtteranceDefaultSpeechRate
            self.synth.speak(u)
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async { self.synth.stopSpeaking(at: .immediate); call.resolve() }
    }

    private func finished() {
        waiting?.resolve(); waiting = nil
        // Give the other audio its volume back once nothing more is being said
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            if !self.synth.isSpeaking { try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation) }
        }
    }
    public func speechSynthesizer(_ s: AVSpeechSynthesizer, didFinish u: AVSpeechUtterance) { finished() }
    public func speechSynthesizer(_ s: AVSpeechSynthesizer, didCancel u: AVSpeechUtterance) { finished() }
}

// MARK: - Lock screen and Dynamic Island during directions (Live Activity)
// The web app calls start when directions begin, update as the next turn or the distance changes, and end when
// they stop. Nothing happens on iOS before 16.1 or when the person turned Live Activities off for BrinaMaps.
@objc(LiveNavPlugin)
public class LiveNavPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveNavPlugin"
    public let jsName = "LiveNav"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise)
    ]
    private var current: Any?   // Activity<NavAttributes>, kept untyped so the class still loads on iOS 15

    #if canImport(ActivityKit)
    @available(iOS 16.1, *)
    private func state(_ call: CAPPluginCall) -> NavAttributes.ContentState {
        NavAttributes.ContentState(dist: call.getString("dist") ?? "", text: call.getString("text") ?? "",
                                   sym: call.getString("sym") ?? "arrow.up", arrive: call.getString("arrive") ?? "",
                                   left: call.getString("left") ?? "", progress: min(1, max(0, call.getDouble("progress") ?? 0)))
    }
    #endif

    @objc func start(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *), ActivityAuthorizationInfo().areActivitiesEnabled else { call.resolve(["on": false]); return }
        let st = state(call), attrs = NavAttributes(dest: call.getString("dest") ?? "")
        Task {
            for a in Activity<NavAttributes>.activities { await a.end(dismissalPolicy: .immediate) }   // one trip at a time
            do {
                let a: Activity<NavAttributes>
                if #available(iOS 16.2, *) {
                    a = try Activity.request(attributes: attrs, content: ActivityContent(state: st, staleDate: Date().addingTimeInterval(300)))
                } else {
                    a = try Activity.request(attributes: attrs, contentState: st)
                }
                self.current = a
                call.resolve(["on": true])
            } catch { call.resolve(["on": false, "error": error.localizedDescription]) }
        }
        #else
        call.resolve(["on": false])
        #endif
    }

    @objc func update(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *), let a = current as? Activity<NavAttributes> else { call.resolve(); return }
        let st = state(call)
        Task {
            if #available(iOS 16.2, *) { await a.update(ActivityContent(state: st, staleDate: Date().addingTimeInterval(300))) }
            else { await a.update(using: st) }
            call.resolve()
        }
        #else
        call.resolve()
        #endif
    }

    @objc func end(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *) else { call.resolve(); return }
        let arrived = call.getBool("arrived") ?? false
        let last = current as? Activity<NavAttributes>
        current = nil
        Task {
            // Arrived: leave "You have arrived" up for a few minutes; ended early: take it away now
            let policy: ActivityUIDismissalPolicy = arrived ? .after(Date().addingTimeInterval(240)) : .immediate
            for a in Activity<NavAttributes>.activities where last == nil || a.id == last!.id { await a.end(dismissalPolicy: policy) }
            call.resolve()
        }
        #else
        call.resolve()
        #endif
    }
}

// The app's web view, with BrinaMaps' own native pieces registered
class BrinaViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(VoicePlugin())
        bridge?.registerPluginInstance(LiveNavPlugin())
    }
}

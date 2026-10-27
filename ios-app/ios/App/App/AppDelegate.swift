import UIKit
import Capacitor
import AVFoundation
#if canImport(ActivityKit)
import ActivityKit   // lock screen / Dynamic Island (LiveNavPlugin below)
#endif
import UserNotifications   // leave-by reminders (RemindPlugin below)

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
        LiveNavPlugin.endAllNow()   // no trip left on the lock screen after the app is closed
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
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "voices", returnType: CAPPluginReturnPromise)
    ]
    private nonisolated(unsafe) let synth = AVSpeechSynthesizer()   // used only on the main queue

    // The best voice on this iPhone for a language: Premium, then Enhanced (both downloaded in Settings > Accessibility >
    // Spoken Content > Voices), then the built-in one; the exact region (en-US, es-MX) first. Novelty voices are left out.
    // Siri's own voices are not offered to apps by iOS.
    private static func ranked(_ lang: String) -> [AVSpeechSynthesisVoice] {
        let pre = String(lang.prefix(2))
        func rank(_ v: AVSpeechSynthesisVoice) -> Int {
            var r = v.language == lang ? 5 : 0
            if v.quality == .enhanced { r += 10 }
            if #available(iOS 16.0, *) { if v.quality == .premium { r += 20 } }
            return r
        }
        return AVSpeechSynthesisVoice.speechVoices()
            .filter { $0.language.hasPrefix(pre) && !$0.identifier.contains("speech.synthesis.voice") && !$0.identifier.contains("eloquence") }
            .sorted { rank($0) != rank($1) ? rank($0) > rank($1) : $0.name < $1.name }
    }

    @objc func voices(_ call: CAPPluginCall) {
        let lang = call.getString("lang") ?? "en-US"
        let list = VoicePlugin.ranked(lang).map { v -> [String: Any] in
            var q = v.quality == .enhanced ? "Enhanced" : "Standard"
            if #available(iOS 16.0, *) { if v.quality == .premium { q = "Premium" } }
            return ["id": v.identifier, "name": v.name, "lang": v.language, "quality": q]
        }
        call.resolve(["voices": list])
    }
    private var waiting: CAPPluginCall?

    override public func load() { synth.delegate = self }

    @objc func speak(_ call: CAPPluginCall) {
        let text = call.getString("text") ?? ""
        let lang = call.getString("lang") ?? "en-US"
        // "" = the iPhone's own default voice for the language, "best" = the best installed voice, else a chosen voice
        let pick = call.getString("voice") ?? ""
        let chosen: AVSpeechSynthesisVoice? = pick == "best" ? VoicePlugin.ranked(lang).first : pick.isEmpty ? nil : AVSpeechSynthesisVoice(identifier: pick)
        DispatchQueue.main.async {
            if self.synth.isSpeaking { self.synth.stopSpeaking(at: .immediate) }
            self.waiting?.resolve(); self.waiting = call
            guard !text.isEmpty else { call.resolve(); self.waiting = nil; return }
            let session = AVAudioSession.sharedInstance()
            try? session.setCategory(.playback, mode: .voicePrompt, options: [.duckOthers, .interruptSpokenAudioAndMixWithOthers])
            try? session.setActive(true)
            let u = AVSpeechUtterance(string: text)
            u.voice = chosen ?? AVSpeechSynthesisVoice(language: lang)
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
    private var gen = 0         // bumped by every start and end, so a start that finishes after an end is taken back

    // A trip left on the lock screen by a closed or crashed app is cleared when the app starts again
    override public func load() {
        #if canImport(ActivityKit)
        if #available(iOS 16.1, *) {
            Task { @MainActor in for a in Activity<NavAttributes>.activities { await a.end(dismissalPolicy: .immediate) } }
        }
        #endif
    }

    #if canImport(ActivityKit)
    @available(iOS 16.1, *)
    private func state(_ call: CAPPluginCall) -> NavAttributes.ContentState {
        NavAttributes.ContentState(dist: call.getString("dist") ?? "", road: call.getString("road") ?? "", text: call.getString("text") ?? "",
                                   sym: call.getString("sym") ?? "arrow.up", arrive: call.getString("arrive") ?? "",
                                   left: call.getString("left") ?? "", progress: min(1, max(0, call.getDouble("progress") ?? 0)))
    }
    #endif

    @objc func start(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *), ActivityAuthorizationInfo().areActivitiesEnabled else { call.resolve(["on": false]); return }
        let st = state(call), attrs = NavAttributes(dest: call.getString("dest") ?? "")
        Task { @MainActor in
            self.gen += 1
            let mine = self.gen
            for a in Activity<NavAttributes>.activities { await a.end(dismissalPolicy: .immediate) }   // one trip at a time
            do {
                let a: Activity<NavAttributes>
                if #available(iOS 16.2, *) {
                    a = try Activity.request(attributes: attrs, content: ActivityContent(state: st, staleDate: Date().addingTimeInterval(300)))
                } else {
                    a = try Activity.request(attributes: attrs, contentState: st)
                }
                if mine != self.gen {   // directions ended while this was starting
                    await a.end(dismissalPolicy: .immediate)
                    call.resolve(["on": false]); return
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
        guard #available(iOS 16.1, *) else { call.resolve(); return }
        let st = state(call)
        Task { @MainActor in
            guard let a = self.current as? Activity<NavAttributes> else { call.resolve(); return }
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
        Task { @MainActor in
            self.gen += 1
            self.current = nil
            // Arrived: "You have arrived" stays for a minute; ended early: it goes away now. Every trip activity ends,
            // including any a crashed or reloaded page left behind.
            let policy: ActivityUIDismissalPolicy = arrived ? .after(Date().addingTimeInterval(60)) : .immediate
            for a in Activity<NavAttributes>.activities { await a.end(dismissalPolicy: policy) }
            call.resolve()
        }
        #else
        call.resolve()
        #endif
    }

    // Called when the app is closed from the app switcher: the lock screen should not keep showing a trip
    public static func endAllNow() {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *) else { return }
        let done = DispatchSemaphore(value: 0)
        Task.detached {
            for a in Activity<NavAttributes>.activities { await a.end(dismissalPolicy: .immediate) }
            done.signal()
        }
        _ = done.wait(timeout: .now() + 1.5)
        #endif
    }
}

// MARK: - Background behind the page
// When the phone turns, iOS shows the web view's own background for a moment while the page resizes. The page tells
// this plugin its theme colour, so that moment is the same colour as the map instead of a white flash in dark mode.
@objc(LookPlugin)
public class LookPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LookPlugin"
    public let jsName = "Look"
    public let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name: "setBackground", returnType: CAPPluginReturnPromise)]

    @objc func setBackground(_ call: CAPPluginCall) {
        let hex = (call.getString("color") ?? "").trimmingCharacters(in: CharacterSet(charactersIn: "# "))
        guard hex.count == 6, let v = UInt32(hex, radix: 16) else { call.resolve(); return }
        let c = UIColor(red: CGFloat((v >> 16) & 255) / 255, green: CGFloat((v >> 8) & 255) / 255, blue: CGFloat(v & 255) / 255, alpha: 1)
        DispatchQueue.main.async {
            guard let web = self.bridge?.webView else { call.resolve(); return }
            web.isOpaque = false
            web.backgroundColor = c
            web.scrollView.backgroundColor = c
            self.bridge?.viewController?.view.backgroundColor = c
            self.bridge?.viewController?.view.window?.backgroundColor = c
            call.resolve()
        }
    }
}

// Leave-by reminders: one local notification at the time the page asks for ("Leave now to arrive by 6:30")
public class RemindPlugin: CAPPlugin, CAPBridgedPlugin, UNUserNotificationCenterDelegate {
    public let identifier = "RemindPlugin"
    public let jsName = "Remind"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "schedule", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancel", returnType: CAPPluginReturnPromise)
    ]

    // The app shows the reminder as a banner even when BrinaMaps is open (otherwise iOS drops it silently)
    override public func load() { UNUserNotificationCenter.current().delegate = self }

    public func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                       withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound, .list])
    }

    public func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse,
                                       withCompletionHandler completionHandler: @escaping () -> Void) {
        completionHandler()
    }

    @objc func schedule(_ call: CAPPluginCall) {
        let id = call.getString("id") ?? "leave"
        let at = call.getDouble("at") ?? 0
        let title = call.getString("title") ?? "Time to leave"
        let body = call.getString("body") ?? ""
        let when = Date(timeIntervalSince1970: at / 1000)
        guard when.timeIntervalSinceNow > 5 else { call.resolve(["ok": false, "error": "past"]); return }
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound]) { granted, _ in
            guard granted else { call.resolve(["ok": false, "error": "denied"]); return }
            let wait = when.timeIntervalSinceNow   // after the permission prompt, however long that took
            guard wait > 1 else { call.resolve(["ok": false, "error": "past"]); return }
            let content = UNMutableNotificationContent()
            content.title = title
            content.body = body
            content.sound = .default
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: wait, repeats: false)
            center.removePendingNotificationRequests(withIdentifiers: [id])
            center.add(UNNotificationRequest(identifier: id, content: content, trigger: trigger)) { err in
                if let err = err { call.resolve(["ok": false, "error": err.localizedDescription]) } else { call.resolve(["ok": true]) }
            }
        }
    }

    @objc func cancel(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [call.getString("id") ?? "leave"])
        call.resolve()
    }
}

// The app's web view, with BrinaMaps' own native pieces registered
class BrinaViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        // Until the page says its theme: follow the phone's light or dark setting
        let first = UIColor { $0.userInterfaceStyle == .dark ? UIColor(red: 0.106, green: 0.094, blue: 0.220, alpha: 1) : UIColor(red: 0.969, green: 0.957, blue: 1, alpha: 1) }
        webView?.isOpaque = false
        webView?.backgroundColor = first
        webView?.scrollView.backgroundColor = first
        view.backgroundColor = first
        bridge?.registerPluginInstance(LookPlugin())
        bridge?.registerPluginInstance(VoicePlugin())
        bridge?.registerPluginInstance(LiveNavPlugin())
        bridge?.registerPluginInstance(CarNavPlugin())
        bridge?.registerPluginInstance(RemindPlugin())
    }
}

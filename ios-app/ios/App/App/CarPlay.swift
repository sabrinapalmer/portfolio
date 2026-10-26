// BrinaMaps on a CarPlay screen: the map following you along the route, and CarPlay's own turn panel with the next
// maneuver, its distance and the arrival estimate. Directions are started on the iPhone; the car screen mirrors them.
//
// Dormant until Apple grants the CarPlay navigation entitlement (com.apple.developer.carplay-maps) and the
// CarPlay scene is added to Info.plist. See ios-app/README.md, "CarPlay".
import UIKit
import CarPlay
import MapKit
import WebKit
import Capacitor

// What the phone's directions are doing right now, kept here so a car that connects mid-trip picks it up
final class CarNav {
    static let shared = CarNav()
    var active = false
    var dest = "", destLat = 0.0, destLon = 0.0
    var route: [[Double]] = []                       // [lat, lon] points of the route line
    var text = "", sym = "arrow.up"                   // next maneuver, in the app's language, and its SF Symbol
    var dist = 0.0                                     // metres to the next maneuver
    var left = 0.0, leftDist = 0.0                     // seconds and metres to the destination
    var lat = 0.0, lon = 0.0, heading = 0.0
    weak var car: CarPlaySceneDelegate?
}

// MARK: - Plugin the web app calls (jsName "CarNav")
@objc(CarNavPlugin)
public class CarNavPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CarNavPlugin"
    public let jsName = "CarNav"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "route", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise)
    ]

    private func points(_ call: CAPPluginCall) -> [[Double]] {
        (call.getArray("route") ?? []).compactMap { p -> [Double]? in
            guard let a = p as? [Any], a.count >= 2, let la = (a[0] as? NSNumber)?.doubleValue, let lo = (a[1] as? NSNumber)?.doubleValue else { return nil }
            return [la, lo]
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        let n = CarNav.shared
        n.active = true
        n.dest = call.getString("dest") ?? ""
        n.destLat = call.getDouble("destLat") ?? 0; n.destLon = call.getDouble("destLon") ?? 0
        n.route = points(call)
        DispatchQueue.main.async { n.car?.startTrip(); call.resolve() }
    }

    @objc func route(_ call: CAPPluginCall) {   // a new route during the trip (rerouted)
        CarNav.shared.route = points(call)
        DispatchQueue.main.async { CarNav.shared.car?.showRoute(); call.resolve() }
    }

    @objc func update(_ call: CAPPluginCall) {
        let n = CarNav.shared
        n.text = call.getString("text") ?? n.text; n.sym = call.getString("sym") ?? n.sym
        n.dist = call.getDouble("dist") ?? n.dist; n.left = call.getDouble("left") ?? n.left; n.leftDist = call.getDouble("leftDist") ?? n.leftDist
        n.lat = call.getDouble("lat") ?? n.lat; n.lon = call.getDouble("lon") ?? n.lon; n.heading = call.getDouble("heading") ?? n.heading
        DispatchQueue.main.async { n.car?.update(); call.resolve() }
    }

    @objc func end(_ call: CAPPluginCall) {
        CarNav.shared.active = false
        DispatchQueue.main.async { CarNav.shared.car?.endTrip(); call.resolve() }
    }
}

// MARK: - The car screen
class CarPlaySceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate, CPMapTemplateDelegate {
    private var interface: CPInterfaceController?
    private var mapTemplate: CPMapTemplate?
    private var session: CPNavigationSession?
    private var trip: CPTrip?
    private var maneuver: CPManeuver?
    private var maneuverText = ""
    private let mapView = CarMapViewController()

    func templateApplicationScene(_ scene: CPTemplateApplicationScene, didConnect interfaceController: CPInterfaceController, to window: CPWindow) {
        interface = interfaceController
        window.rootViewController = mapView
        let t = CPMapTemplate()
        t.mapDelegate = self
        let recenter = CPMapButton { [weak self] _ in self?.mapView.recenter() }
        recenter.image = UIImage(systemName: "location.fill")
        t.mapButtons = [recenter]
        mapTemplate = t
        interfaceController.setRootTemplate(t, animated: false, completion: nil)
        CarNav.shared.car = self
        if CarNav.shared.active { startTrip() } else { mapView.setIdle(true) }
    }

    func templateApplicationScene(_ scene: CPTemplateApplicationScene, didDisconnect interfaceController: CPInterfaceController, from window: CPWindow) {
        session = nil; trip = nil; maneuver = nil; maneuverText = ""
        interface = nil; mapTemplate = nil
        if CarNav.shared.car === self { CarNav.shared.car = nil }
    }

    func startTrip() {
        guard let t = mapTemplate else { return }
        session?.finishTrip()
        let n = CarNav.shared
        let destination = MKMapItem(placemark: MKPlacemark(coordinate: CLLocationCoordinate2D(latitude: n.destLat, longitude: n.destLon)))
        destination.name = n.dest
        let choice = CPRouteChoice(summaryVariants: [n.dest], additionalInformationVariants: [], selectionSummaryVariants: [])
        let tr = CPTrip(origin: MKMapItem.forCurrentLocation(), destination: destination, routeChoices: [choice])
        trip = tr
        session = t.startNavigationSession(for: tr)
        maneuver = nil; maneuverText = ""
        mapView.setIdle(false)
        showRoute()
        update()
    }

    func showRoute() { mapView.setRoute(CarNav.shared.route) }

    func update() {
        let n = CarNav.shared
        mapView.move(lat: n.lat, lon: n.lon, heading: n.heading)
        guard let s = session, let tr = trip, !n.text.isEmpty else { return }
        let toTurn = CPTravelEstimates(distanceRemaining: Measurement(value: max(0, n.dist), unit: UnitLength.meters), timeRemaining: 0)
        if n.text != maneuverText || maneuver == nil {   // a new maneuver: replace the panel
            let m = CPManeuver()
            m.instructionVariants = [n.text]
            if let img = UIImage(systemName: n.sym) { m.symbolImage = img }
            m.initialTravelEstimates = toTurn
            s.upcomingManeuvers = [m]
            maneuver = m; maneuverText = n.text
        } else if let m = maneuver {
            s.updateEstimates(toTurn, for: m)
        }
        let toEnd = CPTravelEstimates(distanceRemaining: Measurement(value: max(0, n.leftDist), unit: UnitLength.meters), timeRemaining: max(0, n.left))
        mapTemplate?.update(toEnd, for: tr, with: .default)
    }

    func endTrip() {
        session?.finishTrip()
        session = nil; trip = nil; maneuver = nil; maneuverText = ""
        mapView.setRoute([])
        mapView.setIdle(true)
    }
}

// The map on the car screen: the BrinaMaps web map in car mode, moved by the phone's position updates
class CarMapViewController: UIViewController, WKNavigationDelegate {
    private let web = WKWebView(frame: .zero, configuration: WKWebViewConfiguration())
    private let note = UILabel()
    private var loaded = false
    private var pending: [String] = []
    private var lastPos = ""

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        web.navigationDelegate = self
        web.isOpaque = false; web.backgroundColor = .black
        web.scrollView.isScrollEnabled = false
        web.frame = view.bounds; web.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(web)
        note.text = "Start directions on your iPhone"
        note.textColor = .white; note.font = .boldSystemFont(ofSize: 17); note.textAlignment = .center
        note.backgroundColor = UIColor.black.withAlphaComponent(0.55); note.layer.cornerRadius = 12; note.clipsToBounds = true
        note.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(note)
        NSLayoutConstraint.activate([
            note.centerXAnchor.constraint(equalTo: view.safeAreaLayoutGuide.centerXAnchor),
            note.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -16),
            note.heightAnchor.constraint(equalToConstant: 40),
            note.widthAnchor.constraint(greaterThanOrEqualToConstant: 280)
        ])
        if let u = URL(string: "https://www.sabrinapalmer.com/map/?car=1") { web.load(URLRequest(url: u)) }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        loaded = true
        pending.forEach { web.evaluateJavaScript($0, completionHandler: nil) }
        pending.removeAll()
    }

    private func run(_ js: String) {
        if loaded { web.evaluateJavaScript(js, completionHandler: nil) } else { pending.append(js) }
    }

    func setIdle(_ idle: Bool) { loadViewIfNeeded(); note.isHidden = !idle }

    func setRoute(_ pts: [[Double]]) {
        guard let d = try? JSONSerialization.data(withJSONObject: pts), let s = String(data: d, encoding: .utf8) else { return }
        pending.removeAll { $0.hasPrefix("carRoute(") }
        run("carRoute(\(s))")
    }

    func move(lat: Double, lon: Double, heading: Double) {
        guard lat != 0 || lon != 0 else { return }
        let js = "carPos(\(lat),\(lon),\(heading))"
        if js == lastPos { return }
        lastPos = js
        pending.removeAll { $0.hasPrefix("carPos(") }
        run(js)
    }

    func recenter() { run("carRecenter()") }
}

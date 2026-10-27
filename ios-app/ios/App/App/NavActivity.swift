// What the lock screen and Dynamic Island show during directions. This file belongs to BOTH targets:
// the app (which starts and updates the activity) and BrinaNavWidget (which draws it).
// In Xcode: select this file > File inspector > Target Membership > tick App and BrinaNavWidget.
import Foundation
#if canImport(ActivityKit)
import ActivityKit

@available(iOS 16.1, *)
public struct NavAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var dist: String      // distance to the next turn, e.g. "0.3 miles"
        public var road: String      // the street to turn onto, shown big next to the distance ("" if none)
        public var text: String      // the next instruction, already in the app's language
        public var sym: String       // SF Symbol name for the turn arrow
        public var arrive: String    // arrival clock time, e.g. "3:42 PM"
        public var left: String      // time and distance left, e.g. "25 min - 12 miles"
        public var progress: Double  // 0...1 along the route
        public var shape: [Double]?  // the road around the next turn, [x0, y0, x1, y1, ...] in -1...1, heading up (nil: show the arrow symbol)
    }
    public var dest: String          // destination name
}
#endif

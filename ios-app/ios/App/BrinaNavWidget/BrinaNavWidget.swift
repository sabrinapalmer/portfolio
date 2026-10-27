// BrinaMaps directions on the lock screen and in the Dynamic Island.
// Target: BrinaNavWidget (Widget Extension, iOS 16.1+). NavActivity.swift from the App folder must also be in this target.
import ActivityKit
import SwiftUI
import WidgetKit

@main
struct BrinaNavWidgetBundle: WidgetBundle {
    var body: some Widget {
        NavLiveActivity()   // this target's minimum iOS is 16.1, where Live Activities start
    }
}

private let accent = Color(red: 0.42, green: 0.30, blue: 0.86)
private let ink = Color(red: 0.07, green: 0.06, blue: 0.16)          // the card: deep night blue
private let road = Color(red: 0.30, green: 0.80, blue: 1.0)          // the route on the little map: bright sky blue

@available(iOS 16.1, *)
struct NavLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: NavAttributes.self) { ctx in
            LockScreenView(state: ctx.state, dest: ctx.attributes.dest)
                .activityBackgroundTint(ink.opacity(0.94))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { ctx in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    TurnBadge(state: ctx.state, size: 64).padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 0) {
                        Text(ctx.state.arrive).font(.system(size: 17, weight: .bold))
                        Text(ctx.state.left).font(.caption2).foregroundColor(.secondary).lineLimit(1)
                    }
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(ctx.state.dist).font(.system(size: 26, weight: .heavy)).lineLimit(1).minimumScaleFactor(0.7)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 6) {
                        if !ctx.state.road.isEmpty {
                            Text(ctx.state.road).font(.system(size: 22, weight: .bold)).lineLimit(1).minimumScaleFactor(0.6)
                        }
                        Text(ctx.state.text).font(.system(size: 14, weight: .medium)).foregroundColor(.secondary).lineLimit(1).multilineTextAlignment(.center)
                        ProgressView(value: ctx.state.progress).tint(road)
                    }
                }
            } compactLeading: {
                Image(systemName: ctx.state.sym).font(.system(size: 15, weight: .bold)).foregroundColor(road)
            } compactTrailing: {
                Text(ctx.state.dist).font(.system(size: 14, weight: .semibold)).lineLimit(1).frame(maxWidth: 64)
            } minimal: {
                Image(systemName: ctx.state.sym).font(.system(size: 13, weight: .bold)).foregroundColor(road)
            }
        }
    }
}

// The next turn as a little tilted map: the road ahead drawn up the screen into the turn, an arrow where it ends.
// Without a road shape (older app version), the turn arrow symbol.
@available(iOS 16.1, *)
struct TurnBadge: View {
    let state: NavAttributes.ContentState
    let size: CGFloat
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.24)
                .fill(LinearGradient(colors: [Color(red: 0.16, green: 0.13, blue: 0.36), Color(red: 0.09, green: 0.08, blue: 0.22)], startPoint: .top, endPoint: .bottom))
            if let shape = state.shape, shape.count >= 4 {
                TurnMap(values: shape)
                    .rotation3DEffect(.degrees(38), axis: (x: 1, y: 0, z: 0), perspective: 0.55)
                    .padding(size * 0.1)
            } else {
                Image(systemName: state.sym).font(.system(size: size * 0.5, weight: .bold)).foregroundColor(.white)
            }
        }
        .frame(width: size, height: size)
    }
}

@available(iOS 16.1, *)
struct TurnMap: View {
    let values: [Double]
    private func points(_ s: CGSize) -> [CGPoint] {
        var out: [CGPoint] = []
        var i = 0
        while i + 1 < values.count {
            out.append(CGPoint(x: s.width / 2 + CGFloat(values[i]) * s.width * 0.42, y: s.height / 2 - CGFloat(values[i + 1]) * s.height * 0.42))
            i += 2
        }
        return out
    }
    var body: some View {
        GeometryReader { g in
            ZStack {
                RoadLine(points: points(g.size)).stroke(Color.white.opacity(0.22), style: StrokeStyle(lineWidth: 15, lineCap: .round, lineJoin: .round))
                RoadLine(points: points(g.size)).stroke(road, style: StrokeStyle(lineWidth: 7, lineCap: .round, lineJoin: .round))
                ArrowTip(points: points(g.size)).fill(Color.white)
            }
        }
    }
}

struct RoadLine: Shape {
    let points: [CGPoint]
    func path(in rect: CGRect) -> Path {
        var p = Path()
        guard let first = points.first else { return p }
        p.move(to: first)
        for q in points.dropFirst() { p.addLine(to: q) }
        return p
    }
}

struct ArrowTip: Shape {   // a white arrowhead at the end of the line, pointing the way the road goes
    let points: [CGPoint]
    func path(in rect: CGRect) -> Path {
        var p = Path()
        guard points.count >= 2 else { return p }
        let tip = points[points.count - 1], back = points[points.count - 2]
        let a = atan2(tip.y - back.y, tip.x - back.x), len: CGFloat = 13, spread: CGFloat = 0.6
        p.move(to: CGPoint(x: tip.x + cos(a) * 5, y: tip.y + sin(a) * 5))
        p.addLine(to: CGPoint(x: tip.x - cos(a - spread) * len, y: tip.y - sin(a - spread) * len))
        p.addLine(to: CGPoint(x: tip.x - cos(a + spread) * len, y: tip.y - sin(a + spread) * len))
        p.closeSubpath()
        return p
    }
}

@available(iOS 16.1, *)
struct LockScreenView: View {
    let state: NavAttributes.ContentState
    let dest: String
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .center, spacing: 14) {
                TurnBadge(state: state, size: 76)
                VStack(alignment: .leading, spacing: 2) {
                    // What to look for, big: the distance, then the street; the full instruction under it, smaller
                    Text(state.dist).font(.system(size: 30, weight: .heavy)).foregroundColor(.white).lineLimit(1).minimumScaleFactor(0.6)
                    if !state.road.isEmpty {
                        Text(state.road).font(.system(size: 22, weight: .bold)).foregroundColor(.white).lineLimit(1).minimumScaleFactor(0.6)
                    }
                    Text(state.text).font(.system(size: 13, weight: .medium)).foregroundColor(.white.opacity(0.7)).lineLimit(1)
                }
                Spacer(minLength: 0)
            }
            HStack(spacing: 6) {
                Text(dest).font(.caption).foregroundColor(.white.opacity(0.7)).lineLimit(1)
                Spacer()
                Text(state.arrive).font(.system(size: 15, weight: .bold)).foregroundColor(.white)
                Text(state.left).font(.caption).foregroundColor(.white.opacity(0.7)).lineLimit(1)
            }
            ProgressView(value: state.progress).tint(road)
        }
        .padding(14)
    }
}

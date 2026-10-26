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

@available(iOS 16.1, *)
struct NavLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: NavAttributes.self) { ctx in
            LockScreenView(state: ctx.state, dest: ctx.attributes.dest)
                .activityBackgroundTint(Color(.systemBackground).opacity(0.92))
                .activitySystemActionForegroundColor(accent)
        } dynamicIsland: { ctx in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: ctx.state.sym).font(.system(size: 34, weight: .bold)).foregroundColor(accent).padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 0) {
                        Text(ctx.state.arrive).font(.system(size: 17, weight: .bold))
                        Text(ctx.state.left).font(.caption2).foregroundColor(.secondary).lineLimit(1)
                    }
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(ctx.state.dist).font(.system(size: 24, weight: .heavy)).lineLimit(1).minimumScaleFactor(0.7)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 6) {
                        if !ctx.state.road.isEmpty {
                            Text(ctx.state.road).font(.system(size: 22, weight: .bold)).lineLimit(1).minimumScaleFactor(0.6)
                        }
                        Text(ctx.state.text).font(.system(size: 14, weight: .medium)).foregroundColor(.secondary).lineLimit(1).multilineTextAlignment(.center)
                        ProgressView(value: ctx.state.progress).tint(accent)
                    }
                }
            } compactLeading: {
                Image(systemName: ctx.state.sym).font(.system(size: 15, weight: .bold)).foregroundColor(accent)
            } compactTrailing: {
                Text(ctx.state.dist).font(.system(size: 14, weight: .semibold)).lineLimit(1).frame(maxWidth: 64)
            } minimal: {
                Image(systemName: ctx.state.sym).font(.system(size: 13, weight: .bold)).foregroundColor(accent)
            }
        }
    }
}

@available(iOS 16.1, *)
struct LockScreenView: View {
    let state: NavAttributes.ContentState
    let dest: String
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .center, spacing: 12) {
                Image(systemName: state.sym)
                    .font(.system(size: 30, weight: .bold)).foregroundColor(.white)
                    .frame(width: 58, height: 58).background(accent).clipShape(RoundedRectangle(cornerRadius: 14))
                VStack(alignment: .leading, spacing: 1) {
                    // What to look for, big: "330 ft · Pine Avenue"; the full instruction under it, smaller
                    if state.road.isEmpty {
                        Text(state.dist).font(.system(size: 30, weight: .heavy)).lineLimit(1).minimumScaleFactor(0.6)
                    } else {
                        (Text(state.dist).font(.system(size: 30, weight: .heavy)) + Text("  ") + Text(state.road).font(.system(size: 26, weight: .bold)))
                            .lineLimit(2).minimumScaleFactor(0.6)
                    }
                    Text(state.text).font(.system(size: 14, weight: .medium)).foregroundColor(.secondary).lineLimit(1)
                }
                Spacer(minLength: 0)
            }
            HStack {
                Text(dest).font(.caption).foregroundColor(.secondary).lineLimit(1)
                Spacer()
                Text(state.arrive).font(.system(size: 15, weight: .bold))
                Text(state.left).font(.caption).foregroundColor(.secondary).lineLimit(1)
            }
            ProgressView(value: state.progress).tint(accent)
        }
        .padding(14)
    }
}

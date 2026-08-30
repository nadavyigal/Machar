import SwiftUI

@main
struct MacharApp: App {
    @StateObject private var household = HouseholdStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(household)
                .environment(\.layoutDirection, .rightToLeft)
        }
    }
}

struct RootView: View {
    @EnvironmentObject private var household: HouseholdStore

    var body: some View {
        if household.children.isEmpty {
            OnboardingView()
        } else {
            HouseholdCalendarView()
        }
    }
}

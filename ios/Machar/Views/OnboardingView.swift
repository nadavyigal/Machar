import SwiftUI
import MacharCore

/// The cold start. A parent adds their children once and never types a date:
/// the school year ships in the app.
struct OnboardingView: View {
    @EnvironmentObject private var household: HouseholdStore

    @State private var firstName = ""
    @State private var level: SchoolLevel = .school
    @State private var pattern: WeekPattern = .fiveDay
    @State private var draft: [ChildContext] = []

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("מוסיפים את הילדים פעם אחת. לוח החופשות של משרד החינוך כבר בפנים.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Section("ילד/ה") {
                    TextField("שם", text: $firstName)

                    Picker("מסגרת", selection: $level) {
                        Text("גן").tag(SchoolLevel.gan)
                        Text("בית ספר").tag(SchoolLevel.school)
                    }
                    .pickerStyle(.segmented)

                    Picker("שבוע לימודים", selection: $pattern) {
                        Text("חמישה ימים").tag(WeekPattern.fiveDay)
                        Text("שישה ימים").tag(WeekPattern.sixDay)
                    }
                    .pickerStyle(.segmented)

                    Button("הוספה") { addDraft() }
                        .disabled(firstName.trimmingCharacters(in: .whitespaces).isEmpty)
                }

                if !draft.isEmpty {
                    Section("נוספו") {
                        ForEach(draft) { child in
                            HStack {
                                Text(child.firstName)
                                Spacer()
                                Text(child.level == .gan ? "גן" : "בית ספר")
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .onDelete { draft.remove(atOffsets: $0) }
                    }
                }
            }
            .navigationTitle("מחר")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("סיום") { household.replaceAll(with: draft) }
                        .disabled(draft.isEmpty)
                }
            }
        }
    }

    private func addDraft() {
        let name = firstName.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { return }
        draft.append(
            ChildContext(
                memberId: UUID().uuidString,
                firstName: name,
                level: level,
                weekPattern: pattern
            )
        )
        firstName = ""
    }
}

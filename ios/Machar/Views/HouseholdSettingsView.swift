import SwiftUI
import MacharCore

/// The household after onboarding. Until this screen existed, fixing a typo in a
/// child's name meant deleting the app and starting over, because onboarding was
/// the only place a `ChildContext` could be written.
struct HouseholdSettingsView: View {
    @EnvironmentObject private var household: HouseholdStore
    @Environment(\.dismiss) private var dismiss

    /// Non-nil while a child is open for editing. `ChildContext` is `Identifiable`
    /// on `memberId`, so the sheet rebuilds when a different child is picked.
    @State private var editing: ChildContext?
    @State private var isAdding = false

    var body: some View {
        NavigationStack {
            List {
                Section("הילדים") {
                    ForEach(household.children) { child in
                        Button {
                            editing = child
                        } label: {
                            ChildRow(child: child)
                        }
                        .buttonStyle(.plain)
                    }
                    .onDelete { household.remove(atOffsets: $0) }
                }

                Section {
                    Button {
                        isAdding = true
                    } label: {
                        Label("הוספת ילד/ה", systemImage: "plus")
                    }
                } footer: {
                    Text("מחיקת הילד/ה האחרון/ה מחזירה את האפליקציה למסך הפתיחה.")
                }
            }
            .navigationTitle("משק הבית")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("סיום") { dismiss() }
                }
            }
            .sheet(item: $editing) { child in
                ChildFormView(child: child, title: "עריכת ילד/ה") { household.update($0) }
            }
            .sheet(isPresented: $isAdding) {
                ChildFormView(child: nil, title: "ילד/ה חדש/ה") { household.add($0) }
            }
        }
    }
}

struct ChildRow: View {
    let child: ChildContext

    var body: some View {
        HStack {
            Text(child.firstName)
            Spacer()
            Text("\(ChildLabels.level(child.level)) · \(ChildLabels.pattern(child.weekPattern))")
                .font(.footnote)
                .foregroundStyle(.secondary)
            Image(systemName: "chevron.backward")
                .font(.footnote)
                .foregroundStyle(.tertiary)
        }
        .contentShape(Rectangle())
    }
}

/// One form for both "add" and "edit". Edits are held locally and committed on
/// save, so backing out of the sheet leaves the stored household untouched.
struct ChildFormView: View {
    @Environment(\.dismiss) private var dismiss

    private let memberId: String
    private let title: String
    private let onSave: (ChildContext) -> Void

    @State private var firstName: String
    @State private var level: SchoolLevel
    @State private var pattern: WeekPattern

    init(child: ChildContext?, title: String, onSave: @escaping (ChildContext) -> Void) {
        self.memberId = child?.memberId ?? UUID().uuidString
        self.title = title
        self.onSave = onSave
        _firstName = State(initialValue: child?.firstName ?? "")
        _level = State(initialValue: child?.level ?? .school)
        _pattern = State(initialValue: child?.weekPattern ?? .fiveDay)
    }

    private var trimmedName: String {
        firstName.trimmingCharacters(in: .whitespaces)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("ילד/ה") {
                    TextField("שם", text: $firstName)

                    Picker("מסגרת", selection: $level) {
                        Text(ChildLabels.level(.gan)).tag(SchoolLevel.gan)
                        Text(ChildLabels.level(.school)).tag(SchoolLevel.school)
                    }
                    .pickerStyle(.segmented)

                    Picker("שבוע לימודים", selection: $pattern) {
                        Text(ChildLabels.pattern(.fiveDay)).tag(WeekPattern.fiveDay)
                        Text(ChildLabels.pattern(.sixDay)).tag(WeekPattern.sixDay)
                    }
                    .pickerStyle(.segmented)
                }
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("ביטול") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("שמירה") {
                        onSave(
                            ChildContext(
                                memberId: memberId,
                                firstName: trimmedName,
                                level: level,
                                weekPattern: pattern
                            )
                        )
                        dismiss()
                    }
                    .disabled(trimmedName.isEmpty)
                }
            }
        }
    }
}

/// The Hebrew names for the two enums, in one place so the settings screen and
/// the day detail cannot drift apart.
enum ChildLabels {
    static func level(_ level: SchoolLevel) -> String {
        switch level {
        case .gan: return "גן"
        case .school: return "בית ספר"
        }
    }

    static func pattern(_ pattern: WeekPattern) -> String {
        switch pattern {
        case .fiveDay: return "חמישה ימים"
        case .sixDay: return "שישה ימים"
        }
    }
}

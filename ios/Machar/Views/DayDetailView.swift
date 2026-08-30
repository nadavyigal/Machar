import SwiftUI
import MacharCore

/// Why a day is coloured the way it is. The month grid is a colour code; this is
/// the answer to "why is the 14th marked", per child and in the Hebrew the
/// calendar data itself carries.
///
/// Pure presentation: it reads `HouseholdDay.perChild`, which `buildHouseholdMonth`
/// already resolved. No calendar logic lives here.
struct DayDetailView: View {
    let day: HouseholdDay
    let children: [ChildContext]

    @Environment(\.dismiss) private var dismiss

    /// The already-resolved status for each child, joined by `memberId` and kept
    /// in the household's own order.
    private var entries: [(child: ChildContext, status: DayStatus)] {
        children.compactMap { child in
            day.perChild
                .first { $0.memberId == child.memberId }
                .map { (child, $0.status) }
        }
    }

    var body: some View {
        NavigationStack {
            List {
                if entries.isEmpty {
                    Text("אין ילדים במשק הבית.").foregroundStyle(.secondary)
                } else {
                    ForEach(entries, id: \.child.memberId) { entry in
                        ChildStatusRow(child: entry.child, status: entry.status)
                    }
                }
            }
            .navigationTitle(HebrewDate.long(day.date))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("סגירה") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

struct ChildStatusRow: View {
    let child: ChildContext
    let status: DayStatus

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 12) {
            Image(systemName: symbol)
                .foregroundStyle(tint)
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 2) {
                Text(child.firstName).font(.body)
                Text(headline)
                    .font(.footnote)
                    .foregroundStyle(tint)
                Text(ChildLabels.level(child.level))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .accessibilityElement(children: .combine)
    }

    /// The reason string is `nil` only on an ordinary open day; every closure and
    /// short day carries the Hebrew name straight from the Ministry data.
    private var headline: String {
        if !status.open { return status.reason ?? "לא במסגרת" }
        if status.shortDay { return "יום קצר — \(status.reason ?? "")" }
        return "יום רגיל"
    }

    private var symbol: String {
        if !status.open { return "exclamationmark.triangle.fill" }
        if status.shortDay { return "clock.fill" }
        return "checkmark.circle.fill"
    }

    private var tint: Color {
        if !status.open { return .orange }
        if status.shortDay { return .blue }
        return .green
    }
}

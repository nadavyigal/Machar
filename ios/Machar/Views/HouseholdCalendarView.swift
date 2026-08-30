import SwiftUI
import MacharCore

struct HouseholdCalendarView: View {
    @EnvironmentObject private var household: HouseholdStore
    @StateObject private var model = CalendarViewModel()

    @State private var showingSettings = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    if let error = model.loadError {
                        Text("לוח השנה לא נטען: \(error)")
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }

                    TomorrowCard(entries: model.tomorrow(for: household.children), date: model.tomorrowDate)

                    MonthSection(model: model, children: household.children)
                }
                .padding()
            }
            .navigationTitle("מחר")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                    }
                    .accessibilityLabel("משק הבית")
                }
            }
            .sheet(isPresented: $showingSettings) {
                HouseholdSettingsView()
            }
        }
    }
}

/// The product in one card: what does this family need tomorrow.
struct TomorrowCard: View {
    let entries: [(child: ChildContext, status: DayStatus)]
    let date: String

    private var closed: [(child: ChildContext, status: DayStatus)] {
        entries.filter { !$0.status.open }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("מחר, \(HebrewDate.long(date))")
                .font(.headline)

            if entries.isEmpty {
                Text("אין ילדים במשק הבית.").foregroundStyle(.secondary)
            } else if closed.isEmpty {
                Label("יום רגיל. כולם במסגרת.", systemImage: "checkmark.circle.fill")
                    .foregroundStyle(.green)
            } else {
                ForEach(closed, id: \.child.memberId) { entry in
                    Label(
                        "\(entry.child.firstName) לא במסגרת — \(entry.status.reason ?? "סגור")",
                        systemImage: "exclamationmark.triangle.fill"
                    )
                    .foregroundStyle(.orange)
                }
            }

            let shortDays = entries.filter { $0.status.shortDay }
            ForEach(shortDays, id: \.child.memberId) { entry in
                Label(
                    "\(entry.child.firstName) מסיים/ה מוקדם — \(entry.status.reason ?? "יום קצר")",
                    systemImage: "clock.fill"
                )
                .foregroundStyle(.blue)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

struct MonthSection: View {
    @ObservedObject var model: CalendarViewModel
    let children: [ChildContext]

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Button { model.shiftMonth(by: -1) } label: { Image(systemName: "chevron.forward") }
                Spacer()
                Text(HebrewDate.month(model.visibleMonth)).font(.headline)
                Spacer()
                Button { model.shiftMonth(by: 1) } label: { Image(systemName: "chevron.backward") }
            }

            if let month = model.month(for: children) {
                MonthGrid(month: month, children: children, today: model.today)
            } else {
                Text("אין נתונים לחודש הזה.").foregroundStyle(.secondary)
            }

            Legend()
        }
    }
}

struct MonthGrid: View {
    let month: HouseholdMonth
    let children: [ChildContext]
    let today: String

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 6), count: 7)
    private let weekdayNames = ["א", "ב", "ג", "ד", "ה", "ו", "ש"]

    /// The day whose detail sheet is open. `HouseholdDay` is `Identifiable` on its
    /// ISO date.
    @State private var selected: HouseholdDay?

    var body: some View {
        LazyVGrid(columns: columns, spacing: 6) {
            ForEach(weekdayNames, id: \.self) { name in
                Text(name).font(.caption2).foregroundStyle(.secondary)
            }

            ForEach(0..<leadingBlanks, id: \.self) { _ in Color.clear.frame(height: 44) }

            ForEach(month.days) { day in
                Button {
                    selected = day
                } label: {
                    DayCell(day: day, isToday: day.date == today)
                }
                .buttonStyle(.plain)
            }
        }
        .sheet(item: $selected) { day in
            DayDetailView(day: day, children: children)
        }
    }

    private var leadingBlanks: Int {
        guard let first = month.days.first, let dow = CivilDate.dayOfWeek(first.date) else { return 0 }
        return dow
    }
}

struct DayCell: View {
    let day: HouseholdDay
    let isToday: Bool

    private var dayNumber: String {
        String(day.date.suffix(2)).hasPrefix("0")
            ? String(day.date.suffix(1))
            : String(day.date.suffix(2))
    }

    private var background: Color {
        if day.allClosed { return .orange.opacity(0.35) }
        if day.anyClosed { return .yellow.opacity(0.3) }
        return .clear
    }

    var body: some View {
        VStack(spacing: 2) {
            Text(dayNumber).font(.callout.weight(isToday ? .bold : .regular))
            if day.perChild.contains(where: { $0.status.shortDay }) {
                Circle().fill(.blue).frame(width: 5, height: 5)
            }
        }
        .frame(maxWidth: .infinity, minHeight: 44)
        .background(background, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            if isToday {
                RoundedRectangle(cornerRadius: 8).strokeBorder(.primary, lineWidth: 1.5)
            }
        }
    }
}

struct Legend: View {
    var body: some View {
        HStack(spacing: 14) {
            LegendItem(color: .orange.opacity(0.35), label: "כולם בבית")
            LegendItem(color: .yellow.opacity(0.3), label: "חלק בבית")
            HStack(spacing: 4) {
                Circle().fill(.blue).frame(width: 6, height: 6)
                Text("יום קצר").font(.caption2)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct LegendItem: View {
    let color: Color
    let label: String

    var body: some View {
        HStack(spacing: 4) {
            RoundedRectangle(cornerRadius: 3).fill(color).frame(width: 12, height: 12)
            Text(label).font(.caption2)
        }
    }
}

/// Hebrew-locale date formatting for display only. All calendar logic stays on
/// ISO strings in MacharCore.
enum HebrewDate {
    private static let locale = Locale(identifier: "he_IL")

    static func long(_ iso: String) -> String {
        guard let date = date(from: iso) else { return iso }
        return date.formatted(.dateTime.locale(locale).weekday(.wide).day().month(.wide))
    }

    static func month(_ isoMonth: String) -> String {
        guard let date = date(from: "\(isoMonth)-01") else { return isoMonth }
        return date.formatted(.dateTime.locale(locale).month(.wide).year())
    }

    private static func date(from iso: String) -> Date? {
        guard let (y, m, d) = CivilDate.parse(iso) else { return nil }
        var components = DateComponents()
        components.year = y
        components.month = m
        components.day = d
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Asia/Jerusalem") ?? .gmt
        return calendar.date(from: components)
    }
}

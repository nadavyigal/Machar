import Foundation
import MacharCore

/// Everything the UI needs, derived from the bundled school year plus this
/// household's children. Pure: no network, no clock except `today`.
@MainActor
final class CalendarViewModel: ObservableObject {
    @Published private(set) var year: SchoolYear?
    @Published private(set) var loadError: String?
    @Published var visibleMonth: String

    let today: String

    init(today: String = CivilDate.today()) {
        self.today = today
        self.visibleMonth = String(today.prefix(7))
        do {
            year = try SchoolYearStore.bundledYear()
        } catch {
            loadError = String(describing: error)
        }
    }

    func month(for children: [ChildContext]) -> HouseholdMonth? {
        guard let year else { return nil }
        return try? buildHouseholdMonth(year: year, children: children, month: visibleMonth)
    }

    /// The card at the top of the app: what this family needs tomorrow.
    func tomorrow(for children: [ChildContext]) -> [(child: ChildContext, status: DayStatus)] {
        guard let year, let date = Self.addingOneDay(to: today) else { return [] }
        return children.map { ($0, resolveDay(year: year, level: $0.level, pattern: $0.weekPattern, date: date)) }
    }

    var tomorrowDate: String { Self.addingOneDay(to: today) ?? today }

    func shiftMonth(by delta: Int) {
        guard let (y, m, _) = CivilDate.parse("\(visibleMonth)-01") else { return }
        let total = y * 12 + (m - 1) + delta
        visibleMonth = String(format: "%04d-%02d", total / 12, total % 12 + 1)
    }

    static func addingOneDay(to iso: String) -> String? {
        guard let (y, m, d) = CivilDate.parse(iso) else { return nil }
        if d < CivilDate.daysInMonth(year: y, month: m) {
            return String(format: "%04d-%02d-%02d", y, m, d + 1)
        }
        if m < 12 { return String(format: "%04d-%02d-01", y, m + 1) }
        return String(format: "%04d-01-01", y + 1)
    }
}

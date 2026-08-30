import Foundation

/// One child as the calendar needs to see them.
public struct ChildContext: Codable, Sendable, Equatable, Identifiable {
    public let memberId: String
    public let firstName: String
    public let level: SchoolLevel
    public let weekPattern: WeekPattern

    public var id: String { memberId }

    public init(memberId: String, firstName: String, level: SchoolLevel, weekPattern: WeekPattern) {
        self.memberId = memberId
        self.firstName = firstName
        self.level = level
        self.weekPattern = weekPattern
    }
}

public struct ChildDay: Sendable, Equatable, Identifiable {
    public let memberId: String
    public let status: DayStatus
    public var id: String { memberId }
}

public struct HouseholdDay: Sendable, Equatable, Identifiable {
    public let date: String
    public let perChild: [ChildDay]
    /// At least one child has no institution that day. This is the one that costs
    /// a parent a workday, so it is what the month view highlights.
    public let anyClosed: Bool
    /// Every child is off.
    public let allClosed: Bool

    public var id: String { date }
}

public struct HouseholdMonth: Sendable, Equatable {
    public let month: String
    public let days: [HouseholdDay]
}

public enum CalendarError: Error, Equatable, CustomStringConvertible {
    case invalidMonth(String)

    public var description: String {
        switch self {
        case .invalidMonth(let month):
            return #"buildHouseholdMonth: invalid month "\#(month)" -- expected zero-padded YYYY-MM (e.g. "2026-09")"#
        }
    }
}

/// Port of `src/lib/calendar/buildHouseholdMonth.ts`. Throws on any month that is
/// not zero-padded `YYYY-MM`, because the TypeScript version silently produced a
/// wrong or empty calendar for `"2026-9"` before that was fixed.
public func buildHouseholdMonth(
    year: SchoolYear,
    children: [ChildContext],
    month: String
) throws -> HouseholdMonth {
    guard let dates = CivilDate.datesInMonth(month) else {
        throw CalendarError.invalidMonth(month)
    }

    let days = dates.map { date -> HouseholdDay in
        let perChild = children.map { child in
            ChildDay(
                memberId: child.memberId,
                status: resolveDay(year: year, level: child.level, pattern: child.weekPattern, date: date)
            )
        }
        return HouseholdDay(
            date: date,
            perChild: perChild,
            anyClosed: perChild.contains { !$0.status.open },
            allClosed: !perChild.isEmpty && perChild.allSatisfy { !$0.status.open }
        )
    }

    return HouseholdMonth(month: month, days: days)
}

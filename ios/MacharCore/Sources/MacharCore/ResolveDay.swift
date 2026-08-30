import Foundation

/// Resolves one date for one child. A direct port of `src/lib/calendar/resolveDay.ts`;
/// the two implementations must stay behaviourally identical, and
/// `ResolveDayTests` mirrors the TypeScript test cases one for one.
///
/// Precedence, highest first: outside the school year, Saturday, Friday on a
/// five-day week, a closure, a short day. Closure beats short day on a date clash.
public func resolveDay(
    year: SchoolYear,
    level: SchoolLevel,
    pattern: WeekPattern,
    date: String
) -> DayStatus {
    let term = year.term(for: level)

    if date < term.start || date > term.end {
        return DayStatus(date: date, open: false, shortDay: false, reason: "מחוץ לשנת הלימודים")
    }

    // An invalid date cannot be resolved by weekday; treat it as closed rather
    // than guessing. Callers validate with CivilDate.isValid before this point.
    guard let dow = CivilDate.dayOfWeek(date) else {
        return DayStatus(date: date, open: false, shortDay: false, reason: nil)
    }

    if dow == 6 {
        return DayStatus(date: date, open: false, shortDay: false, reason: "שבת")
    }
    if dow == 5, pattern == .fiveDay {
        return DayStatus(date: date, open: false, shortDay: false, reason: "יום שישי")
    }

    if let closure = year.closures.first(where: {
        $0.levels.contains(level) && date >= $0.from && date <= $0.to
    }) {
        return DayStatus(date: date, open: false, shortDay: false, reason: closure.name)
    }

    if let short = year.shortDays.first(where: {
        $0.levels.contains(level) && $0.date == date
    }) {
        return DayStatus(date: date, open: true, shortDay: true, reason: short.name)
    }

    return DayStatus(date: date, open: true, shortDay: false, reason: nil)
}

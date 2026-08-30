import Foundation

/// Calendar arithmetic on ISO `YYYY-MM-DD` strings.
///
/// Deliberately does not use `Foundation.Calendar` or `TimeZone`: every date in
/// Machar is a civil date in Asia/Jerusalem with no time component, and routing
/// those through `Date` introduces a timezone bug surface for no benefit. The
/// TypeScript engine makes the same choice (`resolveDay.ts` compares ISO strings
/// directly), so both implementations agree by construction.
public enum CivilDate {
    /// 0 = Sunday ... 6 = Saturday. `nil` if the string is not a real calendar date.
    public static func dayOfWeek(_ iso: String) -> Int? {
        guard let (y, m, d) = parse(iso) else { return nil }
        // Sakamoto's algorithm.
        let t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
        var year = y
        if m < 3 { year -= 1 }
        return (year + year / 4 - year / 100 + year / 400 + t[m - 1] + d) % 7
    }

    /// Parses and validates a real calendar date. Rejects `2026-11-31` and
    /// `2026-13-01`, which a shape-only regex would let through.
    public static func parse(_ iso: String) -> (year: Int, month: Int, day: Int)? {
        let parts = iso.split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 3,
              parts[0].count == 4, parts[1].count == 2, parts[2].count == 2,
              let y = Int(parts[0]), let m = Int(parts[1]), let d = Int(parts[2]),
              m >= 1, m <= 12, d >= 1, d <= daysInMonth(year: y, month: m)
        else { return nil }
        return (y, m, d)
    }

    public static func isValid(_ iso: String) -> Bool { parse(iso) != nil }

    public static func daysInMonth(year: Int, month: Int) -> Int {
        switch month {
        case 1, 3, 5, 7, 8, 10, 12: return 31
        case 4, 6, 9, 11: return 30
        case 2: return isLeapYear(year) ? 29 : 28
        default: return 0
        }
    }

    public static func isLeapYear(_ year: Int) -> Bool {
        (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
    }

    /// Every ISO date in a zero-padded `YYYY-MM` month, in order.
    /// Returns `nil` for anything that is not a zero-padded `YYYY-MM`.
    public static func datesInMonth(_ month: String) -> [String]? {
        let parts = month.split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 2, parts[0].count == 4, parts[1].count == 2,
              let y = Int(parts[0]), let m = Int(parts[1]), m >= 1, m <= 12
        else { return nil }
        return (1...daysInMonth(year: y, month: m)).map {
            "\(month)-\(String(format: "%02d", $0))"
        }
    }

    /// Today in Asia/Jerusalem as an ISO date. The one place a real clock is read.
    public static func today(now: Date = Date()) -> String {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Asia/Jerusalem") ?? .gmt
        let c = calendar.dateComponents([.year, .month, .day], from: now)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }
}

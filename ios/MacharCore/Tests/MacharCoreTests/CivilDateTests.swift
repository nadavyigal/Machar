import XCTest
@testable import MacharCore

final class CivilDateTests: XCTestCase {
    func testDayOfWeekMatchesKnownDates() {
        // 2026-09-01 is the first day of תשפ"ז and a Tuesday, per the Ministry circular.
        XCTAssertEqual(CivilDate.dayOfWeek("2026-09-01"), 2)
        XCTAssertEqual(CivilDate.dayOfWeek("2026-09-04"), 5) // Friday
        XCTAssertEqual(CivilDate.dayOfWeek("2026-09-05"), 6) // Saturday
        XCTAssertEqual(CivilDate.dayOfWeek("2026-09-06"), 0) // Sunday
        XCTAssertEqual(CivilDate.dayOfWeek("2027-02-28"), 0) // Sunday, non-leap year
        XCTAssertEqual(CivilDate.dayOfWeek("2028-02-29"), 2) // Tuesday, leap day
    }

    func testRejectsCalendarInvalidDates() {
        // The TypeScript engine shipped a shape-only regex that let both of these
        // through; 2026-11-31 silently rolled forward to 2026-12-01.
        XCTAssertNil(CivilDate.parse("2026-11-31"))
        XCTAssertNil(CivilDate.parse("2026-13-01"))
        XCTAssertNil(CivilDate.parse("2027-02-29")) // 2027 is not a leap year
        XCTAssertNil(CivilDate.parse("2026-9-01"))  // not zero-padded
        XCTAssertNil(CivilDate.parse(""))
        XCTAssertNil(CivilDate.parse("garbage"))
        XCTAssertNotNil(CivilDate.parse("2028-02-29"))
    }

    func testDaysInMonthCoversLeapAndYearBoundaries() {
        XCTAssertEqual(CivilDate.datesInMonth("2027-02")?.count, 28)
        XCTAssertEqual(CivilDate.datesInMonth("2028-02")?.count, 29)
        XCTAssertEqual(CivilDate.datesInMonth("2026-12")?.count, 31)
        XCTAssertEqual(CivilDate.datesInMonth("2027-01")?.count, 31)
        XCTAssertEqual(CivilDate.datesInMonth("2026-09")?.first, "2026-09-01")
        XCTAssertEqual(CivilDate.datesInMonth("2026-09")?.last, "2026-09-30")
    }

    func testRejectsMalformedMonths() {
        XCTAssertNil(CivilDate.datesInMonth("2026-9"))
        XCTAssertNil(CivilDate.datesInMonth("2026-13"))
        XCTAssertNil(CivilDate.datesInMonth(""))
        XCTAssertNil(CivilDate.datesInMonth("garbage"))
    }
}

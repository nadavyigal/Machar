import XCTest
@testable import MacharCore

/// Mirrors `src/lib/calendar/resolveDay.test.ts`. If a case changes there it must
/// change here: the Swift and TypeScript engines are two implementations of one
/// contract, and a family sees the Swift one.
final class ResolveDayTests: XCTestCase {
    private var year: SchoolYear!

    override func setUpWithError() throws {
        year = try SchoolYearStore.bundledYear()
    }

    func testOrdinaryStudyDayIsOpen() {
        let status = resolveDay(year: year, level: .school, pattern: .fiveDay, date: "2026-09-01")
        XCTAssertTrue(status.open)
        XCTAssertFalse(status.shortDay)
        XCTAssertNil(status.reason)
    }

    func testOutsideTheSchoolYearIsClosed() {
        let before = resolveDay(year: year, level: .school, pattern: .fiveDay, date: "2026-08-31")
        XCTAssertFalse(before.open)
        XCTAssertEqual(before.reason, "מחוץ לשנת הלימודים")

        let after = resolveDay(year: year, level: .school, pattern: .fiveDay, date: "2027-07-01")
        XCTAssertFalse(after.open)

        // Both term boundaries are inclusive.
        XCTAssertTrue(resolveDay(year: year, level: .school, pattern: .fiveDay, date: "2027-06-30").open)
    }

    func testSaturdayIsAlwaysClosed() {
        for pattern in WeekPattern.allCases {
            let status = resolveDay(year: year, level: .school, pattern: pattern, date: "2026-09-05")
            XCTAssertFalse(status.open)
            XCTAssertEqual(status.reason, "שבת")
        }
    }

    func testFridayDependsOnWeekPattern() {
        let five = resolveDay(year: year, level: .school, pattern: .fiveDay, date: "2026-09-04")
        XCTAssertFalse(five.open)
        XCTAssertEqual(five.reason, "יום שישי")

        let six = resolveDay(year: year, level: .school, pattern: .sixDay, date: "2026-09-04")
        XCTAssertTrue(six.open)
        XCTAssertNil(six.reason)
    }

    func testClosureClosesTheDay() {
        // 2026-09-13 is the last day of ראש השנה and a Sunday, so the weekday
        // rules cannot mask the closure.
        let status = resolveDay(year: year, level: .school, pattern: .fiveDay, date: "2026-09-13")
        XCTAssertFalse(status.open)
        XCTAssertEqual(status.reason, "ראש השנה")
    }

    func testWeekdayRulesTakePrecedenceOverAClosure() {
        // 2026-09-11 is both a Friday and inside ראש השנה. On a five-day week the
        // parent is told it is Friday; on a six-day week the closure is the reason.
        XCTAssertEqual(
            resolveDay(year: year, level: .school, pattern: .fiveDay, date: "2026-09-11").reason,
            "יום שישי"
        )
        XCTAssertEqual(
            resolveDay(year: year, level: .school, pattern: .sixDay, date: "2026-09-11").reason,
            "ראש השנה"
        )
    }

    func testShortDayIsOpenAndLevelScoped() {
        // צום גדליה, 2026-09-14 (Monday), is a short day for school only.
        let school = resolveDay(year: year, level: .school, pattern: .fiveDay, date: "2026-09-14")
        XCTAssertTrue(school.open)
        XCTAssertTrue(school.shortDay)
        XCTAssertEqual(school.reason, "צום גדליה")

        let gan = resolveDay(year: year, level: .gan, pattern: .fiveDay, date: "2026-09-14")
        XCTAssertTrue(gan.open)
        XCTAssertFalse(gan.shortDay)
        XCTAssertNil(gan.reason)
    }
}

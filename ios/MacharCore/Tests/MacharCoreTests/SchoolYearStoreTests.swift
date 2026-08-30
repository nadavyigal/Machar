import XCTest
@testable import MacharCore

final class SchoolYearStoreTests: XCTestCase {
    /// Guards the generated bundle against a silently truncated or re-shaped export.
    func testBundledYearDecodesWithTheExpectedShape() throws {
        let year = try SchoolYearStore.bundledYear()
        XCTAssertEqual(year.label, "תשפ\"ז")
        XCTAssertEqual(year.terms.gan.start, "2026-09-01")
        XCTAssertEqual(year.terms.school.end, "2027-06-30")
        XCTAssertEqual(year.closures.count, 9)
        XCTAssertEqual(year.shortDays.count, 4)
        XCTAssertTrue(year.closures.contains { $0.key == "kippur_sukkot_bridge" })
        XCTAssertTrue(year.shortDays.allSatisfy { $0.levels == [.school] })
    }

    func testEveryDateInTheBundleIsARealCalendarDate() throws {
        let year = try SchoolYearStore.bundledYear()
        for closure in year.closures {
            XCTAssertTrue(CivilDate.isValid(closure.from), "\(closure.key) from")
            XCTAssertTrue(CivilDate.isValid(closure.to), "\(closure.key) to")
            XCTAssertTrue(closure.from <= closure.to, "\(closure.key) is inverted")
        }
        for short in year.shortDays {
            XCTAssertTrue(CivilDate.isValid(short.date), "\(short.key)")
        }
    }
}

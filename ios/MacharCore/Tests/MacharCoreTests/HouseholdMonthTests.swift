import XCTest
@testable import MacharCore

final class HouseholdMonthTests: XCTestCase {
    private var year: SchoolYear!

    private let toddler = ChildContext(
        memberId: "child-gan", firstName: "נועה", level: .gan, weekPattern: .sixDay
    )
    private let pupil = ChildContext(
        memberId: "child-school", firstName: "איתי", level: .school, weekPattern: .fiveDay
    )

    override func setUpWithError() throws {
        year = try SchoolYearStore.bundledYear()
    }

    func testBuildsEveryDayOfTheMonthForEveryChild() throws {
        let month = try buildHouseholdMonth(year: year, children: [toddler, pupil], month: "2026-09")
        XCTAssertEqual(month.days.count, 30)
        XCTAssertEqual(month.days.first?.date, "2026-09-01")
        XCTAssertTrue(month.days.allSatisfy { $0.perChild.count == 2 })
    }

    func testAnyClosedFlagsTheDaysThatCostAParentAWorkday() throws {
        let month = try buildHouseholdMonth(year: year, children: [toddler, pupil], month: "2026-09")
        let byDate = Dictionary(uniqueKeysWithValues: month.days.map { ($0.date, $0) })

        // Friday 2026-09-04: the five-day pupil is off, the six-day toddler is not.
        XCTAssertEqual(byDate["2026-09-04"]?.anyClosed, true)
        XCTAssertEqual(byDate["2026-09-04"]?.allClosed, false)

        // Saturday: everyone is off.
        XCTAssertEqual(byDate["2026-09-05"]?.allClosed, true)

        // An ordinary Tuesday: nobody is off.
        XCTAssertEqual(byDate["2026-09-01"]?.anyClosed, false)
    }

    func testAllClosedIsFalseWithNoChildren() throws {
        let month = try buildHouseholdMonth(year: year, children: [], month: "2026-09")
        XCTAssertTrue(month.days.allSatisfy { !$0.allClosed && !$0.anyClosed })
    }

    func testRejectsMalformedMonths() {
        for bad in ["2026-9", "", "garbage", "2026-13"] {
            XCTAssertThrowsError(
                try buildHouseholdMonth(year: year, children: [pupil], month: bad)
            ) { error in
                XCTAssertEqual(error as? CalendarError, .invalidMonth(bad))
            }
        }
    }

    func testFebruaryAndYearBoundaries() throws {
        // 2027-02 is the in-term February for this year: real weekday resolution,
        // not the out-of-year branch.
        let feb = try buildHouseholdMonth(year: year, children: [pupil], month: "2027-02")
        XCTAssertEqual(feb.days.count, 28)
        XCTAssertEqual(feb.days.first(where: { $0.date == "2027-02-01" })?.anyClosed, false) // Monday
        XCTAssertEqual(feb.days.first(where: { $0.date == "2027-02-06" })?.allClosed, true)  // Saturday

        XCTAssertEqual(try buildHouseholdMonth(year: year, children: [pupil], month: "2026-12").days.count, 31)
    }
}

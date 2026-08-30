import Foundation

/// The two school levels Machar models. `school` covers יסודי, חטיבת ביניים and
/// חטיבה עליונה; see the caveats in the TypeScript source of truth
/// (`src/lib/calendar/data/2026-2027.ts`) for what that simplification costs.
public enum SchoolLevel: String, Codable, Sendable, CaseIterable {
    case gan
    case school
}

/// Whether the child's institution runs a five-day (Sun–Thu) or six-day
/// (Sun–Fri) week.
public enum WeekPattern: String, Codable, Sendable, CaseIterable {
    case fiveDay = "five_day"
    case sixDay = "six_day"
}

public struct Closure: Codable, Sendable, Equatable {
    public let key: String
    public let name: String
    /// Inclusive ISO `YYYY-MM-DD`.
    public let from: String
    /// Inclusive ISO `YYYY-MM-DD`.
    public let to: String
    public let levels: [SchoolLevel]

    public init(key: String, name: String, from: String, to: String, levels: [SchoolLevel]) {
        self.key = key
        self.name = name
        self.from = from
        self.to = to
        self.levels = levels
    }
}

public struct ShortDay: Codable, Sendable, Equatable {
    public let key: String
    public let name: String
    /// ISO `YYYY-MM-DD`.
    public let date: String
    public let levels: [SchoolLevel]

    public init(key: String, name: String, date: String, levels: [SchoolLevel]) {
        self.key = key
        self.name = name
        self.date = date
        self.levels = levels
    }
}

public struct Term: Codable, Sendable, Equatable {
    public let start: String
    public let end: String

    public init(start: String, end: String) {
        self.start = start
        self.end = end
    }
}

/// `Record<SchoolLevel, Term>` in the TypeScript source. Modelled as a struct
/// rather than `[SchoolLevel: Term]` because Swift only encodes a dictionary as a
/// JSON object when its key is `String`/`Int` or conforms to
/// `CodingKeyRepresentable`; a plain enum key would decode from an unkeyed
/// container and silently fail against the generated JSON.
public struct Terms: Codable, Sendable, Equatable {
    public let gan: Term
    public let school: Term

    public init(gan: Term, school: Term) {
        self.gan = gan
        self.school = school
    }

    public subscript(level: SchoolLevel) -> Term {
        switch level {
        case .gan: return gan
        case .school: return school
        }
    }
}

public struct SchoolYear: Codable, Sendable, Equatable {
    public let label: String
    public let terms: Terms
    public let closures: [Closure]
    public let shortDays: [ShortDay]

    public init(
        label: String,
        terms: Terms,
        closures: [Closure],
        shortDays: [ShortDay]
    ) {
        self.label = label
        self.terms = terms
        self.closures = closures
        self.shortDays = shortDays
    }

    public func term(for level: SchoolLevel) -> Term { terms[level] }
}

/// The resolved state of one date for one child.
public struct DayStatus: Sendable, Equatable {
    public let date: String
    public let open: Bool
    public let shortDay: Bool
    /// Hebrew reason shown to the parent. `nil` on an ordinary open day.
    public let reason: String?

    public init(date: String, open: Bool, shortDay: Bool, reason: String?) {
        self.date = date
        self.open = open
        self.shortDay = shortDay
        self.reason = reason
    }
}

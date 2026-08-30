import Foundation

/// Loads the school year that ships in the app bundle.
///
/// The bundled JSON is generated from `src/lib/calendar/data/2026-2027.ts` by
/// `scripts/exportSchoolYear.mjs` and must never be hand-edited: the TypeScript
/// file carries the Ministry source citation and the transcription caveats.
///
/// Bundling it is deliberate. Machar's promise is that a parent installs the app
/// and immediately sees a correct calendar, which rules out a network round trip
/// on first launch. Supabase-sourced years (later school years, institution- and
/// class-scope events) layer on top of this, they do not replace it.
public enum SchoolYearStore {
    public enum LoadError: Error, CustomStringConvertible {
        case resourceMissing(String)

        public var description: String {
            switch self {
            case .resourceMissing(let name):
                return "SchoolYearStore: \(name).json is not in the bundle"
            }
        }
    }

    public static let bundledYearName = "school-year-2026-2027"

    /// The 2026-27 (תשפ"ז) school year.
    ///
    /// - Important: this data has passed automated consistency checks only. The
    ///   human fidelity check against the published Ministry circular
    ///   (הודעה מס' 0363) has not been done. Do not ship to families before it is.
    public static func bundledYear() throws -> SchoolYear {
        guard let url = Bundle.module.url(forResource: bundledYearName, withExtension: "json") else {
            throw LoadError.resourceMissing(bundledYearName)
        }
        return try JSONDecoder().decode(SchoolYear.self, from: Data(contentsOf: url))
    }
}

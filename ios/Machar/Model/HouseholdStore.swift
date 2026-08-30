import Foundation
import MacharCore

/// The household as this device knows it.
///
/// v1 is deliberately local-only: a JSON file in Application Support, no account
/// and no network. The Supabase schema and its household-isolation RLS already
/// exist (`supabase/migrations/`), and `ChildContext` mirrors the `members` /
/// `enrollments` shape on purpose, so sync is an additive phase rather than a
/// rewrite. Sign-in buys a family nothing until there is a second device or a
/// shared class calendar.
@MainActor
final class HouseholdStore: ObservableObject {
    @Published private(set) var storedChildren: [ChildContext] = []

    private let fileURL: URL

    init(fileURL: URL? = nil) {
        self.fileURL = fileURL ?? Self.defaultFileURL()
        load()
    }

    var children: [ChildContext] { storedChildren }

    func add(_ child: ChildContext) {
        storedChildren.append(child)
        save()
    }

    func remove(atOffsets offsets: IndexSet) {
        storedChildren.remove(atOffsets: offsets)
        save()
    }

    func replaceAll(with children: [ChildContext]) {
        storedChildren = children
        save()
    }

    private static func defaultFileURL() -> URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try? FileManager.default.createDirectory(at: base, withIntermediateDirectories: true)
        return base.appendingPathComponent("machar-household.json")
    }

    private func load() {
        guard let data = try? Data(contentsOf: fileURL) else { return }
        storedChildren = (try? JSONDecoder().decode([ChildContext].self, from: data)) ?? []
    }

    private func save() {
        guard let data = try? JSONEncoder().encode(storedChildren) else { return }
        try? data.write(to: fileURL, options: .atomic)
    }
}

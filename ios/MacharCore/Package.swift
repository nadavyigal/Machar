// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "MacharCore",
    defaultLocalization: "he",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "MacharCore", targets: ["MacharCore"]),
    ],
    targets: [
        .target(
            name: "MacharCore",
            resources: [.process("Resources")]
        ),
        .testTarget(
            name: "MacharCoreTests",
            dependencies: ["MacharCore"]
        ),
    ]
)

import SwiftUI

struct NugMark: View {
    var slug: String
    var type: String

    var body: some View {
        Canvas { context, size in
            var random = Seed(seed(from: slug))
            let base = Theme.strainTone(type)
            context.fill(Path(CGRect(origin: .zero, size: size)), with: .color(Theme.panel))
            for index in 0..<7 {
                let width = size.width * (0.28 + random.next() * 0.34)
                let height = size.height * (0.22 + random.next() * 0.3)
                let x = size.width * random.next()
                let y = size.height * random.next()
                let rect = CGRect(x: x - width / 2, y: y - height / 2, width: width, height: height)
                let color = index.isMultiple(of: 2) ? base : Theme.phosphor
                context.fill(Path(ellipseIn: rect), with: .color(color.opacity(0.28 + random.next() * 0.35)))
            }
        }
        .frame(height: 180)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
        .accessibilityLabel("Generated mark for \(slug)")
    }
}

private struct Seed {
    var state: UInt64
    mutating func next() -> Double {
        state = state &* 6364136223846793005 &+ 1
        return Double(state % 10_000) / 9_999.0
    }
}

private func seed(from slug: String) -> UInt64 {
    var value: UInt64 = 14_695_981_039_346_656_03
    for byte in slug.utf8 {
        value ^= UInt64(byte)
        value &*= 1_099_511_628_211
    }
    return value == 0 ? 1 : value
}

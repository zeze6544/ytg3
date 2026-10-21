import SwiftUI

struct ArchiveScreen: ViewModifier {
    func body(content: Content) -> some View {
        content
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(Theme.bg.ignoresSafeArea())
            .toolbarBackground(Theme.bg, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .preferredColorScheme(.dark)
    }
}

extension View {
    func archiveScreen() -> some View {
        modifier(ArchiveScreen())
    }

    func archiveDestinations() -> some View {
        navigationDestination(for: ArchiveLink.self) { link in
            switch link {
            case .drug(let slug):
                DrugDetailView(slug: slug)
            case .strain(let slug):
                StrainDetailView(slug: slug)
            case .reagent(let slug):
                ReagentDetailView(slug: slug)
            case .classes:
                ClassListView()
            case .timeline:
                TimelineListView()
            case .reagents:
                ReagentListView()
            case .saved:
                SavedListView()
            case .about:
                AboutView()
            }
        }
    }
}

struct Wordmark: View {
    var body: some View {
        Text("NARCØDEX")
            .font(Theme.mono(28, weight: .medium))
            .foregroundStyle(Theme.phosphor)
            .lineLimit(1)
            .minimumScaleFactor(0.6)
    }
}

struct Panel<Content: View>: View {
    var title: String
    var code: String
    var tone: Color = Theme.phosphor
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(title)
                    .font(Theme.mono(12, weight: .medium))
                    .foregroundStyle(tone)
                Spacer()
                Text(code)
                    .font(Theme.mono(11))
                    .foregroundStyle(Theme.muted)
            }
            content()
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.panel)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }
}

struct TagChip: View {
    var text: String
    var tone: Color = Theme.phosphor
    var filled = false

    var body: some View {
        Text(text)
            .font(Theme.mono(11, weight: .medium))
            .foregroundStyle(filled ? Theme.bg : tone)
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(filled ? tone : Color.clear)
            .overlay(Rectangle().stroke(tone, lineWidth: 1))
            .lineLimit(1)
    }
}

struct FieldLine: View {
    var label: String
    var value: String?

    var body: some View {
        if let value, !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            VStack(alignment: .leading, spacing: 4) {
                Text(label.uppercased())
                    .font(Theme.mono(10))
                    .foregroundStyle(Theme.muted)
                Text(value)
                    .font(Theme.mono(14))
                    .foregroundStyle(Theme.text)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

struct BannerText: View {
    var text: String
    var tone: Color = Theme.amber

    var body: some View {
        Text(text)
            .font(Theme.mono(13))
            .foregroundStyle(tone)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct ActionButton: View {
    var title: String
    var tone: Color = Theme.phosphor
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(Theme.mono(13, weight: .medium))
                .foregroundStyle(tone)
                .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                .padding(.horizontal, 12)
                .overlay(Rectangle().stroke(tone.opacity(0.8), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

struct FileRow: View {
    var title: String
    var subtitle: String
    var tag: String
    var tone: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline) {
                Text(title)
                    .font(Theme.mono(18))
                    .foregroundStyle(Theme.phosphor)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 8)
                TagChip(text: tag, tone: tone)
            }
            if !subtitle.isEmpty {
                Text(subtitle)
                    .font(Theme.mono(12))
                    .foregroundStyle(Theme.muted)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .bottom) { Rectangle().fill(Theme.line).frame(height: 1) }
    }
}

struct ChipRow<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) { content() }
                .padding(.vertical, 2)
        }
    }
}

func formatCount(_ value: Int) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .decimal
    return formatter.string(from: NSNumber(value: value)) ?? "\(value)"
}

func joinedNames(_ values: [String]?) -> String? {
    let text = (values ?? []).map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }.joined(separator: ", ")
    return text.isEmpty ? nil : text
}

import { colors, fonts, toneColor, type Tone } from "@/constants/theme";
import { forwardRef, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, type ScrollViewProps, type TextInputProps, type TextStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const breakWord: TextStyle = Platform.OS === "web"
  ? ({ overflowWrap: "anywhere", wordBreak: "break-word" } as TextStyle)
  : {};

export function useScreenInsets(safeTop = false) {
  const insets = useSafeAreaInsets();
  return {
    paddingTop: (safeTop ? insets.top : 0) + 12,
    paddingBottom: insets.bottom + (safeTop ? 92 : 28),
    paddingHorizontal: 16,
    gap: 12,
  };
}

export type Scroller = { scrollTo: (options: { y: number; animated?: boolean }) => void };

export const Screen = forwardRef<Scroller, ScrollViewProps & { children: ReactNode; safeTop?: boolean }>(function Screen(
  { children, safeTop = false, contentContainerStyle, ...rest },
  ref,
) {
  const insets = useScreenInsets(safeTop);
  return (
    <ScrollView
      ref={ref as never}
      style={styles.screen}
      contentContainerStyle={[insets, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {children}
    </ScrollView>
  );
});

export function Wordmark() {
  const { width } = useWindowDimensions();
  const size = width < 360 ? 44 : 52;
  return (
    <Text style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: size, lineHeight: size }}>
      NARC<Text style={{ color: colors.cyan }}>Ø</Text>DEX
    </Text>
  );
}

export function PageTitle({ children, tone = "phosphor" }: { children: string; tone?: Tone }) {
  const { width } = useWindowDimensions();
  const size = width < 360 ? 34 : 40;
  return (
    <Text numberOfLines={2} style={[styles.pageTitle, breakWord, { color: toneColor[tone], fontSize: size, lineHeight: size + 4 }]}>
      {children}
    </Text>
  );
}

export function SearchField(props: TextInputProps) {
  const value = String(props.value ?? "");
  const canClear = Boolean(props.onChangeText && value);
  return (
    <View style={styles.searchWrap}>
      <TextInput
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={typeof props.placeholder === "string" ? props.placeholder : "Search"}
        clearButtonMode="while-editing"
        {...props}
        style={[styles.search, canClear ? styles.searchPad : null, props.style]}
      />
      {canClear ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => props.onChangeText?.("")}
          style={styles.clearBtn}
        >
          <Text style={styles.clearText}>CLEAR</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ChipWrap({ children }: { children: ReactNode }) {
  return <View style={styles.chips}>{children}</View>;
}

export function ChipScroller({ children, sticky = false }: { children: ReactNode; sticky?: boolean }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={[
        styles.scroller,
        sticky && Platform.OS === "web"
          ? ({ position: "sticky", top: 0, zIndex: 4, backgroundColor: colors.bg, paddingVertical: 6 } as const)
          : null,
      ]}
      contentContainerStyle={styles.scrollerContent}
    >
      {children}
    </ScrollView>
  );
}

export function NameRow({ name, tag, tone = "phosphor" }: { name: string; tag: string; tone?: Tone }) {
  return (
    <View style={styles.nameRow}>
      <Text style={[styles.cardTitle, breakWord]}>{name}</Text>
      <Tag tone={tone}>{tag}</Tag>
    </View>
  );
}

export function Frame({
  title,
  code,
  children,
  tone = "phosphor",
}: {
  title: string;
  code?: string;
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <View style={styles.frame}>
      <View style={styles.frameHead}>
        <Text style={[styles.frameTitle, { color: toneColor[tone] }]} numberOfLines={1}>
          ◈ {title}
        </Text>
        {code ? <Text style={styles.frameCode}>{code}</Text> : null}
      </View>
      <View style={styles.frameBody}>{children}</View>
    </View>
  );
}

export function Tag({ children, tone = "phosphor", filled = false }: { children: ReactNode; tone?: Tone; filled?: boolean }) {
  const color = toneColor[tone];
  return (
    <View style={[styles.tag, { borderColor: color, backgroundColor: filled ? color : "transparent" }]}>
      <Text style={[styles.tagText, breakWord, { color: filled ? colors.bg : color }]}>{children}</Text>
    </View>
  );
}

export function Field({ label, value }: { label: string; value?: string | number | null }) {
  const text = value === null || value === undefined || value === "" ? null : String(value);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, breakWord]}>{text ?? "· see the class record ·"}</Text>
    </View>
  );
}

export function Banner({ children, tone = "red" }: { children: string; tone?: Tone }) {
  return (
    <View style={[styles.banner, { borderColor: toneColor[tone] }]}>
      <Text style={[styles.bannerText, breakWord, { color: toneColor[tone] }]}>{children}</Text>
    </View>
  );
}

export function FileCard({ children, onPress }: { children: ReactNode; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.fileCard,
        pressed ? styles.fileCardOn : null,
        Platform.OS === "web" ? styles.pointer : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function LoadMore({ label, onPress }: { label: string; onPress: () => void }) {
  return <Action label={label} tone="cyan" onPress={onPress} />;
}

export function Prose({ children }: { children: string }) {
  return <Text style={[styles.prose, breakWord]}>{children}</Text>;
}

export function FinePrint() {
  return (
    <Text style={[styles.fine, breakWord]}>
      Not a dose. Not a source. If someone is not breathing or will not wake, contact local emergency services.
    </Text>
  );
}

export function Action({
  label,
  onPress,
  tone = "phosphor",
  disabled,
}: {
  label: string;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { borderColor: toneColor[tone], opacity: disabled ? 0.4 : pressed ? 0.72 : 1 },
        Platform.OS === "web" ? styles.pointer : null,
      ]}
    >
      <Text style={[styles.actionText, breakWord, { color: toneColor[tone] }]}>{label}</Text>
    </Pressable>
  );
}

export function Status({ children }: { children: ReactNode }) {
  return <Text style={styles.status}>{children}</Text>;
}

export function MissingArchive() {
  return (
    <View style={[styles.banner, { borderColor: colors.amber }]}>
      <Text style={[styles.bannerText, { color: colors.amber }]}>
        The live index is not connected on this build yet. Static guides still open. Nothing here is medical advice.
      </Text>
    </View>
  );
}

export function QueryError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "The archive could not be read.";
  return <Banner tone="red">{message}</Banner>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pageTitle: { fontFamily: fonts.display, color: colors.phosphor },
  searchWrap: { position: "relative", justifyContent: "center" },
  search: {
    borderWidth: 1,
    borderColor: colors.phosphor,
    color: colors.phosphor,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 4,
    minHeight: 48,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null),
  },
  searchPad: { paddingRight: 76 },
  clearBtn: {
    position: "absolute",
    right: 8,
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  clearText: { fontFamily: fonts.body, color: colors.cyan, fontSize: 11, letterSpacing: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, width: "100%" },
  scroller: { flexGrow: 0, marginHorizontal: -16 },
  scrollerContent: { gap: 6, paddingHorizontal: 16 },
  fileCard: {
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    borderRadius: 4,
    gap: 6,
    backgroundColor: colors.panel,
    minHeight: 44,
  },
  fileCardOn: { borderColor: colors.phosphor, backgroundColor: colors.panel2 },
  pointer: { cursor: "pointer" } as object,
  nameRow: { gap: 6, minWidth: 0 },
  cardTitle: { fontFamily: fonts.display, color: colors.phosphor, fontSize: 26, lineHeight: 28 },
  frame: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    borderRadius: 4,
  },
  frameHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  frameTitle: { fontFamily: fonts.display, fontSize: 20, flex: 1, minWidth: 0 },
  frameCode: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 1,
  },
  frameBody: { padding: 12, gap: 8 },
  tag: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
    maxWidth: "100%",
    flexShrink: 1,
  },
  tagText: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  field: {
    borderBottomWidth: 1,
    borderBottomColor: "#1d3a24",
    paddingVertical: 6,
    gap: 2,
  },
  fieldLabel: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  fieldValue: { fontFamily: fonts.body, color: colors.text, fontSize: 14, lineHeight: 21, minWidth: 0 },
  prose: { fontFamily: fonts.body, color: colors.text, fontSize: 14, lineHeight: 22 },
  fine: { fontFamily: fonts.body, color: colors.muted, fontSize: 11, lineHeight: 16 },
  banner: { borderWidth: 1, borderRadius: 4, padding: 10, backgroundColor: "#1a120f" },
  bannerText: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
  action: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    alignSelf: "stretch",
    minHeight: 44,
    justifyContent: "center",
  },
  actionText: {
    fontFamily: fonts.body,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    textAlign: "center",
  },
  status: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  });

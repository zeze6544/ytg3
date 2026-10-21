import { colors, fonts, space, toneColor, type Tone } from "@/constants/theme";
import { forwardRef, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, type ScrollViewProps, type TextInputProps, type TextStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const breakWord: TextStyle = Platform.OS === "web"
  ? ({ overflowWrap: "anywhere", wordBreak: "break-word" } as TextStyle)
  : {};

export function useScreenInsets(safeTop = false) {
  const insets = useSafeAreaInsets();
  return {
    paddingTop: (safeTop ? insets.top : 0) + 28,
    paddingBottom: insets.bottom + (safeTop ? 96 : 36),
    paddingHorizontal: space.page,
    gap: space.section,
    width: "100%" as const,
    maxWidth: 720,
    alignSelf: "center" as const,
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
  const size = width < 360 ? 40 : 46;
  return (
    <Text style={{ fontFamily: fonts.display, fontWeight: "700", color: colors.phosphor, fontSize: size, lineHeight: Math.round(size * 1.15), letterSpacing: 0.4 }}>
      NARC<Text style={{ color: colors.cyan }}>Ø</Text>DEX
    </Text>
  );
}

export function PageTitle({ children, tone = "phosphor" }: { children: string; tone?: Tone }) {
  const { width } = useWindowDimensions();
  const size = width < 360 ? 32 : 36;
  return (
    <Text numberOfLines={3} style={[styles.pageTitle, breakWord, { color: toneColor[tone], fontSize: size, lineHeight: size + 8 }]}>
      {children}
    </Text>
  );
}

export function Lead({ children }: { children: string }) {
  return <Text style={[styles.lead, breakWord]}>{children}</Text>;
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
          <Text style={styles.clearText}>Clear</Text>
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
          ? ({ position: "sticky", top: 0, zIndex: 4, backgroundColor: colors.bg, paddingVertical: 6 } as object)
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
        <Text style={[styles.frameTitle, breakWord, { color: toneColor[tone] }]}>{title}</Text>
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
      <Text style={[styles.fieldValue, breakWord]}>{text ?? "Not on this file."}</Text>
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
      This is not a dose and not a source. If someone is not breathing or will not wake, contact local emergency services.
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
  pageTitle: { fontFamily: fonts.display, fontWeight: "700", color: colors.phosphor },
  lead: { fontFamily: fonts.body, color: colors.text, fontSize: 17, lineHeight: 28 },
  searchWrap: { position: "relative", justifyContent: "center" },
  search: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 17,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 52,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null),
  },
  searchPad: { paddingRight: 84 },
  clearBtn: {
    position: "absolute",
    right: 10,
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  clearText: { fontFamily: fonts.body, fontWeight: "600", color: colors.cyan, fontSize: 15 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, width: "100%" },
  scroller: { flexGrow: 0, marginHorizontal: -space.page },
  scrollerContent: { gap: 8, paddingHorizontal: space.page, paddingVertical: 2 },
  fileCard: {
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.card,
    borderRadius: 14,
    gap: 12,
    backgroundColor: colors.panel,
    minHeight: 56,
  },
  fileCardOn: { borderColor: colors.phosphor, backgroundColor: colors.panel2 },
  pointer: { cursor: "pointer" } as object,
  nameRow: { gap: 8, minWidth: 0 },
  cardTitle: { fontFamily: fonts.display, fontWeight: "700", color: colors.phosphor, fontSize: 28, lineHeight: 34 },
  frame: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    borderRadius: 14,
  },
  frameHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: space.card,
    paddingTop: 16,
    paddingBottom: 12,
  },
  frameTitle: { fontFamily: fonts.display, fontWeight: "700", fontSize: 24, lineHeight: 30, flex: 1, minWidth: 0 },
  frameCode: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  frameBody: { padding: space.card, gap: 16 },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
    maxWidth: "100%",
    flexShrink: 1,
  },
  tagText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
  },
  field: {
    borderBottomWidth: 1,
    borderBottomColor: "#24382c",
    paddingVertical: 12,
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fonts.body,
    fontWeight: "600",
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  fieldValue: { fontFamily: fonts.body, color: colors.text, fontSize: 17, lineHeight: 28, minWidth: 0 },
  prose: { fontFamily: fonts.body, color: colors.text, fontSize: 17, lineHeight: 28 },
  fine: { fontFamily: fonts.body, color: colors.muted, fontSize: 15, lineHeight: 24 },
  banner: { borderWidth: 1, borderRadius: 14, padding: 18, backgroundColor: "#241814" },
  bannerText: { fontFamily: fonts.body, fontSize: 16, lineHeight: 26 },
  action: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    alignSelf: "stretch",
    minHeight: 52,
    justifyContent: "center",
    backgroundColor: colors.panel,
  },
  actionText: {
    fontFamily: fonts.body,
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  status: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 26,
  },
});

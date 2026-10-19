import { colors, fonts, toneColor, type Tone } from "@/constants/theme";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewProps } from "react-native";

export function Screen({ children, ...rest }: ScrollViewProps & { children: ReactNode }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {children}
    </ScrollView>
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

export function Tag({ children, tone = "phosphor" }: { children: ReactNode; tone?: Tone }) {
  return (
    <View style={[styles.tag, { borderColor: toneColor[tone] }]}>
      <Text style={[styles.tagText, { color: toneColor[tone] }]}>{children}</Text>
    </View>
  );
}

export function Field({ label, value }: { label: string; value?: string | number | null }) {
  const text = value === null || value === undefined || value === "" ? null : String(value);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{text ?? "· unknown ·"}</Text>
    </View>
  );
}

export function Banner({ children, tone = "red" }: { children: string; tone?: Tone }) {
  return (
    <View style={[styles.banner, { borderColor: toneColor[tone] }]}>
      <Text style={[styles.bannerText, { color: toneColor[tone] }]}>{children}</Text>
    </View>
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
        { borderColor: toneColor[tone], opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.actionText, { color: toneColor[tone] }]}>{label}</Text>
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
  screenContent: { padding: 16, paddingBottom: 120, gap: 12 },
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
  frameTitle: { fontFamily: fonts.display, fontSize: 20, flex: 1 },
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
  },
  tagText: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 1,
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
  fieldValue: { fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 18 },
  banner: { borderWidth: 1, borderRadius: 4, padding: 10, backgroundColor: "#1a120f" },
  bannerText: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
  action: { borderWidth: 1, borderRadius: 4, paddingVertical: 10, paddingHorizontal: 12, alignItems: "center" },
  actionText: { fontFamily: fonts.body, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase" },
  status: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  });

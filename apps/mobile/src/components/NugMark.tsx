import { colors, fonts } from "@/constants/theme";
import { loadNug, loadNugFallback, peekNug, type NugSource } from "@/lib/nugClient";
import { specimenCode } from "@/lib/nugRender";
import { useEffect, useRef, useState } from "react";
import { Image, Text, View } from "react-native";

type State = { kind: "waiting" } | { kind: "ready"; source: NugSource } | { kind: "failed" };

// One specimen image per strain id. "compact" is the 300x200 card thumbnail;
// the full plate is 640x600 with top, side, bottom and zoom views.
export function NugMark({
  slug,
  id,
  name,
  type,
  stored = false,
  compact = false,
  visible = true,
}: {
  slug: string;
  id?: string;
  name: string;
  type?: string | null;
  stored?: boolean;
  compact?: boolean;
  visible?: boolean;
}) {
  const size = compact ? "thumb" : "detail";
  const key = id ?? `s_${slug}`;
  const want = `${slug}|${size}`;
  const [held, setHeld] = useState<{ for: string; state: State } | null>(null);
  const hit = held?.for === want ? null : peekNug(slug, size);
  const state: State = held?.for === want ? held.state : hit ? { kind: "ready", source: hit } : { kind: "waiting" };
  const setState = (next: State) => setHeld({ for: want, state: next });
  const retried = useRef(false);

  useEffect(() => {
    retried.current = false;
    if (peekNug(slug, size) || !visible) return;
    let alive = true;
    const settle = (next: State) => alive && setHeld({ for: `${slug}|${size}`, state: next });
    loadNug({ slug, id: key, type, size, stored }).then(
      (source) => settle({ kind: "ready", source }),
      () => settle({ kind: "failed" }),
    );
    return () => {
      alive = false;
    };
  }, [slug, key, type, size, stored, visible]);

  const ratio = compact ? 300 / 200 : 640 / 600;
  if (state.kind !== "ready") {
    return <Placeholder ratio={ratio} code={specimenCode(key)} failed={state.kind === "failed"} compact={compact} />;
  }
  return (
    <View>
      <Image
        accessibilityRole="image"
        accessibilityLabel={`Illustrative specimen render for ${name}, ${specimenCode(key)}. Not a photograph.`}
        source={{ uri: state.source.uri }}
        resizeMode="contain"
        onError={() => {
          if (retried.current || state.source.origin !== "stored") return setState({ kind: "failed" });
          retried.current = true;
          loadNugFallback({ slug, id: key, type, size }).then(
            (source) => setState({ kind: "ready", source }),
            () => setState({ kind: "failed" }),
          );
        }}
        style={{ width: "100%", aspectRatio: ratio, backgroundColor: colors.panel, borderRadius: 14 }}
      />
      {compact ? null : (
        <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10 }}>
          Drawn for this file ({specimenCode(key)}). {state.source.origin === "stored" ? "Stored with the archive." : "Drawn on this device."} Not a photograph of any batch.
        </Text>
      )}
    </View>
  );
}

function Placeholder({ ratio, code, failed, compact }: { ratio: number; code: string; failed: boolean; compact: boolean }) {
  return (
    <View
      accessibilityLabel={failed ? "Specimen image unavailable" : "Specimen image queued"}
      style={{ width: "100%", aspectRatio: ratio, backgroundColor: colors.panel, borderWidth: 1, borderColor: failed ? colors.red : colors.line, borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 8, padding: 16 }}
    >
      <Text style={{ fontFamily: fonts.display, fontWeight: "700", color: failed ? colors.red : colors.phosphor, fontSize: compact ? 18 : 24, lineHeight: compact ? 24 : 30, textAlign: "center" }}>
        {failed ? "Image unavailable" : "Drawing this specimen"}
      </Text>
      {compact ? null : <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center" }}>{code}. Not a photograph.</Text>}
    </View>
  );
}

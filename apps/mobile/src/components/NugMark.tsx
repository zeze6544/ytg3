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
        style={{ width: "100%", aspectRatio: ratio, backgroundColor: "#000" }}
      />
      {compact ? null : (
        <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 10, marginTop: 4 }}>
          ILLUSTRATIVE RENDER · {specimenCode(key)} · {state.source.origin === "stored" ? "stored asset" : "rendered on this device"} · not a photograph of any batch
        </Text>
      )}
    </View>
  );
}

function Placeholder({ ratio, code, failed, compact }: { ratio: number; code: string; failed: boolean; compact: boolean }) {
  return (
    <View
      accessibilityLabel={failed ? "Specimen image unavailable" : "Specimen image queued"}
      style={{ width: "100%", aspectRatio: ratio, backgroundColor: "#000", borderWidth: 1, borderColor: failed ? colors.red : colors.line, alignItems: "center", justifyContent: "center", gap: 4 }}
    >
      <Text style={{ fontFamily: fonts.display, color: failed ? colors.red : colors.phosphor, fontSize: compact ? 18 : 28, opacity: 0.85 }}>
        {failed ? "SPECIMEN UNAVAILABLE" : "SPECIMEN QUEUED"}
      </Text>
      <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: compact ? 9 : 11 }}>{code}</Text>
    </View>
  );
}

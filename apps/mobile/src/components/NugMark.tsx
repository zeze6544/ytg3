import { colors, fonts } from "@/constants/theme";
import { nugPlan } from "@/lib/nug";
import { Text, View } from "react-native";

export function NugMark({
  slug,
  name,
  type,
  compact = false,
}: {
  slug: string;
  name: string;
  type?: string | null;
  compact?: boolean;
}) {
  const plan = nugPlan({ slug, name, type });
  const width = compact ? 148 : 320;
  const height = compact ? 112 : 250;
  const scale = width / 360;
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Generated terminal mark for ${name}. Not a photograph.`}
      style={{ width, height, backgroundColor: colors.bg, borderWidth: 1, borderColor: plan.stroke, overflow: "hidden" }}
    >
      {compact ? null : (
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8, paddingTop: 6 }}>
          <Text style={{ fontFamily: fonts.display, color: plan.stroke, fontSize: 16 }}>NARCØDEX</Text>
          <Text style={{ fontFamily: fonts.body, color: colors.cyan, fontSize: 10 }}>PLANT FILE</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        {plan.buds.map((bud, index) => (
          <View
            key={`bud-${index}`}
            style={{
              position: "absolute",
              left: bud.x * scale - bud.rx * scale,
              top: (bud.y - 20) * scale - bud.ry * scale,
              width: bud.rx * 2 * scale,
              height: bud.ry * 2 * scale,
              borderRadius: bud.rx * scale,
              borderWidth: 1,
              borderColor: plan.stroke,
              backgroundColor: plan.fill,
            }}
          />
        ))}
        {plan.pistils.map((hair, index) => {
          const dx = (hair.x2 - hair.x1) * scale;
          const dy = (hair.y2 - hair.y1) * scale;
          const length = Math.max(4, Math.hypot(dx, dy));
          const angle = `${(Math.atan2(dy, dx) * 180) / Math.PI}deg`;
          return (
            <View
              key={`hair-${index}`}
              style={{
                position: "absolute",
                left: hair.x1 * scale,
                top: (hair.y1 - 20) * scale,
                width: length,
                height: 1.5,
                backgroundColor: plan.pistil,
                transform: [{ rotate: angle }],
              }}
            />
          );
        })}
        {plan.crystals.map((dot, index) => (
          <View
            key={`frost-${index}`}
            style={{
              position: "absolute",
              left: dot.x * scale,
              top: (dot.y - 20) * scale,
              width: Math.max(2, dot.rx * 2),
              height: Math.max(2, dot.rx * 2),
              borderRadius: 2,
              backgroundColor: plan.frost,
            }}
          />
        ))}
      </View>
      {compact ? null : (
        <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 10, padding: 8 }}>
          GENERATED MARK · NOT A PHOTOGRAPH
        </Text>
      )}
    </View>
  );
}

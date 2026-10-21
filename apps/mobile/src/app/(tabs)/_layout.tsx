import { colors } from "@/constants/theme";
import { useGate } from "@/lib/gate";
import { NativeTabs } from "expo-router/native-tabs";
import { Redirect } from "expo-router";

const tabStyle = { backgroundColor: colors.bg };

export default function TabLayout() {
  const gate = useGate();
  if (!gate.loading && !gate.accepted) return <Redirect href="/gate" />;

  return (
    <NativeTabs
      tintColor={colors.phosphor}
      iconColor={colors.muted}
      backgroundColor={colors.panel}
      indicatorColor={colors.panel2}
      disableTransparentOnScrollEdge
      labelStyle={{ color: colors.muted, fontSize: 14 }}
    >
      <NativeTabs.Trigger name="index" contentStyle={tabStyle} disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="files" contentStyle={tabStyle} disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Substances</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "doc.text", selected: "doc.text.fill" }} md="folder" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="mix" contentStyle={tabStyle} disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Mix</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "exclamationmark.triangle", selected: "exclamationmark.triangle.fill" }} md="warning" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="strains" contentStyle={tabStyle} disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Strains</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "leaf", selected: "leaf.fill" }} md="psychiatry" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more" contentStyle={tabStyle} disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>More</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} md="apps" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

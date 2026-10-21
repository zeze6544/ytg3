import { Frame, Prose, Screen, Wordmark } from "@/components/ui";

export default function AboutScreen() {
  return (
    <Screen>
      <Wordmark />
      <Frame title="What this is">
        <Prose>
          A personal archive of substances, strains, interactions, and history. It is written for people who want the evidence without the scare story, and for people looking after someone else. Evidence notes sit on the entries so you can see how firm the record is.
        </Prose>
        <Prose>
          It is not medical advice. Talk to a clinician, a pharmacist, or a harm-reduction service when a decision is medical. If someone is in immediate danger, contact local emergency services.
        </Prose>
      </Frame>
      <Frame title="What this is not" tone="red">
        <Prose>
          Not a shop. Not a dose calculator. Not synthesis instructions. Not a guide to obtaining a substance. Not a reason to use one. Every mix names what each substance does in the body. That description is not permission to combine them.
        </Prose>
      </Frame>
    </Screen>
  );
}

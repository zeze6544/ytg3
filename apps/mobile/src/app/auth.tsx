import { colors, fonts } from "@/constants/theme";
import { Action, Frame, Screen, Status } from "@/components/ui";
import { useSession } from "@/lib/session";
import { requireClient } from "@/lib/supabase";
import { router } from "expo-router";
import { useState } from "react";
import { Text, TextInput } from "react-native";

export default function AuthScreen() {
  const { user } = useSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      const sb = requireClient();
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.back();
      } else {
        const { error } = await sb.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setMessage("Check your email to confirm the account.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Access failed.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await requireClient().auth.signOut();
    setMessage("Signed out.");
  }

  return (
    <Screen>
      <Frame title="ACCESS TERMINAL" code="AUTH" tone="cyan">
        {user ? (
          <>
            <Text style={{ fontFamily: fonts.body, color: colors.text }}>{user.email}</Text>
            <Action label="Sign out" tone="red" onPress={() => void signOut()} />
          </>
        ) : (
          <>
            <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 18 }}>
              Email and passphrase only. An account stores bookmarks and a private reading history. It is optional.
            </Text>
            <ViewRow mode={mode} setMode={setMode} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor={colors.muted}
              style={inputStyle}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Passphrase"
              placeholderTextColor={colors.muted}
              style={inputStyle}
            />
            <Action
              label={busy ? "Working" : mode === "login" ? "Sign in" : "Create account"}
              disabled={busy || email.trim().length < 3 || password.length < 6}
              onPress={() => void submit()}
            />
          </>
        )}
        {message ? <Status>{message}</Status> : null}
      </Frame>
    </Screen>
  );
}

function ViewRow({ mode, setMode }: { mode: "login" | "register"; setMode: (mode: "login" | "register") => void }) {
  return (
    <>
      <Action label="Login" tone={mode === "login" ? "phosphor" : "cyan"} onPress={() => setMode("login")} />
      <Action label="Register" tone={mode === "register" ? "phosphor" : "cyan"} onPress={() => setMode("register")} />
    </>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: colors.line,
  color: colors.phosphor,
  fontFamily: fonts.body,
  padding: 12,
  borderRadius: 4,
};

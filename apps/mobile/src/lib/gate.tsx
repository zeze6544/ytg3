import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const KEY = "narcodex.gate.v1";

type GateValue = {
  accepted: boolean;
  loading: boolean;
  accept: () => Promise<void>;
};

const GateContext = createContext<GateValue>({
  accepted: false,
  loading: true,
  accept: async () => {},
});

export function GateProvider({ children }: { children: ReactNode }) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((value) => setAccepted(value === "yes"))
      .finally(() => setLoading(false));
  }, []);

  const accept = useCallback(async () => {
    await AsyncStorage.setItem(KEY, "yes");
    setAccepted(true);
  }, []);

  return <GateContext.Provider value={{ accepted, loading, accept }}>{children}</GateContext.Provider>;
}

export function useGate() {
  return useContext(GateContext);
}

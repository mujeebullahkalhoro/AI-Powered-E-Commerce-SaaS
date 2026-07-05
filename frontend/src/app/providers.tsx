"use client";

import { useEffect, useState } from "react";
import * as authApi from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";

export function Providers({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const refreshAuth = useAuthStore((state) => state.refreshAuth);

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hydrated || !accessToken) {
      return;
    }

    authApi
      .getMe()
      .then((data) => setUser(data.user))
      .catch(() => {
        refreshAuth().catch(() => undefined);
      });
  }, [hydrated, accessToken, setUser, refreshAuth]);

  return <>{children}</>;
}

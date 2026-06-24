"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "@/lib/firebase/client";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (process.env.NODE_ENV === "development") {
        if (nextUser) {
          console.info("[Firebase Auth] Użytkownik jest zalogowany", {
            uid: nextUser.uid,
            emailVerified: nextUser.emailVerified,
            providers: nextUser.providerData.map(
              ({ providerId }) => providerId,
            ),
          });
        } else {
          console.info("[Firebase Auth] Brak zalogowanego użytkownika");
        }
      }

      setUser(nextUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth musi być użyte wewnątrz AuthProvider.");
  }

  return context;
}

// src/hooks/useAuthUser.js
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

export default function useAuthUser() {
  const { user, isAuthenticated, isLoading } = useKindeAuth();

  return {
    user,
    userId: user?.id,
    isAuthenticated,
    isLoading,
  };
}

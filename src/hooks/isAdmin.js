import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
export default function useAdmin() {
  const { user, isLoading } = useUser();
  const [adminState, setAdminState] = useState(null);

  useEffect(() => {
    if (user && !isLoading) {
      const roles = user["https://www.boardzy.app/roles"];
      if (roles && Array.isArray(roles) && roles.includes("admin")) {
        setAdminState((prev) => {
          return true;
        });
      } else {
        setAdminState((prev) => {
          return false;
        });
      }
    } else if (user === undefined && !isLoading) {
      setAdminState((prev) => {
        return false;
      });
    }
  }, [user, isLoading]);
  return adminState;
}

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
export default function useAdmin() {
    const { user } = useUser();
    const [adminState, setAdminState] = useState(false);

    useEffect(()=>{
        if (user) {
            console.log(user);
            if (user["https://www.boardzy.app/roles"].includes("admin")) {
              setAdminState((prev)=>{return true})
            }
        
          }
    },[user])
  return adminState;
}

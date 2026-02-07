"use client";
import { useQuery } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export default function Dashboard({ session }: { session: typeof authClient.$Infer.Session }) {
  // TODO: privateData procedure was removed in Phase 22 (router integration)
  // This was a development-only test procedure that is no longer needed
  // const privateData = useQuery(trpc.privateData.queryOptions());

  return (
    <>
        {/* <p>API: {privateData.data?.message}</p> */}
        <p>Dashboard: User {session.user?.name}</p>
      </>
  );
}

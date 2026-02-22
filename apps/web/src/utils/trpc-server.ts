import type { Context } from "@arcade-vibe/api/context";

import { appRouter } from "@arcade-vibe/api/routers/index";
import { headers } from "next/headers";

export async function getServerCaller() {
  const reqHeaders = await headers();
  
  const context: Context = {
    session: null,
    req: {
      headers: {
        get: (name: string) => reqHeaders.get(name),
      },
    } as unknown as Context["req"],
    user: undefined,
  };

  return appRouter.createCaller(context);
}

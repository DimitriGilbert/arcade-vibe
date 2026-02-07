"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// TODO: todoRouter was removed in Phase 22 (router integration)
// This was a development-only example router that is no longer needed

export default function TodosPage() {
  return (
    <div className="mx-auto w-full max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Development Page Removed</CardTitle>
          <CardDescription>This todo page uses the deprecated todo router</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-muted-foreground">
            The todo router was removed during Phase 22 (Router Integration).
            This was a development-only example that is no longer needed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

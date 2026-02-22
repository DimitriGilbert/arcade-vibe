"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Chrome, Github } from "lucide-react";

import { authClient } from "@/lib/auth-client";

import { Button } from "./ui/button";

export function SocialAuthButtons() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social(
      { provider: "google" },
      {
        onSuccess: () => {
          router.push("/settings");
          toast.success("Sign in successful");
        },
        onError: (error) => {
          toast.error(error.error.message ?? "Failed to sign in with Google");
        },
      },
    );
  };

  const handleGitHubSignIn = async () => {
    await authClient.signIn.social(
      { provider: "github" },
      {
        onSuccess: () => {
          router.push("/settings");
          toast.success("Sign in successful");
        },
        onError: (error) => {
          toast.error(error.error.message ?? "Failed to sign in with GitHub");
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="outline" onClick={handleGoogleSignIn} className="w-full">
        <Chrome className="mr-2 h-4 w-4" />
        Continue with Google
      </Button>
      <Button type="button" variant="outline" onClick={handleGitHubSignIn} className="w-full">
        <Github className="mr-2 h-4 w-4" />
        Continue with GitHub
      </Button>
    </div>
  );
}

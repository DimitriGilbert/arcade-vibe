"use client";

import { useState } from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard } from "@/components/arcade";
import {
  Loader2,
  User,
  Shield,
  Calendar,
  CheckCircle,
  AlertCircle,
  Mail,
  Clock,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import LoadingPlaceholder from "@/components/reusable/loading-placeholder";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

export default function ProfileSettingsPage() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const user = session?.user;

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (input: { name: string }) => {
      return await trpcClient.user.updateProfile.mutate(input);
    },
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      // Invalidate session to reflect changes
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const { Form } = useFormedible({
    schema: profileSchema,
    fields: [
      {
        name: "name",
        type: "text",
        label: "Username",
        description: "Your public display name",
        placeholder: "Enter your username",
      },
      {
        name: "email",
        type: "email",
        label: "Email",
        description: "Your email address for notifications",
        placeholder: "you@example.com",
        disabled: true, // Email cannot be changed
      },
    ],
    formOptions: {
      defaultValues: {
        name: user?.name || "",
        email: user?.email || "",
      },
      onSubmit: async ({ value }) => {
        updateProfileMutation.mutate({ name: value.name });
      },
    },
  });

  if (sessionPending) {
    return <LoadingPlaceholder />;
  }

  // Calculate account age
  const accountAge = user?.createdAt
    ? Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-[var(--primary)]/20 rounded-lg">
            <User className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            <p className="text-[var(--muted-foreground)] text-sm">
              Update your public profile information
            </p>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form - Takes 2 columns */}
        <ArcadeCard className="lg:col-span-2">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)]">
              Public Information
            </h3>
          </div>
          <div className="p-4">
            <Form className="space-y-4" />

            {updateProfileMutation.isPending && (
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mt-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving changes...</span>
              </div>
            )}
          </div>
        </ArcadeCard>

        {/* Right Column - Info Cards */}
        <div className="space-y-6">
          {/* Account Status Card */}
          <ArcadeCard>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[var(--accent)]/20 rounded-lg">
                  <Shield className="h-4 w-4 text-[var(--accent)]" />
                </div>
                <span className="font-medium">Account Status</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--accent)]/15 text-[var(--accent)]">
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Active
                </span>
              </div>
            </div>
          </ArcadeCard>

          {/* Email Verification Card */}
          <ArcadeCard>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[var(--primary)]/20 rounded-lg">
                  <Mail className="h-4 w-4 text-[var(--primary)]" />
                </div>
                <span className="font-medium">Email Verified</span>
              </div>
              <div className="flex items-center gap-2">
                {user?.emailVerified ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-[var(--accent)]" />
                    <span className="text-[var(--accent)] font-medium text-sm">
                      Verified
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-[var(--muted-foreground)]" />
                    <span className="text-[var(--muted-foreground)] font-medium text-sm">
                      Not Verified
                    </span>
                  </>
                )}
              </div>
            </div>
          </ArcadeCard>

          {/* Account Age Card */}
          <ArcadeCard>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[var(--secondary)]/20 rounded-lg">
                  <Clock className="h-4 w-4 text-[var(--secondary)]" />
                </div>
                <span className="font-medium">Account Age</span>
              </div>
              <p className="text-3xl font-bold text-[var(--secondary)]">
                {accountAge}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Days since joining
              </p>
            </div>
          </ArcadeCard>
        </div>
      </div>

      {/* Bottom Row - Full Width Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Information */}
        <ArcadeCard>
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)]">
              Account Information
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {/* User ID */}
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-[var(--muted-foreground)] mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--muted-foreground)]">
                    User ID
                  </p>
                  <p className="font-mono text-sm mt-1 bg-[var(--muted)] px-2 py-1 rounded">
                    {user?.id}
                  </p>
                </div>
              </div>

              {/* Account Creation Date */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-[var(--muted-foreground)] mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--muted-foreground)]">
                    Account Created
                  </p>
                  <p className="text-sm mt-1">
                    {user?.createdAt ? (
                      <span>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-[var(--muted-foreground)]">
                        Unknown
                      </span>
                    )}
                  </p>
                  {user?.createdAt && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      {new Date(user.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ArcadeCard>

        {/* Email Change Notice */}
        <ArcadeCard>
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              To change your email address, please contact support. Email
              changes require verification to ensure account security.
            </p>
            <div className="p-3 bg-[var(--muted)]/40 rounded-lg">
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
          </div>
        </ArcadeCard>
      </div>

      {/* Profile Completion - Full Width */}
      <ArcadeCard>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--accent)]/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="font-medium">Profile Completion</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  All required fields completed
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[var(--accent)]">100%</p>
            </div>
          </div>
        </div>
      </ArcadeCard>
    </div>
  );
}

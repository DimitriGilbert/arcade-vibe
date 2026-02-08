"use client";

import { useState } from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { trpc, trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, Shield, Calendar, CheckCircle, AlertCircle } from "lucide-react";
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
            <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">
              Update your public profile information
            </p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Public Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form className="space-y-4" />

          {updateProfileMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving changes...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Change Notice */}
      <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
        <CardContent className="p-6">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
            Email Address
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            To change your email address, please contact support. Email changes require
            verification to ensure account security.
          </p>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* User ID Section */}
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                <p className="font-mono text-sm mt-1 bg-muted px-2 py-1 rounded">{user?.id}</p>
              </div>
            </div>

            {/* Email Verification Status */}
            <div className="flex items-start gap-3">
              {user?.emailVerified ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Email Verified</p>
                <p className="text-sm mt-1">
                  {user?.emailVerified ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">Verified</span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">Not Verified</span>
                  )}
                </p>
              </div>
            </div>

            {/* Account Creation Date */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                <p className="text-sm mt-1">
                  {user?.createdAt ? (
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                  ) : (
                    <span className="text-muted-foreground">Unknown</span>
                  )}
                </p>
                {user?.createdAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(user.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Account Status */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Account Status</p>
                <p className="text-sm mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Active
                  </span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Statistics */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Profile Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Profile Completion</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">100%</p>
              <p className="text-xs text-muted-foreground mt-1">All required fields completed</p>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Account Age</p>
              <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {user?.createdAt
                  ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                  : 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Days since joining</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

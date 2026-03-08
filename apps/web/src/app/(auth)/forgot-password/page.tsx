"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import z from "zod";

import { useFormedible } from "@/hooks/use-formedible";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard } from "@/components/arcade/arcade-card";
import { ArcadeButton } from "@/components/arcade/arcade-button";
import type { FieldConfig } from "@/lib/formedible/types";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const fields: FieldConfig[] = [
  {
    name: "email",
    type: "email",
    label: "Email Address",
    placeholder: "Enter your email address",
    validation: z.string().email("Please enter a valid email address"),
  },
];

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const onSubmit = useCallback(async ({ value }: { value: ForgotPasswordValues }) => {
    try {
      await trpcClient.user.forgotPassword.mutate({
        email: value.email,
      });
      setIsSuccess(true);
    } catch {
      // Security: Don't reveal specific errors to prevent email enumeration
      // Still show success message even on error
      setIsSuccess(true);
    }
  }, []);

  const { Form } = useFormedible<ForgotPasswordValues>({
    schema: forgotPasswordSchema,
    fields,
    formOptions: {
      defaultValues: {
        email: "",
      },
      onSubmit,
    },
    submitLabel: "Send Reset Link",
  });

  if (isSuccess) {
    return (
      <div className="mx-auto mt-10 w-full max-w-md p-6">
        <ArcadeCard className="p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold">Check Your Email</h1>
          <p className="mb-6 text-[var(--muted-foreground)]">
            If an account exists with that email address, you will receive a password reset link shortly.
          </p>
          <Link href="/login">
            <ArcadeButton variant="primary" type="button">
              Back to Sign In
            </ArcadeButton>
          </Link>
        </ArcadeCard>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <ArcadeCard className="p-6">
        <h1 className="mb-2 text-center text-3xl font-bold">Forgot Password</h1>
        <p className="mb-6 text-center text-[var(--muted-foreground)]">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <Form className="space-y-4" />
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-[var(--primary)] hover:brightness-110"
          >
            Remember your password? Sign In
          </Link>
        </div>
      </ArcadeCard>
    </div>
  );
}

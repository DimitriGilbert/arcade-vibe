"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { useFormedible } from "@/hooks/use-formedible";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard, ArcadeButton } from "@/components/arcade";
import Loader from "@/components/loader";

const passwordSchema = z
	.string()
	.min(12, "Password must be at least 12 characters")
	.max(128, "Password must be at most 128 characters");

type FormValues = {
	newPassword: string;
	confirmPassword: string;
};

export default function ResetPasswordPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [isValidating, setIsValidating] = useState(true);
	const [isTokenValid, setIsTokenValid] = useState(false);

	// Validate token on mount
	useEffect(() => {
		if (!token) {
			setIsValidating(false);
			return;
		}

		const validateToken = async () => {
			try {
				const result = await trpcClient.user.validateResetToken.query({ token });
				setIsTokenValid(result.valid);
			} catch (error) {
				console.error("Token validation failed:", error);
				setIsTokenValid(false);
			} finally {
				setIsValidating(false);
			}
		};

		validateToken();
	}, [token]);

	const { Form } = useFormedible<FormValues>({
		fields: [
			{
				name: "newPassword",
				type: "password",
				label: "New Password",
				placeholder: "Enter your new password",
				validation: passwordSchema,
			},
			{
				name: "confirmPassword",
				type: "password",
				label: "Confirm Password",
				placeholder: "Confirm your new password",
				validation: z.string().min(1, "Please confirm your password"),
			},
		],
		formOptions: {
			onSubmit: async ({ value }) => {
				// Validate passwords match
				if (value.newPassword !== value.confirmPassword) {
					toast.error("Passwords do not match");
					return;
				}

				if (!token) {
					toast.error("Invalid reset token");
					return;
				}

				try {
					const result = await trpcClient.user.resetPassword.mutate({
						token,
						newPassword: value.newPassword,
					});

					if (result.success) {
						toast.success(result.message);
						router.push("/login?reset=success");
					}
				} catch (error) {
					console.error("Password reset failed:", error);
					toast.error(
						error instanceof Error
							? error.message
							: "Failed to reset password. Please try again.",
					);
				}
			},
		},
		submitLabel: "Reset Password",
		loading: isValidating,
	});

	// Show loading state while validating token
	if (isValidating) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Loader />
			</div>
		);
	}

	// Show error if no token or invalid token
	if (!token || !isTokenValid) {
		return (
			<div className="mx-auto mt-10 w-full max-w-md p-6">
				<ArcadeCard className="p-6 text-center">
					<div className="space-y-4">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--destructive)]/10">
							<svg
								className="h-6 w-6 text-[var(--destructive)]"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								role="img"
							>
								<title>Warning</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
						</div>
						<h2 className="text-xl font-semibold text-[var(--foreground)]">
							Invalid or Expired Link
						</h2>
						<p className="text-sm text-[var(--muted-foreground)]">
							This password reset link is invalid or has expired. Please try requesting a
							new one from the login page.
						</p>
						<ArcadeButton
							variant="primary"
							onClick={() => router.push("/login")}
							className="mt-4"
						>
							Go to Login
						</ArcadeButton>
					</div>
				</ArcadeCard>
			</div>
		);
	}

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<ArcadeCard className="p-6">
				<div className="mb-6 text-center">
					<h1 className="text-2xl font-bold text-[var(--foreground)]">Reset Password</h1>
					<p className="mt-2 text-sm text-[var(--muted-foreground)]">
						Enter your new password below
					</p>
				</div>

				{/* Password requirements */}
				<div className="mb-6 rounded-lg bg-[var(--muted)]/20 p-4">
					<h3 className="mb-2 text-sm font-medium text-[var(--foreground)]">
						Password Requirements
					</h3>
					<ul className="space-y-1 text-xs text-[var(--muted-foreground)]">
						<li className="flex items-center gap-2">
							<span className="text-[var(--primary)]">•</span>
							Minimum 12 characters
						</li>
					</ul>
				</div>

				<Form className="space-y-4" />
			</ArcadeCard>
		</div>
	);
}

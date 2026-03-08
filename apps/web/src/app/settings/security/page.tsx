"use client";

import { useMutation } from "@tanstack/react-query";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard } from "@/components/arcade";
import { Loader2, Shield, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import LoadingPlaceholder from "@/components/reusable/loading-placeholder";

const passwordSchema = z
	.string()
	.min(12, "Password must be at least 12 characters")
	.max(128, "Password must be at most 128 characters");

const changePasswordFormSchema = z.object({
	currentPassword: z.string().min(1, "Current password is required"),
	newPassword: passwordSchema,
	confirmPassword: z.string().min(1, "Please confirm your new password"),
});

type FormValues = z.infer<typeof changePasswordFormSchema>;

export default function SecuritySettingsPage() {
	const { data: session, isPending: sessionPending } = authClient.useSession();

	const changePasswordMutation = useMutation({
		mutationFn: async (input: { currentPassword: string; newPassword: string }) => {
			return await trpcClient.user.changePassword.mutate(input);
		},
		onSuccess: (data) => {
			toast.success(data.message || "Password changed successfully!");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to change password");
		},
	});

	const { Form } = useFormedible<FormValues>({
		schema: changePasswordFormSchema,
		fields: [
			{
				name: "currentPassword",
				type: "password",
				label: "Current Password",
				description: "Enter your current password to verify your identity",
				placeholder: "Enter current password",
				validation: z.string().min(1, "Current password is required"),
			},
			{
				name: "newPassword",
				type: "password",
				label: "New Password",
				description: "Your new password must be at least 12 characters",
				placeholder: "Enter new password",
				validation: passwordSchema,
			},
			{
				name: "confirmPassword",
				type: "password",
				label: "Confirm New Password",
				description: "Re-enter your new password to confirm",
				placeholder: "Confirm new password",
				validation: z.string().min(1, "Please confirm your new password"),
			},
		],
		formOptions: {
			defaultValues: {
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			},
			onSubmit: async ({ value }) => {
				// Validate passwords match
				if (value.newPassword !== value.confirmPassword) {
					toast.error("New passwords do not match");
					return;
				}

				// Validate new password is different from current
				if (value.currentPassword === value.newPassword) {
					toast.error("New password must be different from your current password");
					return;
				}

				changePasswordMutation.mutate({
					currentPassword: value.currentPassword,
					newPassword: value.newPassword,
				});
			},
		},
		submitLabel: "Change Password",
	});

	if (sessionPending) {
		return <LoadingPlaceholder />;
	}

	const hasCredentialAccount = session?.user !== undefined;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<div className="flex items-center gap-3 mb-2">
					<div className="p-2.5 bg-[var(--primary)]/20 rounded-lg">
						<Shield className="h-5 w-5 text-[var(--primary)]" />
					</div>
					<div>
						<h1 className="text-2xl font-bold">Security Settings</h1>
						<p className="text-[var(--muted-foreground)] text-sm">
							Manage your account security and password
						</p>
					</div>
				</div>
			</div>

			{/* Bento Grid Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Password Change Form - Takes 2 columns */}
				<ArcadeCard className="lg:col-span-2">
					<div className="p-4 border-b border-[var(--border)]">
						<div className="flex items-center gap-2">
							<Lock className="h-4 w-4 text-[var(--primary)]" />
							<h3 className="font-semibold text-[var(--foreground)]">
								Change Password
							</h3>
						</div>
					</div>
					<div className="p-4">
						{hasCredentialAccount ? (
							<>
								<Form className="space-y-4" />

								{changePasswordMutation.isPending && (
									<div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mt-4">
										<Loader2 className="h-4 w-4 animate-spin" />
										<span>Changing password...</span>
									</div>
								)}
							</>
						) : (
							<div className="py-8 text-center">
								<AlertCircle className="h-12 w-12 mx-auto text-[var(--muted-foreground)] mb-4 opacity-50" />
								<h3 className="text-lg font-semibold mb-2">
									Password Change Unavailable
								</h3>
								<p className="text-sm text-[var(--muted-foreground)]">
									Your account uses social authentication. Password changes are only
									available for accounts with email/password login.
								</p>
							</div>
						)}
					</div>
				</ArcadeCard>

				{/* Right Column - Info Cards */}
				<div className="space-y-6">
					{/* Password Requirements Card */}
					<ArcadeCard>
						<div className="p-4 border-b border-[var(--border)]">
							<h3 className="font-semibold text-[var(--foreground)]">
								Password Requirements
							</h3>
						</div>
						<div className="p-4">
							<ul className="space-y-3 text-sm">
								<li className="flex items-center gap-3">
									<CheckCircle className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />
									<span>Minimum 12 characters</span>
								</li>
								<li className="flex items-center gap-3">
									<CheckCircle className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />
									<span>Maximum 128 characters</span>
								</li>
								<li className="flex items-center gap-3">
									<CheckCircle className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />
									<span>Must be different from current password</span>
								</li>
							</ul>
						</div>
					</ArcadeCard>

					{/* Session Info Card */}
					<ArcadeCard>
						<div className="p-4 border-b border-[var(--border)]">
							<h3 className="font-semibold text-[var(--foreground)]">
								Session Security
							</h3>
						</div>
						<div className="p-4">
							<p className="text-sm text-[var(--muted-foreground)]">
								When you change your password, all other active sessions will be
								automatically signed out for security purposes. You will remain
								signed in on this device.
							</p>
						</div>
					</ArcadeCard>
				</div>
			</div>

			{/* Security Tips - Full Width */}
			<ArcadeCard>
				<div className="p-4 border-b border-[var(--border)]">
					<h3 className="font-semibold text-[var(--foreground)]">Security Tips</h3>
				</div>
				<div className="p-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="p-4 rounded-lg bg-[var(--muted)]/40">
							<h4 className="font-medium mb-2">Use a Strong Password</h4>
							<p className="text-sm text-[var(--muted-foreground)]">
								Combine uppercase, lowercase, numbers, and special characters for
								maximum security.
							</p>
						</div>
						<div className="p-4 rounded-lg bg-[var(--muted)]/40">
							<h4 className="font-medium mb-2">Enable Two-Factor Authentication</h4>
							<p className="text-sm text-[var(--muted-foreground)]">
								Add an extra layer of security to your account (coming soon).
							</p>
						</div>
						<div className="p-4 rounded-lg bg-[var(--muted)]/40">
							<h4 className="font-medium mb-2">Keep Your Credentials Safe</h4>
							<p className="text-sm text-[var(--muted-foreground)]">
								Never share your password. Use a password manager to store your
								credentials securely.
							</p>
						</div>
					</div>
				</div>
			</ArcadeCard>
		</div>
	);
}

import type { Metadata } from "next";
import { ArcadeCard } from "@/components/arcade";

export const metadata: Metadata = {
	title: "Privacy Policy",
	description: "Privacy policy for Arcade Vibe",
};

export default function PrivacyPage() {
	return (
		<div className="min-h-screen bg-background">
			<div className="border-b border-[var(--border)] bg-background/80 backdrop-blur-sm sticky top-0 z-40">
				<div className="container mx-auto px-4 py-8">
					<h1 className="text-4xl font-bold text-[var(--foreground)]">
						Privacy Policy
					</h1>
					<p className="text-[var(--muted-foreground)] mt-2">
						Last updated: February 2026
					</p>
				</div>
			</div>

			<main className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Information We Collect</h2>
						<p className="text-[var(--muted-foreground)]">
							We collect your email address when you create an account. Your
							email address is used solely for app-related communications (such
							as account notifications, password resets, and important updates)
							and will never be shared with third parties.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Private Prompts</h2>
						<p className="text-[var(--muted-foreground)]">
							When you create a private prompt, it remains private and visible
							only to you. Private prompts will not be used for research
							purposes. However, private prompts may be used internally for
							benchmark runs to improve our services.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Public Prompts</h2>
						<p className="text-[var(--muted-foreground)]">
							When you publish a prompt publicly, you acknowledge that it
							becomes publicly accessible. Public prompts may be used for any
							purpose including research, analysis, and display on our
							platform.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Public Games</h2>
						<p className="text-[var(--muted-foreground)]">
							Public games and their associated code are shared under the MIT
							License by default. This means the code can be freely used,
							modified, and distributed by others, subject to the terms of the
							MIT License.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Data Security</h2>
						<p className="text-[var(--muted-foreground)]">
							We implement appropriate security measures to protect your
							information. However, no method of transmission over the
							internet is 100% secure, and we cannot guarantee absolute
							security.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Your Rights</h2>
						<p className="text-[var(--muted-foreground)]">
							You can access, modify, or delete your account and associated
							data at any time through your account settings. If you have
							questions about your data, please contact us.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Changes to This Policy</h2>
						<p className="text-[var(--muted-foreground)]">
							We may update this privacy policy from time to time. We will
							notify you of any significant changes by posting the new policy
							on this page and updating the "Last updated" date.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Contact Us</h2>
						<p className="text-[var(--muted-foreground)]">
							If you have questions about this privacy policy or our data
							practices, please contact us through the app or our support
							channels.
						</p>
					</div>
				</ArcadeCard>
			</main>
		</div>
	);
}

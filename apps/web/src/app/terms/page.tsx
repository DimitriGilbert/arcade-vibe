import type { Metadata } from "next";
import { ArcadeCard } from "@/components/arcade";

export const metadata: Metadata = {
	title: "Terms of Service",
	description: "Terms of service for Arcade Vibe",
};

export default function TermsPage() {
	return (
		<div className="min-h-screen bg-background">
			<div className="border-b border-[var(--border)] bg-background/80 backdrop-blur-sm sticky top-0 z-40">
				<div className="container mx-auto px-4 py-8">
					<h1 className="text-4xl font-bold text-[var(--foreground)]">
						Terms of Service
					</h1>
					<p className="text-[var(--muted-foreground)] mt-2">
						Last updated: February 2026
					</p>
				</div>
			</div>

			<main className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Acceptance of Terms</h2>
						<p className="text-[var(--muted-foreground)]">
							By accessing and using Arcade Vibe, you accept and agree to be
							bound by these Terms of Service. If you do not agree to these
							terms, please do not use our service.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">User Accounts</h2>
						<p className="text-[var(--muted-foreground)]">
							You are responsible for maintaining the security of your account.
							You must provide accurate information during registration and keep
							your account details up to date. You are responsible for all
							activities that occur under your account.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">User Content</h2>
						<p className="text-[var(--muted-foreground)]">
							You retain ownership of the content you create. By publishing
							content publicly on Arcade Vibe, you grant us a license to
							display, distribute, and use that content on our platform. Public
							games and their code are shared under the MIT License by default.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Acceptable Use</h2>
						<p className="text-[var(--muted-foreground)]">
							You agree not to use Arcade Vibe for any illegal or unauthorized
							purpose. You must not violate any laws in your jurisdiction,
							including copyright and intellectual property laws. Prohibited
							activities include attempting to gain unauthorized access to our
							systems, interfering with service operations, or harassing other
							users.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Credits and Payments</h2>
						<p className="text-[var(--muted-foreground)]">
							Credits are used to generate games on our platform. All credit
							purchases are final and non-refundable. Credits have expiration
							dates as described on our pricing page. We reserve the right to
							modify credit pricing and availability at any time.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Intellectual Property</h2>
						<p className="text-[var(--muted-foreground)]">
							Arcade Vibe and its original content, features, and functionality
							are owned by us and are protected by copyright, trademark, and
							other laws. Public games generated on our platform are licensed
							under the MIT License unless otherwise specified.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Disclaimer of Warranties</h2>
						<p className="text-[var(--muted-foreground)]">
							Arcade Vibe is provided "as is" without warranties of any kind,
							whether express or implied. We do not guarantee that the service
							will be uninterrupted, secure, or error-free. Generated games are
							provided without any warranty regarding their functionality or
							fitness for a particular purpose.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Limitation of Liability</h2>
						<p className="text-[var(--muted-foreground)]">
							To the maximum extent permitted by law, Arcade Vibe shall not be
							liable for any indirect, incidental, special, consequential, or
							punitive damages resulting from your use of or inability to use
							the service.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Termination</h2>
						<p className="text-[var(--muted-foreground)]">
							We reserve the right to terminate or suspend your account at any
							time for any reason, including violation of these Terms. Upon
							termination, your right to use the service will immediately
							cease. Provisions that by their nature should survive termination
							will remain in effect.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Changes to Terms</h2>
						<p className="text-[var(--muted-foreground)]">
							We may modify these Terms at any time. We will notify users of
							significant changes by posting the updated Terms on this page.
							Your continued use of Arcade Vibe after changes constitutes
							acceptance of the new Terms.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Governing Law</h2>
						<p className="text-[var(--muted-foreground)]">
							These Terms shall be governed by and construed in accordance with
							applicable laws, without regard to conflict of law principles.
						</p>
					</div>
				</ArcadeCard>

				<ArcadeCard>
					<div className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">Contact Us</h2>
						<p className="text-[var(--muted-foreground)]">
							If you have questions about these Terms, please contact us
							through the app or our support channels.
						</p>
					</div>
				</ArcadeCard>
			</main>
		</div>
	);
}

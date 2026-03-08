/**
 * GDPR Data Export Helper
 *
 * Gathers all user-related data from all tables for GDPR compliance.
 * Excludes sensitive data (passwords, tokens) and masks API keys.
 */

import { db } from "@arcade-vibe/db";
import { user, session, account } from "@arcade-vibe/db/schema/auth";
import { userExtended } from "@arcade-vibe/db/schema/users";
import { userPreferences } from "@arcade-vibe/db/schema/user-preferences";
import {
	creditTransactions,
	creditBatches,
	userSubscriptions,
	userInvoices,
} from "@arcade-vibe/db/schema/credits";
import { apiKeys } from "@arcade-vibe/db/schema/models";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import {
	games,
	gameScores,
	gameSessionMetrics,
} from "@arcade-vibe/db/schema/games";
import { ratings } from "@arcade-vibe/db/schema/ratings";
import { scores } from "@arcade-vibe/db/schema/scores";
import { feedback } from "@arcade-vibe/db/schema/feedback";
import { emailLogs } from "@arcade-vibe/db/schema/email";
import { collections } from "@arcade-vibe/db/schema/collections";
import {
	moderationReports,
	moderationAppeals,
} from "@arcade-vibe/db/schema/moderation";
import { eq, inArray } from "drizzle-orm";
import JSZip from "jszip";
import {
	generatePortableGameHtml,
	generatePortableFilename,
	type PortableGameData,
} from "./game-export";
import { env } from "@arcade-vibe/env/server";

const GDPR_EXPORT_VERSION = "1.0";

/**
 * Masks an API key hash, showing only that it exists
 */
function maskApiKey(): string {
	return `***masked***`;
}

/**
 * Masks a session token
 */
function maskToken(token: string): string {
	if (token.length <= 8) {
		return "***";
	}
	return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export interface GdprExportData {
	exportDate: string;
	userId: string;
	version: string;
	data: {
		profile: {
			id: string;
			name: string;
			email: string;
			emailVerified: boolean;
			image: string | null;
			createdAt: Date;
			updatedAt: Date;
		} | null;
		userExtended: {
			id: string;
			role: string;
			reputation: number;
			credits: number;
			isSuspended: boolean;
			suspensionReason: string | null;
			suspendedUntil: Date | null;
		} | null;
		preferences: Array<{
			id: string;
			name: string;
			value: string;
		}>;
		sessions: Array<{
			id: string;
			token: string; // masked
			expiresAt: Date;
			createdAt: Date;
			ipAddress: string | null;
			userAgent: string | null;
		}>;
		accounts: Array<{
			id: string;
			accountId: string;
			providerId: string;
			scope: string | null;
			createdAt: Date;
			// accessToken, refreshToken, idToken, password excluded
		}>;
		creditTransactions: Array<{
			id: string;
			amount: number;
			type: string;
			description: string | null;
			batchId: string | null;
			expiresAt: Date | null;
			createdAt: Date;
		}>;
		creditBatches: Array<{
			id: string;
			amount: number;
			remainingAmount: number;
			sourceType: string;
			sourceId: string | null;
			expiresAt: Date;
			createdAt: Date;
		}>;
		subscriptions: Array<{
			id: string;
			planId: string;
			stripeSubscriptionId: string | null;
			status: string;
			currentPeriodStart: Date;
			currentPeriodEnd: Date;
			cancelAtPeriodEnd: boolean;
			createdAt: Date;
			updatedAt: Date;
		}>;
		invoices: Array<{
			id: string;
			subscriptionId: string | null;
			stripeInvoiceId: string;
			stripeSubscriptionId: string | null;
			amount: number;
			currency: string;
			status: string;
			invoicePdf: string | null;
			invoiceUrl: string | null;
			hostedInvoiceUrl: string | null;
			paidAt: Date | null;
			createdAt: Date;
		}>;
		apiKeys: Array<{
			id: string;
			provider: string;
			name: string;
			isActive: boolean;
			createdAt: Date;
			lastUsedAt: Date | null;
			keyHash: string; // masked
		}>;
		prompts: Array<{
			id: string;
			themeId: string;
			parentId: string | null;
			title: string | null;
			content: string;
			contentHash: string;
			tokenCount: number;
			tokenizer: string;
			version: number;
			visibility: string;
			status: string;
			relationType: string;
			hiddenAt: Date | null;
			hiddenReason: string | null;
			createdAt: Date;
			updatedAt: Date;
		}>;
		games: Array<{
			id: string;
			name: string | null;
			promptId: string;
			themeId: string | null;
			status: string;
			modelProvider: string;
			modelName: string;
			tokenUsage: number | null;
			isHidden: boolean;
			hiddenReason: string | null;
			isSubmitted: boolean;
			createdAt: Date;
			updatedAt: Date;
		}>;
		gameScores: Array<{
			id: string;
			gameId: string;
			sessionId: string;
			score: number;
			isHighScore: boolean;
			completionTime: number | null;
			playedAt: Date;
		}>;
		gameSessionMetrics: Array<{
			id: string;
			sessionId: string;
			gameId: string;
			startedAt: Date;
			endedAt: Date | null;
			playtimeSeconds: number;
			hasScoreEvent: boolean;
			createdAt: Date;
		}>;
		ratings: Array<{
			id: string;
			promptId: string;
			gameId: string;
			themeId: string | null;
			promptQuality: number | null;
			gameQuality: number | null;
			themeRelevance: number | null;
			overall: number;
			feedback: string | null;
			createdAt: Date;
		}>;
		scores: Array<{
			id: string;
			promptId: string;
			gameId: string;
			themeId: string | null;
			score: number;
			isHighScore: boolean;
			completionTime: number | null;
			playedAt: Date;
			qualityScore: string | null;
			engagementScore: string | null;
			playersScore: string | null;
			playsScore: string | null;
			replayScore: string | null;
			efficiencyScore: string | null;
			tierFactor: string | null;
			inputTokens: number | null;
			finalScore: string;
			calculatedAt: Date;
			version: number;
		}>;
		feedback: Array<{
			id: string;
			subject: string;
			answer: Record<string, unknown>;
			comment: string | null;
			createdAt: Date;
		}>;
		emailLogs: Array<{
			id: string;
			resendId: string | null;
			emailType: string;
			status: string;
			subject: string;
			fromEmail: string;
			toEmail: string;
			templateId: string | null;
			errorMessage: string | null;
			sentAt: Date | null;
			deliveredAt: Date | null;
			openedAt: Date | null;
			clickedAt: Date | null;
			createdAt: Date;
		}>;
		collections: Array<{
			id: string;
			name: string;
			description: string | null;
			isPublic: boolean;
			createdAt: Date;
			updatedAt: Date;
		}>;
		moderationReportsAsReporter: Array<{
			id: string;
			targetType: string;
			targetId: string | null;
			targetUserId: string | null;
			reason: string;
			description: string | null;
			status: string;
			reviewedBy: string | null;
			reviewedAt: Date | null;
			resolutionNotes: string | null;
			createdAt: Date;
		}>;
		moderationReportsAsTarget: Array<{
			id: string;
			reporterId: string;
			targetType: string;
			targetId: string | null;
			reason: string;
			description: string | null;
			status: string;
			reviewedBy: string | null;
			reviewedAt: Date | null;
			resolutionNotes: string | null;
			createdAt: Date;
		}>;
		moderationAppeals: Array<{
			id: string;
			reportId: string;
			reason: string;
			evidence: string | null;
			status: string;
			reviewedBy: string | null;
			reviewedAt: Date | null;
			decisionNotes: string | null;
			createdAt: Date;
		}>;
	};
}

/**
 * Gathers all user data for GDPR export
 */
export async function gatherUserData(userId: string): Promise<GdprExportData> {
	// Fetch all data in parallel for efficiency
	const [
		userProfile,
		extendedUser,
		userPrefs,
		userSessions,
		userAccounts,
		transactions,
		batches,
		subscriptions,
		invoices,
		keys,
		userPrompts,
		userRatings,
		userScores,
		userFeedback,
		userEmailLogs,
		userCollections,
		reportsAsReporter,
		reportsAsTarget,
		appeals,
	] = await Promise.all([
		// Profile data
		db.query.user.findFirst({
			where: eq(user.id, userId),
		}),

		// Extended user data
		db.query.userExtended.findFirst({
			where: eq(userExtended.id, userId),
		}),

		// Preferences
		db.query.userPreferences.findMany({
			where: eq(userPreferences.userId, userId),
		}),

		// Sessions (mask tokens)
		db.query.session.findMany({
			where: eq(session.userId, userId),
		}),

		// Accounts (exclude sensitive fields)
		db.query.account.findMany({
			where: eq(account.userId, userId),
		}),

		// Credit transactions
		db.query.creditTransactions.findMany({
			where: eq(creditTransactions.userId, userId),
		}),

		// Credit batches
		db.query.creditBatches.findMany({
			where: eq(creditBatches.userId, userId),
		}),

		// Subscriptions
		db.query.userSubscriptions.findMany({
			where: eq(userSubscriptions.userId, userId),
		}),

		// Invoices
		db.query.userInvoices.findMany({
			where: eq(userInvoices.userId, userId),
		}),

		// API keys (mask key hashes)
		db.query.apiKeys.findMany({
			where: eq(apiKeys.userId, userId),
		}),

		// Prompts authored by user
		db.query.prompts.findMany({
			where: eq(prompts.authorId, userId),
		}),

		// Ratings given by user
		db.query.ratings.findMany({
			where: eq(ratings.userId, userId),
		}),

		// Scores for user's games
		db.query.scores.findMany({
			where: eq(scores.userId, userId),
		}),

		// Feedback submitted by user
		db.query.feedback.findMany({
			where: eq(feedback.userId, userId),
		}),

		// Email logs for user
		db.query.emailLogs.findMany({
			where: eq(emailLogs.userId, userId),
		}),

		// Collections owned by user
		db.query.collections.findMany({
			where: eq(collections.userId, userId),
		}),

		// Moderation reports as reporter
		db.query.moderationReports.findMany({
			where: eq(moderationReports.reporterId, userId),
		}),

		// Moderation reports as target
		db.query.moderationReports.findMany({
			where: eq(moderationReports.targetUserId, userId),
		}),

		// Moderation appeals by user
		db.query.moderationAppeals.findMany({
			where: eq(moderationAppeals.appellantId, userId),
		}),
	]);

	// Fetch games via prompts (need prompt IDs first)
	const promptIds = userPrompts.map((p) => p.id);
	const userGames =
		promptIds.length > 0
			? await db.query.games.findMany({
					where: inArray(games.promptId, promptIds),
				})
			: [];

	// Fetch game scores
	const userGameScores = await db.query.gameScores.findMany({
		where: eq(gameScores.userId, userId),
	});

	// Fetch game session metrics
	const userGameSessionMetrics = await db.query.gameSessionMetrics.findMany({
		where: eq(gameSessionMetrics.userId, userId),
	});

	// Build export data with proper masking
	const exportData: GdprExportData = {
		exportDate: new Date().toISOString(),
		userId,
		version: GDPR_EXPORT_VERSION,
		data: {
			profile: userProfile
				? {
						id: userProfile.id,
						name: userProfile.name,
						email: userProfile.email,
						emailVerified: userProfile.emailVerified,
						image: userProfile.image,
						createdAt: userProfile.createdAt,
						updatedAt: userProfile.updatedAt,
					}
				: null,

			userExtended: extendedUser
				? {
						id: extendedUser.id,
						role: extendedUser.role,
						reputation: extendedUser.reputation,
						credits: extendedUser.credits,
						isSuspended: extendedUser.isSuspended,
						suspensionReason: extendedUser.suspensionReason,
						suspendedUntil: extendedUser.suspendedUntil,
					}
				: null,

			preferences: userPrefs.map((p) => ({
				id: p.id,
				name: p.name,
				value: p.value,
			})),

			sessions: userSessions.map((s) => ({
				id: s.id,
				token: maskToken(s.token),
				expiresAt: s.expiresAt,
				createdAt: s.createdAt,
				ipAddress: s.ipAddress,
				userAgent: s.userAgent,
			})),

			accounts: userAccounts.map((a) => ({
				id: a.id,
				accountId: a.accountId,
				providerId: a.providerId,
				scope: a.scope,
				createdAt: a.createdAt,
				// Explicitly exclude: accessToken, refreshToken, idToken, password
			})),

			creditTransactions: transactions.map((t) => ({
				id: t.id,
				amount: t.amount,
				type: t.type,
				description: t.description,
				batchId: t.batchId,
				expiresAt: t.expiresAt,
				createdAt: t.createdAt,
			})),

			creditBatches: batches.map((b) => ({
				id: b.id,
				amount: b.amount,
				remainingAmount: b.remainingAmount,
				sourceType: b.sourceType,
				sourceId: b.sourceId,
				expiresAt: b.expiresAt,
				createdAt: b.createdAt,
			})),

			subscriptions: subscriptions.map((s) => ({
				id: s.id,
				planId: s.planId,
				stripeSubscriptionId: s.stripeSubscriptionId,
				status: s.status,
				currentPeriodStart: s.currentPeriodStart,
				currentPeriodEnd: s.currentPeriodEnd,
				cancelAtPeriodEnd: s.cancelAtPeriodEnd,
				createdAt: s.createdAt,
				updatedAt: s.updatedAt,
			})),

			invoices: invoices.map((i) => ({
				id: i.id,
				subscriptionId: i.subscriptionId,
				stripeInvoiceId: i.stripeInvoiceId,
				stripeSubscriptionId: i.stripeSubscriptionId,
				amount: i.amount,
				currency: i.currency,
				status: i.status,
				invoicePdf: i.invoicePdf,
				invoiceUrl: i.invoiceUrl,
				hostedInvoiceUrl: i.hostedInvoiceUrl,
				paidAt: i.paidAt,
				createdAt: i.createdAt,
			})),

			apiKeys: keys.map((k) => ({
				id: k.id,
				provider: k.provider,
				name: k.name,
				isActive: k.isActive,
				createdAt: k.createdAt,
				lastUsedAt: k.lastUsedAt,
				keyHash: maskApiKey(),
			})),

			prompts: userPrompts.map((p) => ({
				id: p.id,
				themeId: p.themeId,
				parentId: p.parentId,
				title: p.title,
				content: p.content,
				contentHash: p.contentHash,
				tokenCount: p.tokenCount,
				tokenizer: p.tokenizer,
				version: p.version,
				visibility: p.visibility,
				status: p.status,
				relationType: p.relationType,
				hiddenAt: p.hiddenAt,
				hiddenReason: p.hiddenReason,
				createdAt: p.createdAt,
				updatedAt: p.updatedAt,
			})),

			games: userGames.map((g) => ({
				id: g.id,
				name: g.name,
				promptId: g.promptId,
				themeId: g.themeId,
				status: g.status,
				modelProvider: g.modelProvider,
				modelName: g.modelName,
				tokenUsage: g.tokenUsage,
				isHidden: g.isHidden,
				hiddenReason: g.hiddenReason,
				isSubmitted: g.isSubmitted,
				createdAt: g.createdAt,
				updatedAt: g.updatedAt,
			})),

			gameScores: userGameScores.map((s) => ({
				id: s.id,
				gameId: s.gameId,
				sessionId: s.sessionId,
				score: s.score,
				isHighScore: s.isHighScore,
				completionTime: s.completionTime,
				playedAt: s.playedAt,
			})),

			gameSessionMetrics: userGameSessionMetrics.map((m) => ({
				id: m.id,
				sessionId: m.sessionId,
				gameId: m.gameId,
				startedAt: m.startedAt,
				endedAt: m.endedAt,
				playtimeSeconds: m.playtimeSeconds,
				hasScoreEvent: m.hasScoreEvent,
				createdAt: m.createdAt,
			})),

			ratings: userRatings.map((r) => ({
				id: r.id,
				promptId: r.promptId,
				gameId: r.gameId,
				themeId: r.themeId,
				promptQuality: r.promptQuality,
				gameQuality: r.gameQuality,
				themeRelevance: r.themeRelevance,
				overall: r.overall,
				feedback: r.feedback,
				createdAt: r.createdAt,
			})),

			scores: userScores.map((s) => ({
				id: s.id,
				promptId: s.promptId,
				gameId: s.gameId,
				themeId: s.themeId,
				score: s.score,
				isHighScore: s.isHighScore,
				completionTime: s.completionTime,
				playedAt: s.playedAt,
				qualityScore: s.qualityScore,
				engagementScore: s.engagementScore,
				playersScore: s.playersScore,
				playsScore: s.playsScore,
				replayScore: s.replayScore,
				efficiencyScore: s.efficiencyScore,
				tierFactor: s.tierFactor,
				inputTokens: s.inputTokens,
				finalScore: s.finalScore,
				calculatedAt: s.calculatedAt,
				version: s.version,
			})),

			feedback: userFeedback.map((f) => ({
				id: f.id,
				subject: f.subject,
				answer: f.answer,
				comment: f.comment,
				createdAt: f.createdAt,
			})),

			emailLogs: userEmailLogs.map((e) => ({
				id: e.id,
				resendId: e.resendId,
				emailType: e.emailType,
				status: e.status,
				subject: e.subject,
				fromEmail: e.fromEmail,
				toEmail: e.toEmail,
				templateId: e.templateId,
				errorMessage: e.errorMessage,
				sentAt: e.sentAt,
				deliveredAt: e.deliveredAt,
				openedAt: e.openedAt,
				clickedAt: e.clickedAt,
				createdAt: e.createdAt,
			})),

			collections: userCollections.map((c) => ({
				id: c.id,
				name: c.name,
				description: c.description,
				isPublic: c.isPublic,
				createdAt: c.createdAt,
				updatedAt: c.updatedAt,
			})),

			moderationReportsAsReporter: reportsAsReporter.map((r) => ({
				id: r.id,
				targetType: r.targetType,
				targetId: r.targetId,
				targetUserId: r.targetUserId,
				reason: r.reason,
				description: r.description,
				status: r.status,
				reviewedBy: r.reviewedBy,
				reviewedAt: r.reviewedAt,
				resolutionNotes: r.resolutionNotes,
				createdAt: r.createdAt,
			})),

			moderationReportsAsTarget: reportsAsTarget.map((r) => ({
				id: r.id,
				reporterId: r.reporterId,
				targetType: r.targetType,
				targetId: r.targetId,
				reason: r.reason,
				description: r.description,
				status: r.status,
				reviewedBy: r.reviewedBy,
				reviewedAt: r.reviewedAt,
				resolutionNotes: r.resolutionNotes,
				createdAt: r.createdAt,
			})),

			moderationAppeals: appeals.map((a) => ({
				id: a.id,
				reportId: a.reportId,
				reason: a.reason,
				evidence: a.evidence,
				status: a.status,
				reviewedBy: a.reviewedBy,
				reviewedAt: a.reviewedAt,
				decisionNotes: a.decisionNotes,
				createdAt: a.createdAt,
			})),
		},
	};

	return exportData;
}

/**
 * Fetches all exportable games for a user
 * Returns games that are completed, not hidden, and have game data
 */
export async function fetchUserExportableGames(userId: string): Promise<
	Array<{
		id: string;
		name: string | null;
		gameData: string;
	}>
> {
	// Get all prompts by the user
	const userPrompts = await db.query.prompts.findMany({
		where: eq(prompts.authorId, userId),
		columns: { id: true },
	});

	const promptIds = userPrompts.map((p) => p.id);

	if (promptIds.length === 0) {
		return [];
	}

	// Get all completed, non-hidden games with game data
	const userGames = await db.query.games.findMany({
		where: inArray(games.promptId, promptIds),
		columns: {
			id: true,
			name: true,
			gameData: true,
			status: true,
			isHidden: true,
		},
	});

	// Filter to only exportable games
	return userGames
		.filter(
			(game) =>
				game.status === "completed" &&
				!game.isHidden &&
				game.gameData !== null,
		)
		.map((game) => ({
			id: game.id,
			name: game.name,
			gameData: game.gameData ?? "",
		}));
}

/**
 * Creates a ZIP archive containing:
 * - data.json: The JSON export of user data
 * - games/game-{slug}.html: Each exportable game as standalone HTML
 */
export async function createExportZip(
	userId: string,
	exportData: GdprExportData,
): Promise<{ zipBuffer: Buffer; filename: string }> {
	const zip = new JSZip();

	// Add JSON data
	const jsonContent = JSON.stringify(exportData, null, 2);
	zip.file("data.json", jsonContent);

	// Fetch and add games
	const exportableGames = await fetchUserExportableGames(userId);
	const baseUrl = env.NEXT_PUBLIC_APP_URL ?? env.CORS_ORIGIN ?? "https://arcade-vibe.com";

	// Create games folder
	const gamesFolder = zip.folder("games");

	if (gamesFolder) {
		for (const game of exportableGames) {
			const portableData: PortableGameData = {
				id: game.id,
				name: game.name,
				gameData: game.gameData,
			};
			const html = generatePortableGameHtml(portableData, baseUrl);
			const filename = generatePortableFilename(portableData);
			gamesFolder.file(filename, html);
		}
	}

	// Generate ZIP buffer
	const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

	const dateStr = new Date().toISOString().split("T")[0];
	const filename = `user-data-export-${userId.slice(0, 8)}-${dateStr}.zip`;

	return { zipBuffer, filename };
}

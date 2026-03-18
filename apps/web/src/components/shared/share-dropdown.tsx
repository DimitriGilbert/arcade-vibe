"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { Code, Link, Linkedin, Share2, Twitter } from "lucide-react";
import { toast } from "sonner";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareDropdownProps {
	/** The URL to share */
	url: string;
	/** Title for social shares */
	title?: string;
	/** Optional embed code to copy */
	embedCode?: string;
	/** Custom trigger element (default: Share2 icon) */
	trigger?: ReactNode;
}

async function copyToClipboard(text: string, successMessage: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(text);
		toast.success(successMessage);
	} catch {
		toast.error("Failed to copy to clipboard");
	}
}

function shareToTwitter(url: string, title?: string): void {
	const text = title ? encodeURIComponent(title) : "";
	const shareUrl = encodeURIComponent(url);
	window.open(`https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`, "_blank", "width=550,height=420");
}

function shareToLinkedIn(url: string): void {
	const shareUrl = encodeURIComponent(url);
	window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, "_blank", "width=550,height=420");
}

export function ShareDropdown({ url, title, embedCode, trigger }: ShareDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearPendingTimeout = useCallback(() => {
		if (timeoutRef.current !== null) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, []);

	useEffect(() => {
		return () => {
			clearPendingTimeout();
		};
	}, [clearPendingTimeout]);

	const handleMouseEnter = () => {
		if (!window.matchMedia("(hover: hover)").matches) return;
		clearPendingTimeout();
		timeoutRef.current = setTimeout(() => {
			setIsOpen(true);
		}, 150);
	};

	const handleMouseLeave = () => {
		clearPendingTimeout();
		timeoutRef.current = setTimeout(() => {
			setIsOpen(false);
		}, 200);
	};

	const defaultTrigger = (
		<span
			role="button"
			tabIndex={0}
			className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] outline-none cursor-pointer"
			aria-label="Share"
		>
			<Share2 className="size-4" />
		</span>
	);

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger
				className="outline-none"
				onPointerEnter={handleMouseEnter}
				onPointerLeave={handleMouseLeave}
			>
				{trigger ?? defaultTrigger}
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				sideOffset={8}
				onPointerEnter={clearPendingTimeout}
				onPointerLeave={handleMouseLeave}
			>
				<DropdownMenuItem onClick={() => copyToClipboard(url, "Link copied to clipboard")}>
					<Link className="size-4" />
					<span>Copy Link</span>
				</DropdownMenuItem>

				{embedCode && (
					<DropdownMenuItem onClick={() => copyToClipboard(embedCode, "Embed code copied to clipboard")}>
						<Code className="size-4" />
						<span>Copy Embed Code</span>
					</DropdownMenuItem>
				)}

				<DropdownMenuItem onClick={() => shareToTwitter(url, title)}>
					<Twitter className="size-4" />
					<span>Share on X</span>
				</DropdownMenuItem>

				<DropdownMenuItem onClick={() => shareToLinkedIn(url)}>
					<Linkedin className="size-4" />
					<span>Share on LinkedIn</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

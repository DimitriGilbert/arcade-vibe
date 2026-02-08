import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user?: {
    name?: string | null;
    email?: string;
    image?: string | null;
  };
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "gradient" | "solid" | "border";
  showFallback?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "w-8 h-8",
  sm: "w-10 h-10",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-20 h-20",
};

const getInitials = (name: string | null | undefined, email: string | undefined): string => {
  if (name) {
    return name.charAt(0).toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return "?";
};

export default function UserAvatar({
  user,
  size = "md",
  variant = "gradient",
  showFallback = true,
  className,
}: UserAvatarProps) {
  const initials = getInitials(user?.name, user?.email);
  const hasImage = user?.image && showFallback;

  const variantClasses = {
    gradient: "bg-[var(--primary)] text-[var(--primary-foreground)]",
    solid: "bg-primary text-primary-foreground",
    border: "bg-primary text-primary-foreground",
  };

  const borderClasses = variant === "border" && (size === "lg" || size === "xl") ? "border-4 border-background" : "";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium shadow-lg",
        sizeClasses[size],
        hasImage ? "bg-muted" : variantClasses[variant],
        borderClasses,
        className
      )}
    >
      {hasImage && user.image ? (
        <img
          src={user.image}
          alt={user.name || user.email || "User"}
          className="size-full object-cover"
        />
      ) : showFallback ? (
        <span className="text-inherit">{initials}</span>
      ) : null}
    </div>
  );
}

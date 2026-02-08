import type { RouterOutput } from "@/lib/trpc-types";

export type User = NonNullable<RouterOutput["games"]["getById"]["prompt"]["user"]> & {
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UserExtended = RouterOutput["credits"]["getUserExtended"];

export type UserWithExtended = User & Partial<UserExtended>;

export type UserProfile = Pick<User, "id" | "name" | "email" | "image" | "createdAt">;

export type UserAdminView = UserExtended & {
  name: string;
  email: string;
};

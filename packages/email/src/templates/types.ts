export interface EmailUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  credits: number;
  reputation: number;
  gameCount: number;
  promptCount: number;
  creditSpent: number;
  createdAt: Date | null;
}

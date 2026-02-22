import { env } from "@arcade-vibe/env/server";

interface WelcomeEmailData {
  userName: string;
}

export function getWelcomeEmailHtml(data: WelcomeEmailData): string {
  const appUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Arcade-Vibe!</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; margin: 20px 0;">
    <h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 20px;">
      Welcome to Arcade-Vibe, ${data.userName}!
    </h1>
    <p style="color: #666666; font-size: 16px; line-height: 1.6;">
      Thanks for joining our community of game creators. You're now ready to:
    </p>
    <ul style="color: #444444; font-size: 16px; line-height: 1.8;">
      <li>Create AI-powered games from prompts</li>
      <li>Participate in weekly game jams</li>
      <li>Compete on the leaderboard</li>
      <li>Rate and discover amazing games</li>
    </ul>
    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-top: 20px;">
      You've been granted <strong>20 free credits</strong> to get started. Use them wisely!
    </p>
    <div style="margin-top: 30px;">
      <a href="${appUrl}" 
         style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        Start Creating
      </a>
    </div>
  </div>
  <p style="text-align: center; color: #999999; font-size: 14px;">
    © ${year} Arcade-Vibe. All rights reserved.
  </p>
</body>
</html>
`;
}

export function getWelcomeEmailText(data: WelcomeEmailData): string {
  const appUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const year = new Date().getFullYear();

  return `
Welcome to Arcade-Vibe, ${data.userName}!

Thanks for joining our community of game creators. You're now ready to:
- Create AI-powered games from prompts
- Participate in weekly game jams
- Compete on the leaderboard
- Rate and discover amazing games

You've been granted 20 free credits to get started. Use them wisely!

Start creating: ${appUrl}

© ${year} Arcade-Vibe. All rights reserved.
`;
}

export function getBroadcastEmailHtml(data: {
  subject: string;
  content: string;
}): string {
  const appUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; margin: 20px 0;">
    ${data.content}
  </div>
  <p style="text-align: center; color: #999999; font-size: 14px;">
    © ${year} Arcade-Vibe. All rights reserved.
    <br>
    <a href="${appUrl}/settings/notifications" style="color: #6366f1;">
      Manage notification preferences
    </a>
  </p>
</body>
</html>
`;
}

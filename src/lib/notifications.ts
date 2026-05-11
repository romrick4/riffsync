import webpush from "web-push";
import { prisma } from "@/lib/db";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import type { NotificationType } from "@/generated/prisma/client";

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@localhost",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

interface NotifyOptions {
  type: NotificationType;
  message: string;
  linkUrl?: string;
  recipientIds: string[];
  actorName?: string;
}

export async function notify({
  type,
  message,
  linkUrl,
  recipientIds,
}: NotifyOptions): Promise<void> {
  if (recipientIds.length === 0) return;

  // 1. In-app notifications (always)
  await prisma.notification.createMany({
    data: recipientIds.map((userId) => ({
      type,
      message,
      linkUrl: linkUrl ?? null,
      userId,
    })),
  });

  // 2. Web Push
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: { in: recipientIds } },
    });

    const payload = JSON.stringify({
      title: "RiffSync",
      body: message,
      url: linkUrl,
    });

    const pushPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    });

    await Promise.allSettled(pushPromises);
  }

  // 3. Email (if SMTP is configured)
  if (isEmailConfigured()) {
    const users = await prisma.user.findMany({
      where: { id: { in: recipientIds }, email: { not: null } },
      select: { email: true },
    });

    const subject = `RiffSync: ${message}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #7c3aed; margin: 0 0 16px 0;">RiffSync</h2>
        <p style="font-size: 16px; color: #1a1a1a; line-height: 1.5; margin: 0 0 16px 0;">${message}</p>
        ${linkUrl ? `<a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${linkUrl}" style="display: inline-block; background: #7c3aed; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500;">View in RiffSync</a>` : ""}
        <p style="font-size: 13px; color: #888; margin: 24px 0 0 0;">You received this because you're a member of a RiffSync project.</p>
      </div>
    `;

    const emailPromises = users
      .filter((u) => u.email)
      .map((u) => sendEmail(u.email!, subject, html));

    await Promise.allSettled(emailPromises);
  }
}

export async function getProjectMemberIds(
  projectId: string,
  excludeUserId?: string,
): Promise<string[]> {
  const members = await prisma.projectMember.findMany({
    where: {
      projectId,
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
    },
    select: { userId: true },
  });
  return members.map((m) => m.userId);
}

import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.MAGIC_LINK_FROM_EMAIL ?? "onboarding@resend.dev";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendMagicLinkEmail(to: string, magicLinkUrl: string): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Magic link] No RESEND_API_KEY; link would be:", magicLinkUrl);
      return { ok: true };
    }
    return { ok: false, error: "Email not configured." };
  }

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject: "Your sign-in link",
      html: `<p>Click to return to your assessment:</p><p><a href="${magicLinkUrl}">${magicLinkUrl}</a></p><p>This link expires in 15 minutes.</p>`,
    });
    if (error) {
      console.error("[Magic link] Resend error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    console.error("[Magic link] Send failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Failed to send email." };
  }
}

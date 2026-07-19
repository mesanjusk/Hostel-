import { connectDB } from "@/db";
import { User } from "@/models/User";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { isAdminWindowOpen } from "@/lib/waAdminWindow";

/** Notifies every admin whose WhatsApp customer-service window is currently open that a new
 * user has registered. Admins whose window has expired are silently skipped — Meta rejects
 * free-form text outside the window, and there's no template fallback for this particular
 * message (see waAdminReactivation.ts for how the window gets kept open in the first place). */
export async function notifyAdminsOfNewRegistration(name: string): Promise<void> {
  await connectDB();

  const admins = await User.find({ role: "admin", waWindowOpenedAt: { $ne: null } })
    .select("mobile waWindowOpenedAt")
    .lean();

  const openAdmins = admins.filter((admin) => isAdminWindowOpen(admin.waWindowOpenedAt));
  if (openAdmins.length === 0) return;

  const text = `New user registered: ${name}`;
  await Promise.all(
    openAdmins.map((admin) =>
      sendWhatsAppText(admin.mobile, text).catch((error) => {
        console.error(`Failed to notify admin ${admin.mobile} of new registration:`, error);
      }),
    ),
  );
}

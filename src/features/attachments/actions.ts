"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireStaff } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

const attachmentSchema = z.object({
  vehicleId: z.string().uuid(),
  workOrderId: z.string().uuid(),
  category: z.enum(["before", "damage", "after", "vehicle_document", "work_order_document"]),
  path: z.string().regex(/^work-orders\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/i),
  filename: z.string().trim().min(1).max(255),
  mime: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  bytes: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024),
  caption: z.string().trim().max(500),
});

export type AttachmentActionState = { error?: string; message?: string };

export async function registerAttachment(
  input: z.input<typeof attachmentSchema>,
): Promise<AttachmentActionState> {
  await requireStaff();
  const parsed = attachmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await (
    await createClient()
  ).rpc("register_work_order_attachment", {
    target_vehicle_id: parsed.data.vehicleId,
    target_work_order_id: parsed.data.workOrderId,
    target_category: parsed.data.category,
    target_path: parsed.data.path,
    target_filename: parsed.data.filename,
    target_mime: parsed.data.mime,
    target_bytes: parsed.data.bytes,
    target_caption: parsed.data.caption || null,
  });
  if (error) return { error: "The file was uploaded but could not be registered. Remove it and try again." };
  revalidatePath(`/work-orders/${parsed.data.workOrderId}`);
  return { message: "Attachment added." };
}

export async function archiveAttachment(
  attachmentId: string,
  workOrderId: string,
): Promise<AttachmentActionState> {
  await requireStaff();
  if (!z.string().uuid().safeParse(attachmentId).success || !z.string().uuid().safeParse(workOrderId).success)
    return { error: "Invalid attachment." };
  const { error } = await (
    await createClient()
  ).rpc("archive_work_order_attachment", { target_attachment_id: attachmentId });
  if (error) return { error: "Attachment could not be archived." };
  revalidatePath(`/work-orders/${workOrderId}`);
  return { message: "Attachment archived." };
}

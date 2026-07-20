"use client";

import { useState, useTransition } from "react";

import { archiveAttachment, registerAttachment } from "./actions";
import { createClient } from "@/lib/supabase/browser";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
type Attachment = { id: string; category: string; filename: string; url: string | null };

export function AttachmentPanel({
  workOrderId,
  vehicleId,
  canManage,
  attachments,
}: {
  workOrderId: string;
  vehicleId: string;
  canManage: boolean;
  attachments: Attachment[];
}) {
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();
  async function upload(file: File | undefined, category: "before" | "damage" | "after") {
    if (!file) return;
    if (
      !acceptedTypes.includes(file.type as (typeof acceptedTypes)[number]) ||
      file.size > 10 * 1024 * 1024
    ) {
      setMessage("Use a JPEG, PNG, WebP, or PDF up to 10 MB.");
      return;
    }
    const extension =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : "pdf";
    const path = `work-orders/${workOrderId}/${crypto.randomUUID()}.${extension}`;
    const storage = createClient().storage.from("vehicle-attachments");
    const { error } = await storage.upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      setMessage("Upload failed. Confirm your access and try again.");
      return;
    }
    const result = await registerAttachment({
      vehicleId,
      workOrderId,
      category,
      path,
      filename: file.name,
      mime: file.type as (typeof acceptedTypes)[number],
      bytes: file.size,
      caption: "",
    });
    if (result.error) {
      await storage.remove([path]);
      setMessage(result.error);
      return;
    }
    setMessage(result.message);
  }
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="font-semibold">Vehicle photos and documents</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Private files are limited to JPEG, PNG, WebP, or PDF, up to 10 MB.
      </p>
      {canManage ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {(["before", "damage", "after"] as const).map((category) => (
            <label className="rounded-md border p-3 text-sm font-medium capitalize" key={category}>
              {category} photo
              <input
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="mt-2 block w-full text-xs"
                disabled={pending}
                onChange={(event) => void upload(event.target.files?.[0], category)}
                type="file"
              />
            </label>
          ))}
        </div>
      ) : null}
      {attachments.length ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {attachments.map((attachment) => (
            <li
              className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
              key={attachment.id}
            >
              <a
                className="min-w-0 truncate font-medium underline"
                href={attachment.url ?? undefined}
                rel="noreferrer"
                target="_blank"
              >
                {attachment.category}: {attachment.filename}
              </a>
              {canManage ? (
                <button
                  className="text-destructive"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await archiveAttachment(attachment.id, workOrderId);
                      setMessage(result.error ?? result.message);
                    })
                  }
                  type="button"
                >
                  Archive
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No files attached.</p>
      )}
      {message ? (
        <p className="mt-3 text-sm" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}

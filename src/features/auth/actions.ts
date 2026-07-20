"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error?: string; message?: string };

const credentialsSchema = z.object({
  email: z.email("Enter a valid email address.").transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1, "Enter your password."),
});
const emailSchema = z.object({
  email: z.email("Enter a valid email address.").transform((value) => value.trim().toLowerCase()),
});
const staffSchema = z.object({
  displayName: z.string().trim().min(2, "Enter a name with at least 2 characters.").max(120),
  email: z.email("Enter a valid email address.").transform((value) => value.trim().toLowerCase()),
  password: z.string().min(12, "Use at least 12 characters."),
  role: z.enum(["admin", "front_desk", "technician"]),
});

function formValue(formData: FormData, key: string) {
  return typeof formData.get(key) === "string" ? formData.get(key) : "";
}

export async function signInWithPassword(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "We could not sign you in with those credentials." };
  redirect("/dashboard");
}

export async function sendMagicLink(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse({ email: formValue(formData, "email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const requestOrigin = (await headers()).get("origin") ?? "http://localhost:3000";
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? requestOrigin;
  let callbackOrigin: string;
  try {
    callbackOrigin = new URL(origin).origin;
  } catch {
    return { error: "Sign-in links are not configured correctly." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${callbackOrigin}/auth/callback`, shouldCreateUser: false },
  });
  if (error) return { error: "We could not send a sign-in link. Confirm that your staff account is active." };
  return { message: "If this is an active staff account, a sign-in link is on its way." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createStaff(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  await requireRole(["admin"]);
  const parsed = staffSchema.safeParse({
    displayName: formValue(formData, "displayName"),
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
    role: formValue(formData, "role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    app_metadata: { role: parsed.data.role },
    user_metadata: { display_name: parsed.data.displayName },
  });
  if (error)
    return {
      error:
        error.message === "User already registered"
          ? "A staff account already uses this email."
          : "The staff account could not be created.",
    };
  revalidatePath("/staff");
  return { message: "Staff account created. Share the password through a secure channel." };
}

const staffChangeSchema = z
  .object({
    staffId: z.string().uuid(),
    role: z.enum(["admin", "front_desk", "technician"]).optional(),
    accountStatus: z.enum(["active", "inactive"]).optional(),
  })
  .refine((value) => value.role || value.accountStatus, "No staff change was provided.");

export async function updateStaff(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const actor = await requireRole(["admin"]);
  const parsed = staffChangeSchema.safeParse({
    staffId: formValue(formData, "staffId"),
    role: formValue(formData, "role") || undefined,
    accountStatus: formValue(formData, "accountStatus") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (parsed.data.staffId === actor.id && parsed.data.accountStatus === "inactive")
    return { error: "You cannot deactivate your own account." };

  const supabase = await createClient();
  const changes = {
    ...(parsed.data.role ? { role: parsed.data.role } : {}),
    ...(parsed.data.accountStatus ? { account_status: parsed.data.accountStatus } : {}),
  };
  const { error } = await supabase.from("profiles").update(changes).eq("id", parsed.data.staffId);
  if (error) return { error: "The staff record could not be updated." };

  if (parsed.data.accountStatus) {
    const { error: authError } = await createAdminClient().auth.admin.updateUserById(parsed.data.staffId, {
      ban_duration: parsed.data.accountStatus === "inactive" ? "876000h" : "none",
    });
    if (authError) return { error: "The profile changed, but the sign-in status could not be updated." };
  }
  revalidatePath("/staff");
  return { message: "Staff access updated." };
}

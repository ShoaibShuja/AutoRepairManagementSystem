// Generated target: `npm run supabase:types`. This maintained baseline mirrors migration v1.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type StaffRole = "admin" | "front_desk" | "technician";
export type StaffAccountStatus = "active" | "inactive";

type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};
type Profile = {
  id: string;
  email: string;
  display_name: string;
  role: StaffRole;
  account_status: StaffAccountStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at" | "created_by" | "updated_by"> &
          Partial<
            Pick<Profile, "created_at" | "updated_at" | "created_by" | "updated_by" | "account_status">
          >;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: [];
      };
      business_settings: GenericTable;
      customers: GenericTable;
      vehicles: GenericTable;
      service_catalog: GenericTable;
      appointments: GenericTable;
      work_orders: GenericTable;
      work_order_services: GenericTable;
      parts: GenericTable;
      work_order_parts: GenericTable;
      inventory_movements: GenericTable;
      invoices: GenericTable;
      invoice_items: GenericTable;
      payments: GenericTable;
      attachments: GenericTable;
      activity_log: GenericTable;
    };
    Views: Record<string, never>;
    Functions: {
      current_staff_role: { Args: Record<string, never>; Returns: StaffRole };
      is_active_staff: { Args: Record<string, never>; Returns: boolean };
      has_role: { Args: { allowed_roles: StaffRole[] }; Returns: boolean };
      is_assigned_technician: { Args: { target_work_order_id: string }; Returns: boolean };
    };
    Enums: {
      staff_role: StaffRole;
      staff_account_status: StaffAccountStatus;
      appointment_status: "scheduled" | "checked_in" | "cancelled" | "no_show";
      work_order_status:
        "draft" | "assigned" | "in_progress" | "ready_for_review" | "completed" | "invoiced" | "cancelled";
      invoice_status: "issued" | "paid" | "void";
      payment_method: "cash" | "card_in_person";
      payment_status: "recorded" | "voided";
      attachment_category: "before" | "damage" | "after" | "vehicle_document" | "work_order_document";
      inventory_movement_type: "restock" | "work_order_usage" | "usage_reversal" | "manual_adjustment";
      invoice_item_source_type: "service" | "part";
    };
    CompositeTypes: Record<string, never>;
  };
};

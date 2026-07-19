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
type Customer = {
  id: string;
  full_name: string;
  name_normalized: string;
  phone: string | null;
  phone_normalized: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};
type Vehicle = {
  id: string;
  customer_id: string;
  plate_number: string | null;
  plate_normalized: string | null;
  vin: string | null;
  make: string | null;
  model: string | null;
  model_year: number | null;
  color: string | null;
  mileage: number | null;
  mileage_recorded_at: string | null;
  notes: string | null;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};
type Service = {
  id: string;
  name: string;
  name_normalized: string;
  category: string | null;
  description: string | null;
  standard_price_minor: number;
  default_duration_minutes: number;
  archived_at: string | null;
  archived_by: string | null;
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
      customers: {
        Row: Customer;
        Insert: Partial<
          Omit<Customer, "id" | "name_normalized" | "created_at" | "updated_at" | "created_by" | "updated_by">
        > &
          Pick<Customer, "full_name">;
        Update: Partial<Omit<Customer, "id" | "created_at">>;
        Relationships: [];
      };
      vehicles: {
        Row: Vehicle;
        Insert: Partial<
          Omit<Vehicle, "id" | "plate_normalized" | "created_at" | "updated_at" | "created_by" | "updated_by">
        > &
          Pick<Vehicle, "customer_id">;
        Update: Partial<Omit<Vehicle, "id" | "created_at">>;
        Relationships: [];
      };
      service_catalog: {
        Row: Service;
        Insert: Partial<
          Omit<Service, "id" | "name_normalized" | "created_at" | "updated_at" | "created_by" | "updated_by">
        > &
          Pick<Service, "name" | "standard_price_minor">;
        Update: Partial<Omit<Service, "id" | "created_at">>;
        Relationships: [];
      };
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
      create_work_order: { Args: { target_customer_id: string; target_vehicle_id: string; target_technician_id: string | null; concern: string | null; internal_note: string | null; estimated_completion: string | null; intake_mileage: number | null; selected_services: Json }; Returns: string };
      update_work_order_details: { Args: { target_work_order_id: string; target_technician_id: string | null; concern: string | null; internal_note: string | null; estimated_completion: string | null; intake_mileage: number | null; selected_services: Json }; Returns: undefined };
      transition_work_order: { Args: { target_work_order_id: string; next_status: Database["public"]["Enums"]["work_order_status"]; note: string | null }; Returns: undefined };
      add_technician_note: { Args: { target_work_order_id: string; note: string }; Returns: undefined };
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

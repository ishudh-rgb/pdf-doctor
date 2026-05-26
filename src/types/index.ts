export type UserRole = "user" | "pro" | "admin";

export type Language = "en" | "hi";

export type ProcessingStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type PlanTier = "free" | "pro";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  language: Language;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  company: string | null;
  usage_count_today: number;
  total_usage_count: number;
  preferred_language: Language;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_file_size_mb: number;
  daily_usage_limit: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan_tier: PlanTier;
  status: "active" | "cancelled" | "expired" | "past_due" | "trialing";
  razorpay_subscription_id: string | null;
  razorpay_customer_id: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string | null;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string | null;
  amount: number;
  currency: string;
  status: "created" | "captured" | "failed" | "refunded";
  method: string | null;
  description: string | null;
  coupon_code: string | null;
  discount_amount: number;
  created_at: string;
}

export interface ToolJob {
  id: string;
  user_id: string | null;
  session_id: string;
  tool_slug: string;
  status: ProcessingStatus;
  input_files: UploadedFile[];
  output_file_url: string | null;
  output_file_name: string | null;
  output_file_size: number | null;
  options: Record<string, unknown>;
  error_message: string | null;
  processing_time_ms: number | null;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  original_name: string;
  size: number;
  mime_type: string;
  storage_path: string;
  url: string | null;
  page_count: number | null;
  uploaded_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string | null;
  session_id: string;
  tool_slug: string;
  ip_address: string | null;
  file_size: number;
  processing_time_ms: number | null;
  status: ProcessingStatus;
  created_at: string;
}

export interface AIUsageLog {
  id: string;
  user_id: string;
  tool_slug: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  prompt_summary: string | null;
  created_at: string;
}

export interface AdminSettings {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface CouponCode {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  applicable_plans: PlanTier[];
  created_at: string;
}

export interface ErrorLog {
  id: string;
  user_id: string | null;
  tool_slug: string | null;
  error_type: string;
  error_message: string;
  error_stack: string | null;
  request_url: string | null;
  request_method: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Tool {
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  color: string;
  requiresLogin: boolean;
  isPro: boolean;
  acceptedFileTypes: string[];
  maxFiles: number;
}

export interface ToolCategory {
  name: string;
  slug: string;
  tools: Tool[];
}

export interface MegaMenuCategory {
  label: string;
  tools: Pick<Tool, "name" | "slug" | "icon" | "color">[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ToolSEO {
  title: string;
  metaDescription: string;
  h1: string;
  seoContent: string;
  faqs: FAQ[];
}

export interface PricingPlan {
  name: string;
  tier: PlanTier;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  highlighted: boolean;
  ctaText: string;
}

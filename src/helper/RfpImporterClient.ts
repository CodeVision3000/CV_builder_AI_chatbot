/**
 * RfpImporterClient — thin typed client for the RFP-Importer PostgREST API.
 *
 * All requests are authenticated with the VITE_POSTGREST_JWT env var which
 * must carry the claim { "role": "web_rfp" }.  Configure VITE_POSTGREST_URL
 * to point at the running PostgREST instance (e.g. http://localhost:3001).
 */

import { POSTGREST_JWT, POSTGREST_URL } from "./Constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkflowState =
  | "logged"
  | "folder_created"
  | "docs_received"
  | "awaiting_portal_docs"
  | "analyzed"
  | "rfi_drafted"
  | "sent_to_estimating"
  | "complete"
  | "needs_review";

export type EstimateStatus =
  | "Pending"
  | "Active"
  | "Won"
  | "Lost"
  | "Cancelled"
  | "Delayed"
  | "Declined"
  | "Budgetary"
  | "Rates"
  | "Pass";

export interface Estimate {
  id: string;
  estimate_number: string;
  client: string;
  project_name: string;
  scope_of_work: string | null;
  estimate_type: string | null;
  estimator: string | null;
  market: string | null;
  prebid_date: string | null;
  prebid_time: string | null;
  location: string | null;
  due_date: string | null;
  due_time: string | null;
  submitted_proposed_value: string | null;
  notes: string | null;
  notification_date: string | null;
  status: EstimateStatus;
  follow_up: string | null;
  potential_start_date: string | null;
  duration_days: number | null;
  completion_date: string | null;
  folder_name: string | null;
  sharepoint_url: string | null;
  source_message_id: string | null;
  source_subject: string | null;
  source_from: string | null;
  received_at: string | null;
  procurement_portal: boolean;
  portal_url: string | null;
  portal_docs_ready: boolean;
  workflow_state: WorkflowState;
  created_at: string;
  updated_at: string;
}

export interface EstimateAnalysis {
  id: string;
  estimate_id: string;
  scope_summary: string | null;
  contract_requirements: string | null;
  anticipated_schedule: string | null;
  project_location: string | null;
  missing_info: string | null;
  draft_rfis: Array<{ number: number; subject: string; question: string }>;
  model: string | null;
  generated_at: string;
}

export interface EstimateAttachment {
  id: string;
  estimate_id: string;
  file_name: string;
  file_url: string;
  source: "email" | "portal" | "manual";
  size_bytes: number | null;
  content_type: string | null;
  added_at: string;
}

export interface EstimateEvent {
  id: number;
  estimate_id: string;
  event_type: string;
  detail: string | null;
  actor: string | null;
  created_at: string;
}

export type PatchableEstimateFields = Partial<
  Pick<
    Estimate,
    | "status"
    | "notes"
    | "sharepoint_url"
    | "portal_url"
    | "portal_docs_ready"
    | "workflow_state"
  >
>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };
  if (POSTGREST_JWT) {
    headers["Authorization"] = "Bearer " + POSTGREST_JWT;
  }
  return headers;
}

function baseUrl(): string {
  // Strip trailing slash
  return POSTGREST_URL.replace(/\/$/, "");
}

async function pgGet<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    method: "GET",
    headers: buildHeaders()
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PostgREST GET ${path} failed (${response.status}): ${text}`);
  }
  return response.json() as Promise<T>;
}

async function pgPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `PostgREST POST ${path} failed (${response.status}): ${text}`
    );
  }
  // 204 No Content
  if (response.status === 204) return undefined as unknown as T;
  return response.json() as Promise<T>;
}

async function pgPatch(path: string, body: unknown): Promise<void> {
  const response = await fetch(`${baseUrl()}${path}`, {
    method: "PATCH",
    headers: buildHeaders(),
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `PostgREST PATCH ${path} failed (${response.status}): ${text}`
    );
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch estimates with optional PostgREST filter params.
 *
 * @example
 * // Active estimates ordered by due date
 * getEstimates({ workflow_state: "eq.analyzed", order: "due_date.asc" })
 */
export async function getEstimates(
  filters: Record<string, string> = {}
): Promise<Estimate[]> {
  const params = new URLSearchParams(filters);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return pgGet<Estimate[]>(`/estimates${qs}`);
}

/** Fetch a single estimate by its UUID. */
export async function getEstimateById(id: string): Promise<Estimate | null> {
  const results = await pgGet<Estimate[]>(`/estimates?id=eq.${id}&limit=1`);
  return results[0] ?? null;
}

/**
 * Fetch the most-recent analysis record for an estimate.
 * Returns null when no analysis has been generated yet.
 */
export async function getAnalysis(
  estimateId: string
): Promise<EstimateAnalysis | null> {
  const results = await pgGet<EstimateAnalysis[]>(
    `/estimate_analysis?estimate_id=eq.${estimateId}&order=generated_at.desc&limit=1`
  );
  return results[0] ?? null;
}

/** Fetch all attachments for an estimate. */
export async function getAttachments(
  estimateId: string
): Promise<EstimateAttachment[]> {
  return pgGet<EstimateAttachment[]>(
    `/estimate_attachments?estimate_id=eq.${estimateId}`
  );
}

/** Fetch the audit-log events for an estimate. */
export async function getEvents(estimateId: string): Promise<EstimateEvent[]> {
  return pgGet<EstimateEvent[]>(
    `/estimate_events?estimate_id=eq.${estimateId}&order=created_at.asc`
  );
}

/**
 * Patch allowed columns on an estimate (web_rfp role restrictions apply).
 * Only status, notes, sharepoint_url, portal_url, portal_docs_ready and
 * workflow_state may be updated.
 */
export async function patchEstimate(
  id: string,
  fields: PatchableEstimateFields
): Promise<void> {
  return pgPatch(`/estimates?id=eq.${id}`, fields);
}

/**
 * Append an entry to the estimate audit log.
 *
 * @param estimateId - UUID of the estimate being acted upon
 * @param eventType  - Short code describing what happened, e.g. "companion_import"
 * @param detail     - Human-readable description (optional)
 */
export async function logEvent(
  estimateId: string,
  eventType: string,
  detail?: string
): Promise<void> {
  await pgPost("/estimate_events", {
    estimate_id: estimateId,
    event_type: eventType,
    detail: detail ?? null,
    actor: "mytender-companion"
  });
}

/** True when both POSTGREST_URL and POSTGREST_JWT are configured. */
export function isRfpImporterConfigured(): boolean {
  return Boolean(POSTGREST_URL && POSTGREST_JWT);
}

/** Human-readable label for a workflow state. */
export function workflowStateLabel(state: WorkflowState | string): string {
  const labels: Record<string, string> = {
    logged: "Logged",
    folder_created: "Folder Created",
    docs_received: "Docs Received",
    awaiting_portal_docs: "Awaiting Portal Docs",
    analyzed: "Analyzed",
    rfi_drafted: "RFI Drafted",
    sent_to_estimating: "Sent to Estimating",
    complete: "Complete",
    needs_review: "Needs Review"
  };
  return labels[state] ?? state;
}

/** CSS colour class for a workflow state badge. */
export function workflowStateColorClass(state: WorkflowState | string): string {
  switch (state) {
    case "needs_review":
      return "rfp-state-needs-review";
    case "analyzed":
    case "rfi_drafted":
      return "rfp-state-analyzed";
    case "sent_to_estimating":
    case "complete":
      return "rfp-state-complete";
    default:
      return "rfp-state-in-progress";
  }
}

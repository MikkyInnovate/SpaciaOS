/**
 * QUEUE INFRASTRUCTURE CONTRACTS & TYPES
 * 
 * Provider-agnostic queue and worker contracts for SpaciaOS asynchronous workflows.
 * Insulates domain services from BullMQ / Redis implementation details.
 */

export const QUEUE_NAMES = {
  LEAD_WORKFLOWS: "lead-workflows",
} as const;

export const JOB_NAMES = {
  PROCESS_NEW_LEAD: "process-new-lead",
} as const;

export interface QueueJobOptions {
  attempts?: number;
  backoff?: {
    type: "exponential" | "fixed";
    delay: number;
  };
  jobId?: string;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

/**
 * Standard retry policy across all asynchronous lead workflows:
 * - 3 total attempts
 * - Exponential backoff starting at 1000ms (1s -> 2s -> 4s)
 * - Retains last 100 completed and 500 failed jobs for operator audit.
 */
export const DEFAULT_WORKFLOW_RETRY_CONFIG: QueueJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  removeOnComplete: 100,
  removeOnFail: 500,
};

export interface NewLeadWorkflowPayload {
  workspaceId: string;
  leadId: string;
  phone: string;
  email?: string;
  source: string;
  isReEngagement: boolean;
  metadata?: Record<string, any>;
}

export interface BaseQueueJob<T = any> {
  id?: string;
  name: string;
  data: T;
  opts?: QueueJobOptions;
  attemptsMade?: number;
  timestamp?: number;
}

export interface IQueue<T = any> {
  readonly name: string;
  add(jobName: string, data: T, opts?: QueueJobOptions): Promise<BaseQueueJob<T>>;
  close(): Promise<void>;
}

export interface IWorker<T = any> {
  readonly name: string;
  close(): Promise<void>;
}

export interface WorkflowJobResult {
  success: boolean;
  leadId: string;
  workspaceId: string;
  actionTaken: string;
  durationMs: number;
  attemptsMade: number;
}

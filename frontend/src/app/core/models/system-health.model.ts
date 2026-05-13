export type HealthStatus = 'READY' | 'WARN' | 'BLOCKED' | 'UP' | 'DOWN' | 'PASS' | 'FAIL' | string;

export interface ServiceProbe {
  name: string;
  kind: string;
  url: string;
  status: HealthStatus;
  httpStatus: number | null;
  responseTimeMs: number;
  checkedAt: string;
  message: string;
}

export interface IntegrationStatus {
  name: string;
  configured: boolean;
  status: HealthStatus;
  detail: string;
  metadata: Record<string, unknown>;
}

export interface ReleaseCheck {
  id: string;
  label: string;
  status: HealthStatus;
  detail: string;
}

export interface SystemHealth {
  overallStatus: HealthStatus;
  generatedAt: string;
  gatewayVersion: string;
  services: ServiceProbe[];
  integrations: IntegrationStatus[];
  releaseChecklist: ReleaseCheck[];
}

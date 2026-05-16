export interface DesignDimensions {
  heightCm: number;
  widthCm: number;
  depthCm: number;
  diameterCm: number;
}

export interface DesignThreeDParameters {
  template: string;
  height: number;
  radius: number;
  taper: number;
  curvature: number;
  materialColor: string;
  accentColor: string;
  patternStyle: string;
  repeatCount: number;
  engineVersion?: string | null;
  materialPreset?: string | null;
  detailLevel?: string | null;
  cameraPreset?: string | null;
  surfaceTexture?: string | null;
  ornamentStyle?: string | null;
  parts?: DesignThreeDPart[] | null;
}

export interface DesignThreeDPart {
  kind: 'band' | 'handle' | 'leg' | 'rim' | 'weave' | 'perforation' | 'base' | 'shade' | string;
  placement: 'top' | 'middle' | 'bottom' | 'side' | 'surface' | string;
  repeatCount?: number | null;
  color?: string | null;
  scale?: number | null;
  rotation?: number | null;
}

export interface PriceBreakdown {
  basePrice: number;
  materialCost: number;
  complexityCost: number;
  sizeCost: number;
  finishCost: number;
  total: number;
  pricingNotes: string[];
}

export interface DesignSpec {
  productType: string;
  title: string;
  artisanStory: string;
  territory: string;
  primaryMaterial: string;
  secondaryMaterials: string[];
  colorPalette: string[];
  dimensions: DesignDimensions;
  pattern: string;
  finish: string;
  complexity: string;
  estimatedPrice: number;
  priceBreakdown: PriceBreakdown;
  estimatedDays: number;
  makingSteps: string[];
  threeD: DesignThreeDParameters;
}

export interface DesignTurnRequest {
  message: string;
  currentSpec?: DesignSpec | null;
}

export interface DesignTurnResponse {
  reply: string;
  spec: DesignSpec;
  previewPrompt: string;
  source: 'openai' | 'fallback' | string;
}

export interface PreviewResponse {
  imageBase64?: string | null;
  mimeType?: string | null;
  prompt: string;
  source: 'openai' | 'fallback' | string;
}

export interface ConfirmDesignRequest {
  spec: DesignSpec;
  customerNotes?: string | null;
  previewPrompt?: string | null;
  previewImageBase64?: string | null;
  previewMimeType?: string | null;
  previewSource?: string | null;
}

export type CustomDesignStatus =
  | 'PENDING_QUOTE'
  | 'IN_REVIEW'
  | 'QUOTE_SENT'
  | 'CUSTOMER_ACCEPTED'
  | 'IN_PRODUCTION'
  | 'READY'
  | 'NEEDS_CHANGES'
  | 'APPROVED_FOR_PRODUCT'
  | 'REJECTED'
  | 'CANCELLED'
  | 'ARCHIVED';

export interface CustomDesignResponse {
  id: string;
  userId: string;
  title: string;
  productType: string;
  status: CustomDesignStatus | string;
  spec: DesignSpec;
  priceBreakdown: PriceBreakdown;
  estimatedPrice: number;
  estimatedDays: number;
  customerNotes?: string | null;
  reviewNotes?: string | null;
  previewPrompt?: string | null;
  previewImageBase64?: string | null;
  previewMimeType?: string | null;
  previewSource?: string | null;
  createdAt: string;
}

export interface UpdateDesignStatusRequest {
  status: CustomDesignStatus;
  reviewNotes?: string | null;
}

export interface DesignNotificationResponse {
  id: string;
  userId: string;
  designId: string;
  title: string;
  message: string;
  status: CustomDesignStatus | string;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
}

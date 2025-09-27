// Type definitions for the Personaliz application

export interface PersonalizationRequest {
  name: string;
  city: string;
  phone: string;
  actorId: string;
}

export interface PersonalizationResponse {
  success: boolean;
  personalizationId?: number;
  videoUrl?: string;
  message?: string;
  error?: string;
}

export interface Actor {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Personalization {
  id: number;
  name: string;
  city: string;
  phone: string;
  actorId: string;
  syncJobId: string | null;
  videoUrl: string | null;
  whatsappMsgId: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  events: Event[];
}

export interface Event {
  id: number;
  personalizationId: number;
  type: string;
  payload: any;
  createdAt: Date;
}

export interface SyncJobResponse {
  id: string;
  status: string;
  outputUrl?: string;
}

export interface WhatsAppMessageResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  mediaUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface WebhookPayload {
  MessageSid?: string;
  Sid?: string;
  MessageStatus?: string;
  Status?: string;
  To?: string;
  to?: string;
  [key: string]: any;
}

export type PersonalizationStatus = 
  | 'pending'
  | 'queued'
  | 'sync_submitted'
  | 'ready'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export type EventType = 
  | 'request'
  | 'sync_submitted'
  | 'sync_completed'
  | 'sync_failed'
  | 'whatsapp_sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'whatsapp_status_update'
  | 'sync_status_update';

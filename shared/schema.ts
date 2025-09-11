/**
 * MongoDB Schema Types for Event Tribe Application
 * This file contains TypeScript interfaces and Zod schemas for MongoDB documents
 */

import { z } from "zod";

// User Schema for MongoDB
export interface User {
  _id?: string;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  role: 'organizer' | 'admin' | 'super_admin' | 'attendee';
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const insertUserSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organizationName: z.string().optional(),
  role: z.enum(['organizer', 'admin', 'super_admin', 'attendee']).default('attendee'),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// Support Ticket Schema for MongoDB
export interface SupportTicket {
  _id?: string;
  id?: string;
  ticketNumber: string;
  organizerId: string;
  organizerEmail: string;
  organizerName: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assignedAdminId?: string;
  assignedAdminName?: string;
  resolutionNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
  lastMessageAt?: Date;
  messageCount?: number;
}

export interface SupportMessage {
  _id?: string;
  id?: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderType: 'organizer' | 'admin' | 'system';
  message: string;
  messageType: 'text' | 'system';
  attachments?: string;
  isInternal?: boolean;
  createdAt?: Date;
  readByReceiver?: boolean;
}

// Schema validation for Support Tickets
export const insertSupportTicketSchema = z.object({
  organizerId: z.string(),
  organizerEmail: z.string().email(),
  organizerName: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.string().default('general'),
});

export const insertSupportMessageSchema = z.object({
  ticketId: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  senderType: z.enum(['organizer', 'admin', 'system']),
  message: z.string().min(1),
  messageType: z.enum(['text', 'system']).default('text'),
  isInternal: z.boolean().default(false),
});

export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;

// Event Schema for MongoDB
export interface Event {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  venue?: string;
  address?: string;
  startDate: Date;
  endDate: Date;
  category: string;
  locationType: 'physical' | 'virtual' | 'hybrid';
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  isPublic: boolean;
  allowRefunds: boolean;
  organizerId: string;
  organizationId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  ticketTypes?: TicketType[];
  coverImage?: string;
}

export interface TicketType {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  sold?: number;
  isActive: boolean;
}

// Organization Schema for MongoDB
export interface Organization {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  ownerId: string;
  members?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
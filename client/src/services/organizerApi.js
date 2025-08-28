/**
 * Complete Organizer API Service
 * Integrates all backend APIs with frontend
 */

import { apiRequest } from '../lib/queryClient';

const API_BASE = '/api/organizer';

// ==================== DASHBOARD OVERVIEW ====================

export const organizerApi = {
  // Dashboard Overview
  getDashboardOverview: () => apiRequest(`${API_BASE}/dashboard`),

  // ==================== ORGANIZATION MANAGEMENT ====================
  
  // Organizations
  createOrganization: (data) => apiRequest(`${API_BASE}/organizations`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getOrganizations: () => apiRequest(`${API_BASE}/organizations`),
  
  getOrganization: (id) => apiRequest(`${API_BASE}/organizations/${id}`),
  
  updateOrganization: (id, data) => apiRequest(`${API_BASE}/organizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deleteOrganization: (id) => apiRequest(`${API_BASE}/organizations/${id}`, {
    method: 'DELETE',
  }),

  // ==================== EVENT MANAGEMENT ====================
  
  // Events
  createEvent: (data) => apiRequest(`${API_BASE}/events`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`${API_BASE}/events${query ? `?${query}` : ''}`);
  },
  
  getEvent: (id) => apiRequest(`${API_BASE}/events/${id}`),
  
  updateEvent: (id, data) => apiRequest(`${API_BASE}/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deleteEvent: (id) => apiRequest(`${API_BASE}/events/${id}`, {
    method: 'DELETE',
  }),
  
  getEventStats: (id) => apiRequest(`${API_BASE}/events/${id}/stats`),
  
  publishEvent: (id) => apiRequest(`${API_BASE}/events/${id}/publish`, {
    method: 'POST',
  }),
  
  unpublishEvent: (id) => apiRequest(`${API_BASE}/events/${id}/unpublish`, {
    method: 'POST',
  }),

  // ==================== ATTENDEE MANAGEMENT ====================
  
  // Attendees
  getAttendees: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`${API_BASE}/attendees${query ? `?${query}` : ''}`);
  },
  
  getAttendee: (id) => apiRequest(`${API_BASE}/attendees/${id}`),
  
  updateAttendee: (id, data) => apiRequest(`${API_BASE}/attendees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  checkInAttendee: (id) => apiRequest(`${API_BASE}/attendees/${id}/checkin`, {
    method: 'POST',
  }),
  
  bulkCheckIn: (attendeeIds) => apiRequest(`${API_BASE}/attendees/bulk-checkin`, {
    method: 'POST',
    body: JSON.stringify({ attendeeIds }),
  }),
  
  getAttendeeStats: (eventId) => apiRequest(`${API_BASE}/attendees/stats${eventId ? `?eventId=${eventId}` : ''}`),

  // ==================== MARKETING CAMPAIGNS ====================
  
  // Marketing Campaigns
  createCampaign: (data) => apiRequest(`${API_BASE}/marketing/campaigns`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getCampaigns: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`${API_BASE}/marketing/campaigns${query ? `?${query}` : ''}`);
  },
  
  getCampaign: (id) => apiRequest(`${API_BASE}/marketing/campaigns/${id}`),
  
  updateCampaign: (id, data) => apiRequest(`${API_BASE}/marketing/campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deleteCampaign: (id) => apiRequest(`${API_BASE}/marketing/campaigns/${id}`, {
    method: 'DELETE',
  }),
  
  launchCampaign: (id) => apiRequest(`${API_BASE}/marketing/campaigns/${id}/launch`, {
    method: 'POST',
  }),
  
  pauseCampaign: (id) => apiRequest(`${API_BASE}/marketing/campaigns/${id}/pause`, {
    method: 'POST',
  }),
  
  getCampaignStats: (id) => apiRequest(`${API_BASE}/marketing/campaigns/${id}/stats`),

  // ==================== AUDIENCE MANAGEMENT ====================
  
  // Audience
  createContact: (data) => apiRequest(`${API_BASE}/audience/contacts`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getContacts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`${API_BASE}/audience/contacts${query ? `?${query}` : ''}`);
  },
  
  getContact: (id) => apiRequest(`${API_BASE}/audience/contacts/${id}`),
  
  updateContact: (id, data) => apiRequest(`${API_BASE}/audience/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deleteContact: (id) => apiRequest(`${API_BASE}/audience/contacts/${id}`, {
    method: 'DELETE',
  }),
  
  getContactStats: () => apiRequest(`${API_BASE}/audience/contacts/stats`),
  
  createSegment: (data) => apiRequest(`${API_BASE}/audience/segments`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getSegments: () => apiRequest(`${API_BASE}/audience/segments`),
  
  getSegment: (id) => apiRequest(`${API_BASE}/audience/segments/${id}`),
  
  updateSegment: (id, data) => apiRequest(`${API_BASE}/audience/segments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deleteSegment: (id) => apiRequest(`${API_BASE}/audience/segments/${id}`, {
    method: 'DELETE',
  }),

  // ==================== FINANCIAL MANAGEMENT ====================
  
  // Payouts
  createPayout: (data) => apiRequest(`${API_BASE}/payouts`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getPayouts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`${API_BASE}/payouts${query ? `?${query}` : ''}`);
  },
  
  getPayout: (id) => apiRequest(`${API_BASE}/payouts/${id}`),
  
  updatePayout: (id, data) => apiRequest(`${API_BASE}/payouts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  getPayoutStats: () => apiRequest(`${API_BASE}/payouts/stats`),

  // Financial Summary
  getFinancialSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`${API_BASE}/finances/summary${query ? `?${query}` : ''}`);
  },
  
  getFinancialReports: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`${API_BASE}/finances/reports${query ? `?${query}` : ''}`);
  },
  
  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`${API_BASE}/finances/transactions${query ? `?${query}` : ''}`);
  },

  // ==================== DISPUTE MANAGEMENT ====================
  
  // Disputes
  createDispute: (data) => apiRequest(`${API_BASE}/disputes`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getDisputes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`${API_BASE}/disputes${query ? `?${query}` : ''}`);
  },
  
  getDispute: (id) => apiRequest(`${API_BASE}/disputes/${id}`),
  
  updateDispute: (id, data) => apiRequest(`${API_BASE}/disputes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  addDisputeMessage: (id, data) => apiRequest(`${API_BASE}/disputes/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getDisputeStats: () => apiRequest(`${API_BASE}/disputes/stats`),

  // ==================== TEAM MANAGEMENT ====================
  
  // Team Members
  inviteTeamMember: (data) => apiRequest(`${API_BASE}/team/invite`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getTeamMembers: () => apiRequest(`${API_BASE}/team/members`),
  
  getTeamMember: (id) => apiRequest(`${API_BASE}/team/members/${id}`),
  
  updateTeamMember: (id, data) => apiRequest(`${API_BASE}/team/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  removeTeamMember: (id) => apiRequest(`${API_BASE}/team/members/${id}`, {
    method: 'DELETE',
  }),
  
  getTeamStats: () => apiRequest(`${API_BASE}/team/stats`),

  // ==================== ANALYTICS ====================
  
  // Analytics
  createAnalyticsEntry: (data) => apiRequest(`${API_BASE}/analytics`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getAnalytics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`${API_BASE}/analytics${query ? `?${query}` : ''}`);
  },
  
  getAnalyticsSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`${API_BASE}/analytics/summary${query ? `?${query}` : ''}`);
  },

  // ==================== SUPPORT CENTER ====================
  
  // Support Tickets
  createSupportTicket: (data) => apiRequest(`${API_BASE}/support/tickets`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getSupportTickets: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`${API_BASE}/support/tickets${query ? `?${query}` : ''}`);
  },
  
  getSupportTicket: (id) => apiRequest(`${API_BASE}/support/tickets/${id}`),
  
  updateSupportTicket: (id, data) => apiRequest(`${API_BASE}/support/tickets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  addSupportMessage: (id, data) => apiRequest(`${API_BASE}/support/tickets/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getSupportStats: () => apiRequest(`${API_BASE}/support/stats`),

  // ==================== SAMPLE DATA ====================
  
  // Sample Data Generation
  generateSampleData: (type) => apiRequest(`${API_BASE}/sample-data/${type}`, {
    method: 'POST',
  }),
  
  clearSampleData: (type) => apiRequest(`${API_BASE}/sample-data/${type}`, {
    method: 'DELETE',
  }),
  
  getSampleDataStatus: () => apiRequest(`${API_BASE}/sample-data/status`),
};

export default organizerApi;
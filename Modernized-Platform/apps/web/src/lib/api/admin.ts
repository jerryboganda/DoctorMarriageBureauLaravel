// Real-time Admin API for Doctor Marriage Bureau — 100% API-driven, no seed/mock.
// All data is fetched live from Go API (/api/v1/admin/*). No localStorage seed fallback.

import { api } from './client';

export interface AdminDoctor {
  id: number;
  user_id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: 'male' | 'female';
  age: number;
  degree: string;
  speciality: string;
  sub_speciality?: string;
  hospital: string;
  city_name: string;
  country_name: string;
  pmdc_number: string;
  pmdc_status: 'verified' | 'pending' | 'rejected' | 'unverified';
  pmdc_document_url?: string;
  package_id: number;
  package_name: string;
  status: 'active' | 'suspended' | 'pending';
  photo_approved: boolean;
  avatar: string;
  created_at: string;
  last_active: string;
  admin_notes?: string;
  marital_status: string;
  religion: string;
  caste: string;
  height_cm: number;
  about: string;
}

export interface AdminVerification {
  id: number;
  doctor_id: number;
  doctor_name: string;
  avatar: string;
  speciality: string;
  hospital: string;
  city: string;
  pmdc_number: string;
  document_type: 'PMDC License Card' | 'PMC Certificate' | 'GMC Full Registration' | 'Specialist Board Dip';
  document_url: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface AdminPayment {
  id: number;
  doctor_id: number;
  doctor_name: string;
  doctor_email: string;
  avatar: string;
  package_id: number;
  package_name: string;
  amount_pkr: number;
  payment_method: 'Bank Transfer' | 'EasyPaisa' | 'JazzCash' | 'Stripe / Card' | 'Bank Alfalah';
  transaction_id: string;
  proof_image: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  admin_notes?: string;
  reviewed_at?: string;
}

export interface AdminProposal {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar: string;
  sender_specialty: string;
  sender_city: string;
  recipient_id: number;
  recipient_name: string;
  recipient_avatar: string;
  recipient_specialty: string;
  recipient_city: string;
  status: 'pending' | 'accepted' | 'declined' | 'family_contact_exchanged';
  match_percentage: number;
  created_at: string;
  notes?: string;
}

export interface AdminPackage {
  id: number;
  name: string;
  tagline: string;
  price_pkr: number;
  duration_days: number;
  proposal_quota: number;
  contact_unlocks: number;
  badge_color: string;
  is_featured: boolean;
  is_active: boolean;
  perks: string[];
}

export interface AdminTicket {
  id: number;
  ticket_number: string;
  reporter_id: number;
  reporter_name: string;
  reporter_email: string;
  reported_id?: number;
  reported_name?: string;
  type: 'Harassment Report' | 'Fake PMDC Claim' | 'Payment Issue' | 'Account Dispute' | 'Technical Support';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  created_at: string;
  admin_resolution?: string;
}

export interface AdminHappyStory {
  id: number;
  couple_title: string;
  groom_name: string;
  groom_specialty: string;
  bride_name: string;
  bride_specialty: string;
  marriage_date: string;
  city: string;
  story: string;
  photo_url: string;
  status: 'approved' | 'pending' | 'rejected';
  created_at: string;
  is_featured: boolean;
}

export interface AdminSystemSettings {
  specialties: string[];
  cities: string[];
  hospitals: string[];
  sects: string[];
  castes: string[];
  maintenance_mode: boolean;
  auto_approve_pmdc: boolean;
  emergency_notice: string;
  contact_phone: string;
  contact_email: string;
  contact_whatsapp: string;
}

export interface AdminStats {
  totalDoctors: number;
  verifiedDoctors: number;
  verifiedPercentage: number;
  totalRevenuePkr: number;
  pendingVerifications: number;
  pendingPayments: number;
  activeProposals: number;
  openTickets: number;
}

function unwrap<T>(res: { data?: { data?: T; message?: string } } & { data?: T }): T {
  // Go API wraps as { success:true, data:... }; axios as res.data.data
  const d: any = res?.data;
  if (d && typeof d === 'object' && 'data' in d && d.data !== undefined) return d.data as T;
  return d as T;
}

export const AdminStore = {
  // Stats — GET /admin/stats
  async getStats(): Promise<AdminStats> {
    const res = await api.get('/admin/stats');
    return unwrap<AdminStats>(res);
  },

  // Doctors — GET /admin/doctors, GET /admin/doctors/:id
  async getDoctors(): Promise<AdminDoctor[]> {
    const res = await api.get('/admin/doctors');
    return unwrap<AdminDoctor[]>(res) ?? [];
  },
  async getDoctorById(id: number): Promise<AdminDoctor | undefined> {
    try {
      const res = await api.get(`/admin/doctors/${id}`);
      return unwrap<AdminDoctor>(res);
    } catch {
      return undefined;
    }
  },
  async saveDoctor(doctor: AdminDoctor): Promise<void> {
    if (doctor.id) {
      await api.put(`/admin/doctors/${doctor.id}`, doctor);
    } else {
      await api.post('/admin/doctors', doctor);
    }
  },
  async updateDoctorStatus(id: number, status: 'active' | 'suspended' | 'pending'): Promise<void> {
    await api.patch(`/admin/doctors/${id}/status`, { status });
  },
  async deleteDoctor(id: number): Promise<void> {
    await api.delete(`/admin/doctors/${id}`);
  },

  // Verifications — GET /admin/verifications
  async getVerifications(status?: string): Promise<AdminVerification[]> {
    const url = status && status !== 'all' ? `/admin/verifications?status=${encodeURIComponent(status)}` : '/admin/verifications';
    const res = await api.get(url);
    return unwrap<AdminVerification[]>(res) ?? [];
  },
  async reviewVerification(id: number, status: 'approved' | 'rejected', reason?: string): Promise<void> {
    await api.post(`/admin/verifications/${id}/review`, { status, reason });
  },

  // Payments — GET /admin/payments
  async getPayments(): Promise<AdminPayment[]> {
    const res = await api.get('/admin/payments');
    return unwrap<AdminPayment[]>(res) ?? [];
  },
  async reviewPayment(id: number, status: 'approved' | 'rejected', adminNotes?: string): Promise<void> {
    await api.post(`/admin/payments/${id}/review`, { status, admin_notes: adminNotes });
  },

  // Proposals — GET /admin/proposals
  async getProposals(): Promise<AdminProposal[]> {
    const res = await api.get('/admin/proposals');
    return unwrap<AdminProposal[]>(res) ?? [];
  },

  // Packages — GET /admin/packages
  async getPackages(): Promise<AdminPackage[]> {
    const res = await api.get('/admin/packages');
    return unwrap<AdminPackage[]>(res) ?? [];
  },
  async savePackage(pkg: AdminPackage): Promise<void> {
    if (pkg.id && pkg.id > 0 && pkg.id < 100000) {
      // Heuristic: existing packages have small DB IDs (1,3); new local IDs are Date.now()
      try {
        await api.put(`/admin/packages/${pkg.id}`, pkg);
        return;
      } catch {
        // fall through to create
      }
    }
    await api.post('/admin/packages', pkg);
  },
  async deletePackage(id: number): Promise<void> {
    await api.delete(`/admin/packages/${id}`);
  },

  // Tickets — GET /admin/tickets
  async getTickets(): Promise<AdminTicket[]> {
    const res = await api.get('/admin/tickets');
    return unwrap<AdminTicket[]>(res) ?? [];
  },
  async resolveTicket(id: number, status: 'resolved' | 'dismissed' | 'in_progress', resolution?: string): Promise<void> {
    await api.post(`/admin/tickets/${id}/resolve`, { status, resolution });
  },

  // Happy Stories — GET /admin/happy-stories
  async getHappyStories(): Promise<AdminHappyStory[]> {
    const res = await api.get('/admin/happy-stories');
    return unwrap<AdminHappyStory[]>(res) ?? [];
  },
  async reviewHappyStory(id: number, status: 'pending' | 'approved' | 'rejected', isFeatured = false): Promise<void> {
    await api.post(`/admin/happy-stories/${id}/review`, { status, is_featured: isFeatured });
  },

  // Settings — GET /admin/settings, PUT /admin/settings
  async getSettings(): Promise<AdminSystemSettings> {
    const res = await api.get('/admin/settings');
    return unwrap<AdminSystemSettings>(res);
  },
  async saveSettings(settings: AdminSystemSettings): Promise<void> {
    await api.put('/admin/settings', settings);
  },
};

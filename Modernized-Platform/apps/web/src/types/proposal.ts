export interface ProposalProfile {
  id: number | string;
  gender: 'male' | 'female' | string;
  age: number | string;
  city: string;
  country?: string;
  profession: string;
  education: string;
  specialization?: string;
  height?: string;
  marital_status?: string;
  sect?: string;
  blurred_photo_url?: string;
  created_at?: string;
}

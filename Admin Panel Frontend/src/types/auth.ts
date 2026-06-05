export interface AdminUser {
    id: number;
    name: string;
    first_name?: string;
    last_name?: string;
    email: string;
    user_type: 'admin' | 'staff';
    avatar?: string | null;
    permissions: string[];
}

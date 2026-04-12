export type UserRole = 'SUPERVISOR' | 'ADMIN' | 'COMMERCIAL' | 'AGENT';

export interface AuthUser {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    tenantId: number | null;
    hotelIds: number[];
}

export interface LoginResponse {
    accessToken: string;
    user: AuthUser;
}

export interface UserListItem {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    hotels: { id: number; name: string }[];
}

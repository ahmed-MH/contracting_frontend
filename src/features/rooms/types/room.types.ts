import type { AuditMetadata } from '../../../types/audit';

export type RoomInventoryType = 'STANDARD' | 'PROMO';

export interface RoomType extends AuditMetadata {
    id: number;
    reference?: string;
    code: string;
    name: string;
    inventoryType: RoomInventoryType;
    minOccupancy: number;
    maxOccupancy: number;
    minAdults: number;
    maxAdults: number;
    minChildren: number;
    maxChildren: number;
    allowCotOverMax: boolean;
}

export interface CreateRoomTypePayload {
    code: string;
    name: string;
    inventoryType?: RoomInventoryType;
    minOccupancy: number;
    maxOccupancy: number;
    minAdults: number;
    maxAdults: number;
    minChildren: number;
    maxChildren: number;
    allowCotOverMax?: boolean;
}

export type UpdateRoomTypePayload = Partial<CreateRoomTypePayload>;

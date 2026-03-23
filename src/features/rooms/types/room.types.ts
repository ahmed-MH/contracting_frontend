export interface RoomType {
    id: number;
    reference?: string;
    code: string;
    name: string;
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
    minOccupancy: number;
    maxOccupancy: number;
    minAdults: number;
    maxAdults: number;
    minChildren: number;
    maxChildren: number;
    allowCotOverMax?: boolean;
}

export type UpdateRoomTypePayload = Partial<CreateRoomTypePayload>;

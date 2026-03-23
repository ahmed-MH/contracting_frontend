export interface PageMeta {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
}

export interface PaginatedResult<T> {
    data: T[];
    meta: PageMeta;
}

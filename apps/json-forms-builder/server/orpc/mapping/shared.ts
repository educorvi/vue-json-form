import { FindOptionsOrderValue } from 'typeorm';

export type ApiSortOrder = 'asc' | 'desc';

const MAP_API_SORT_ORDER_TO_DB: Record<ApiSortOrder, FindOptionsOrderValue> = {
    asc: 'ASC',
    desc: 'DESC',
};

export function mapApiSortOrderToDbSortOrder(
    order: ApiSortOrder
): FindOptionsOrderValue {
    return MAP_API_SORT_ORDER_TO_DB[order];
}

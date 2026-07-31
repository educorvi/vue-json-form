import type { FindOptionsOrderValue } from 'typeorm';
import { Visibility } from '~~/server/db/entities/BaseEntities';
import { z } from 'zod';
import { zVisibility } from '../generated/zod.gen';

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

export type ApiVisibility = z.infer<typeof zVisibility>;

const MAP_DB_VISIBILITY_TO_API: Record<Visibility, ApiVisibility> = {
    [Visibility.Visible]: 'visible',
    [Visibility.Private]: 'private',
};

const MAP_API_VISIBILITY_TO_DB: Record<ApiVisibility, Visibility> = {
    visible: Visibility.Visible,
    private: Visibility.Private,
};

export function mapVisibilityToApi(visibility: Visibility): ApiVisibility {
    return MAP_DB_VISIBILITY_TO_API[visibility];
}

export function mapVisibilityToDb(visibility: ApiVisibility): Visibility {
    return MAP_API_VISIBILITY_TO_DB[visibility];
}

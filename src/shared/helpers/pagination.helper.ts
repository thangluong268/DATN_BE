export class QueryPagingHelper {
  static queryPaging({ page, limit }): {
    skip: number;
    limit: number;
  } {
    if (!page) page = 1;
    if (!limit) limit = 10;
    return {
      skip: Number((page - 1) * limit),
      limit: Number(limit),
    };
  }
}

export class QueryPagingHelper {
  static queryPaging({ page, limit }): {
    skip: number;
    limit: number;
  } {
    if (!page) page = 1;
    if (!limit) limit = 5;
    return {
      skip: (page - 1) * limit,
      limit,
    };
  }
}

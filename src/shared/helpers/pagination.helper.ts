export class QueryPagingHelper {
  static queryPaging({ pageSize, pageNumber }): {
    take?: number;
    skip?: number;
  } {
    if (!pageNumber || !pageSize) return {};
    return {
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    };
  }
}

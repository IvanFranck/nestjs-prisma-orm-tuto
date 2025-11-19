export type PaginationInterface<T> = {
  data: T;
  meta: {
    total: number;
    page: number;
  };
};

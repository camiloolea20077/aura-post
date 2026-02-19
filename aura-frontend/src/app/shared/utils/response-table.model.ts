export declare class ResponseTableModel<T> {
    status: number;
    message: string;
    data: Data<T>;
    error: boolean;
    constructor(message: string, error: boolean, status: number, data: Data<T>);
}
declare class Data<T> {
    content: [T];
    pageable: Pageable;
    totalPages: number;
    totalElements: number;
    last: boolean;
    size: number;
    number: number;
    sort: Sort;
    numberOfElements: number;
    first: boolean;
    empty: boolean;
    constructor(content: [T], pageable: Pageable, totalPages: number, totalElements: number, last: boolean, size: number, number: number, sort: Sort, numberOfElements: number, first: boolean, empty: boolean);
}
declare class Pageable {
    sort: Sort;
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;
    constructor(sort: Sort, offset: number, pageNumber: number, pageSize: number, paged: boolean, unpaged: boolean);
}
declare class Sort {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
    constructor(empty: boolean, sorted: boolean, unsorted: boolean);
}
export {};

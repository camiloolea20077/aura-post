export declare class ResponseModel<T> {
    code: string;
    message: string;
    error: boolean;
    status: number;
    data: T;
    constructor(code: string, message: string, error: boolean, status: number, data: T);
}

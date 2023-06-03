export interface IBaseAlchemyResponse {
    id: number;
    jsonRpc: string;
    method: string;
    error: IAlchemyBaseError
}

export interface IAlchemyBaseError {
    message: string
}
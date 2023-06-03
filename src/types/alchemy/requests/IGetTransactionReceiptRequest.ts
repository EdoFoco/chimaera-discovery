import { IBaseAlchemyRequest } from "./IBaseAlchemyRequest";

export interface IGetTransactionReceiptRequest extends IBaseAlchemyRequest {
    params: string[]
}
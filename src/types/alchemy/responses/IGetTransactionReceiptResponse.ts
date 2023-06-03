import { TransactionResponse } from "ethers";
import { IBaseAlchemyResponse } from "./IBaseAlchemyResponse";

export interface IGetTransactionResponse extends IBaseAlchemyResponse{
    result: TransactionResponse
}
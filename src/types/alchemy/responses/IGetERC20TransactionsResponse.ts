import { IAlchemySwapTransaction } from "..";
import { IBaseAlchemyResponse } from "./IBaseAlchemyResponse";

export interface IGetERC20TransactionResponse extends IBaseAlchemyResponse {
    result: IGetERC20TransactionsResult;
}

export interface IGetERC20TransactionsResult {
    transfers: IAlchemySwapTransaction[];
    pageKey: string | undefined;
}
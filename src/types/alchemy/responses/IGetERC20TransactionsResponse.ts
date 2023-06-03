import { IAlchemySwapTransaction } from "..";

export interface IGetERC20TransactionResponse {
    id: Number;
    jsonRpc: String;
    method: String;
    result: IGetERC20TransactionsResult
}

export interface IGetERC20TransactionsResult {
    transfers: IAlchemySwapTransaction[];
    pageKey: string | undefined;
}
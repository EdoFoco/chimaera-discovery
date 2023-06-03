import { ITokenBalance } from "../../ITokenBalance";
import { IBaseAlchemyResponse } from "./IBaseAlchemyResponse";

export interface IGetTokenBalanceResponse extends IBaseAlchemyResponse {
    result: IGetTokenBalanceResult;
}

export interface IGetTokenBalanceResult{
    address: string;
    tokenBalances: ITokenBalance[];
    pageKey: string | undefined;
}
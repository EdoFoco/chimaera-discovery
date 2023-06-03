import { IBaseAlchemyRequest } from "./IBaseAlchemyRequest";

export interface IGetERC20TransactionsRequest extends IBaseAlchemyRequest{
     params: IGetERC20TransactionsParams
}

export interface IGetERC20TransactionsParams {
     order: string;
     fromBlock: string;
     toBlock: string;
     fromAddress: string;
     toAddress: string;
     contractAddresses: string[] | undefined;
     category: string[];
     withMetadata: boolean;
     maxCount: string;
     pageKey: string | undefined;
}
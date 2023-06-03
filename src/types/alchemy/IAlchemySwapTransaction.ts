import { ISwapTransaction } from "../ISwapTransaction";

export interface IAlchemySwapTransaction extends ISwapTransaction{
    hash: string;
    from: string;
    to: string;
    value: number;
    asset: string;
    category: string;
    rawContract: IAlchemySwapTransactionRawContract;
}

export interface IAlchemySwapTransactionRawContract{
    value: string;
    address: string;
    decimal: string;
}

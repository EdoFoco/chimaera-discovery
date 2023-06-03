export enum OperationType {
    BUY,
    SELL
}

export interface ISwapTransactionMetadata {
    blockTimestamp: string;
}

export interface ISwapTransaction {
    hash: string;
    blockNum: number;
    function: string;
    recipient: string;
    amountIn: string;
    amountOut: string;
    path: string[];
    operation: OperationType;
    from: string;
    to: string;
    metadata: ISwapTransactionMetadata;
    rawContract: RawContract;
}

export class RawContract{
    value: string;
    address: string;
    decimal: string;
}

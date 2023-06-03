import { ISwapTransaction } from "./ISwapTransaction";
import { ITokenMetadata } from "./ITokenMetadata";

export enum SwapStatus {
    OPEN,
    CLOSED
}

export class SwapPosition {
    pairHash: string;
    token1: ITokenMetadata;
    token2: ITokenMetadata;
    invested: string;
    withdrew: string;
    profitLoss: string;
    bought: string;
    sold: string;
    moonBag: string;
    transactions: ISwapTransaction[];
    status: SwapStatus;

    constructor(pairHash: string, token1: ITokenMetadata, token2: ITokenMetadata) {
        this.pairHash = pairHash;
        this.token1 = token1;
        this.token2 = token2;
        this.invested = "0";
        this.sold = "0";
        this.withdrew = "0";
        this.bought = "0";
        this.profitLoss = "0";
        this.moonBag = "0";
        this.status = SwapStatus.OPEN;
        this.transactions = [];
    }
}
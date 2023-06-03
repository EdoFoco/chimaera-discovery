import { SwapPosition } from "./SwapPosition";

export interface IWallet {
    address: string;
    wonTrades: number;
    lossTrades: number;
    swaps: Record<string, SwapPosition>;
    boughtTokensCount: number;
    boughtTokens: Record<string, Date>;
    tokensHeld: Set<string> | undefined;
}
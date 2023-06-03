import { ISwapTransaction, IWallet, SwapPosition, ITokenMetadata } from "../../types";

export interface IWalletRepository {
    get(walletAddress: string): Promise<IWallet>;
    add(wallet: IWallet): Promise<IWallet>;
    addSwapTransaction(pairHash: string, walletAddress: string, token1: ITokenMetadata, 
        token2: ITokenMetadata, transaction: ISwapTransaction): Promise<IWallet>;
    updateSwapPosition(walletAddress: string, swapPosition: SwapPosition): Promise<IWallet>;
}
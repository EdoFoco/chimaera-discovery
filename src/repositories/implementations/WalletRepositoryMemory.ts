import { Service } from "typedi";
import { SwapPosition, ITokenMetadata, IWallet, ISwapTransaction } from "../../types";
import { IWalletRepository } from "../interfaces";

@Service()
export class WalletRepositoryMemory implements IWalletRepository{
    wallets: Record<string, IWallet> = {};

    async get(walletAddress: string): Promise<IWallet> {
        return this.wallets[walletAddress];
    }

    async add(wallet: IWallet): Promise<IWallet>{
        if(!(wallet.address in this.wallets)){
            this.wallets[wallet.address] = wallet;
        }
        return this.wallets[wallet.address];
    }

    async addSwapTransaction(pairHash: string, walletAddress: string, token1: ITokenMetadata, token2: ITokenMetadata,
        transaction: ISwapTransaction): Promise<IWallet> {

        if(!(walletAddress in this.wallets)) throw ("Wallet not found");

        const wallet = this.wallets[walletAddress];
        if(!(pairHash in wallet.swaps)){
            wallet.swaps[pairHash] = new SwapPosition(pairHash, token1, token2);
        }
        
        const swap = wallet.swaps[pairHash];
        const existingTxns = swap.transactions.filter((tx) => tx.hash === transaction.hash)
        if(existingTxns.length > 0) return wallet;

        swap.transactions.push(transaction);
        return wallet;
    }

    async updateSwapPosition(walletAddress: string, swapPosition: SwapPosition): Promise<IWallet> {
        if(!(walletAddress in this.wallets)) throw ("Wallet not found");

        const wallet = this.wallets[walletAddress];
        if(!(swapPosition.pairHash in wallet.swaps)) throw ("Swap position not found")
        
        this.wallets[walletAddress].swaps[swapPosition.pairHash] = swapPosition;
        return wallet;
    }
}
import { TransactionResponse } from "ethers";
import { ITokenMetadata, ITokenBalance, ISwapTransaction } from "../../types";

export interface INodeClient {
    getIncomingERC20Transactions(walletAddress : string, contractAddresses: string[] | undefined, 
        fromBlock: string | undefined, toBlock: string | undefined, 
        order: string): Promise<ISwapTransaction[]>;
    getIncomingERC20TransactionsForTokens(contractAddresses : string[], 
        toAddress: string | undefined, order: string, fromBlock: string | undefined, 
        toBlock: string | undefined, maxCount: number | undefined): Promise<ISwapTransaction[]>;
    getTransactionReceipt(txnHash: string): Promise<TransactionResponse>;
    getTokenMetadata(address: string): Promise<ITokenMetadata>;
    getTokeBalancesForWallet(address: string): Promise<ITokenBalance[]>;
}
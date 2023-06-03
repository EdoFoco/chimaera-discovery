import { Inject, Service } from "typedi";
import { TransactionResponse } from "ethers";
import { BigNumber } from "alchemy-sdk";
import { BaseClient } from "./BaseClient";
import { INodeClient } from "../interfaces";
import { ISwapTransaction, ITokenMetadata, ITokenBalance } from "../../types";
import { 
    IGetERC20TransactionResponse, 
    IGetTokenMetadataResponse,
    IGetTokenBalanceResponse, 
    IGetERC20TransactionsParams, 
    IGetTransactionResponse, 
    IGetTransactionReceiptRequest,
    IGetERC20TransactionsRequest,
    IGetTokenBalanceRequest,
    IGetTokenMetadataRequest } from "../../types/alchemy";
    
@Service()
export class AlchemyClient extends BaseClient implements INodeClient {
    private readonly url: string;

    constructor(@Inject("nodeUrl") url: string) {
        super();
        this.url = url;
    }

    async getIncomingERC20Transactions(walletAddress : string, contractAddresses: string[] | undefined, 
        fromBlock: string | undefined = undefined, toBlock: string | undefined = undefined, 
        order: string = 'desc'): Promise<ISwapTransaction[]> {
        
        fromBlock = fromBlock ? BigNumber.from(fromBlock).toHexString() : '0x0';
        toBlock = toBlock ? BigNumber.from(fromBlock).toHexString() : 'latest';
        
        const transfers: ISwapTransaction[] = [];
        let pageKey = undefined;
        let isLastResult = false;
        while(!isLastResult){
            const request = <IGetERC20TransactionsRequest>{
                id: 1,
                jsonRpc: "2.0",
                method: "alchemy_getAssetTransfers",
                params: <IGetERC20TransactionsParams> {
                    category: ['erc20'],
                    fromAddress: walletAddress,
                    contractAddresses: contractAddresses,
                    fromBlock: fromBlock,
                    toBlock: toBlock,
                    withMetadata: true,
                    order,
                    maxCount: BigNumber.from(1000).toHexString(),
                    pageKey
                },
            }

            const response = await this.postData<IGetERC20TransactionResponse>(this.url, request);
            if(response.error)
                throw (`Alchemy Error: getIncomingERC20Transactions - ${response.error.message}`);
            
            if(response.result?.transfers)
                transfers.push(...response.result.transfers);
            pageKey = response.result?.pageKey;
            isLastResult = pageKey ? false : true;
        }
        return transfers;
    }

    async getIncomingERC20TransactionsForTokens(contractAddresses : string[], toAddress: string | undefined = undefined, 
        order: string = 'asc', fromBlock: string | undefined = undefined, 
        toBlock: string | undefined = undefined, 
        maxCount: number | undefined = 1000): 
        Promise<ISwapTransaction[]> {
            
        const maxCountBn = BigNumber.from(maxCount).toHexString();

        fromBlock = fromBlock ?? '0x0';
        toBlock = toBlock ?? 'latest';
        const request = <IGetERC20TransactionsRequest> {
            id: 1,
            jsonRpc: "2.0",
            method: "alchemy_getAssetTransfers",
            params: <IGetERC20TransactionsParams> {
                category: ['erc20'],
                contractAddresses: contractAddresses,
                fromBlock: fromBlock,
                toBlock: toBlock,
                withMetadata: true,
                order,
                maxCount: maxCountBn,
                toAddress: toAddress
            },
        }

        const response = await this.postData<IGetERC20TransactionResponse>(this.url, request);
        if(response.error)
            throw (`Alchemy Error: getIncomingERC20TransactionsForTokens - ${response.error.message}`);

        return response.result.transfers;
    }

    async getTransactionReceipt(txnHash: string): Promise<TransactionResponse> {
        const request = <IGetTransactionReceiptRequest>{
            id: 1,
            jsonRpc: "2.0",
            method: "eth_getTransactionByHash",
            params: [ txnHash ]
        }
        const response = await this.postData<IGetTransactionResponse>(this.url, request);
        return response.result;
    }

    async getTokenMetadata(address: string): Promise<ITokenMetadata> {
        const request = <IGetTokenMetadataRequest>{
            id: 1,
            jsonRpc: "2.0",
            method: "alchemy_getTokenMetadata",
            params: [ address ]
        }
       
        const response = await this.postData<IGetTokenMetadataResponse>(this.url, request);
        if(response.error)
            throw (`Alchemy Error: getTokenMetadata - ${response.error.message}`);

        return response.result;
    }

    async getTokeBalancesForWallet(address: string): Promise<ITokenBalance[]> {
        let pageKey = undefined;
        let isLastResult = false;
        
        const tokenBalances: ITokenBalance[] = [];
        while(!isLastResult){
            const request = <IGetTokenBalanceRequest> {
                id: 1,
                jsonRpc: "2.0",
                method: "alchemy_getTokenBalances",
                params: [ address, "erc20", { pageKey } ]
            }
    
            const response = await this.postData<IGetTokenBalanceResponse>(this.url, request);
            if(response.error)
                throw (`Alchemy Error: getTokeBalancesForWallet - ${response.error.message}`);

            tokenBalances.push(...response.result.tokenBalances);
            pageKey = response.result.pageKey;
            isLastResult = pageKey ? false : true;
        }
       
        return tokenBalances;
    }

}
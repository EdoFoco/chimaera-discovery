import { AlchemyClient } from "../clients";
import { TokenService } from "./TokenService";
import { Service, Inject } from "typedi";
import { BoughtTokenStats, IWallet } from "../types";
import * as fs from 'fs';
import { BigNumber } from "alchemy-sdk";

@Service()
export class HolderAnalyser{
    
    private readonly nodeClient: AlchemyClient;
    private readonly tokenService: TokenService;
    // private readonly uniswappishDecoder: UniswappishDecoder;
    // private readonly swapTransactionMapper: SwapTransactionMapper;
    private readonly baseTokens: Set<string>;
    private readonly uniswapAddresses: Set<string>;
    constructor(nodeClient: AlchemyClient, tokenService: TokenService, 
        // uniswappishDecoder: UniswappishDecoder, swapTransactionMapper: SwapTransactionMapper, 
        @Inject('baseTokenAddresses') baseTokens: string[]) {
        this.nodeClient = nodeClient;
        this.tokenService = tokenService;
        // this.uniswappishDecoder = uniswappishDecoder;
        // this.swapTransactionMapper = swapTransactionMapper;
        this.baseTokens = new Set<string>();
        this.uniswapAddresses = new Set<string>();
        this.uniswapAddresses.add("0x877193009a881359e80df3ded7c6e055be9cc144");
        this.uniswapAddresses.add("0x21d5996bbc760627d71f857f321249b61da96351");

        baseTokens.forEach((t) => { if(!(this.baseTokens.has(t))) this.baseTokens.add(t)}); // create hashset of base tokens addresses
    }

    async getCommonHolderForTokens(tokenAddresses: string[], scoreMin: number, maxTransactionPerToken: number = 1000) {
        // Foreach token get all wallet transactions for token, save token, save who bought first
        // Find cluster winner (who bought first)
        const wallets: Record<string, IWallet> = {};
         
        for(let i = 0; i < tokenAddresses.length; i++){
            const t = tokenAddresses[i];
            console.log(`Analysing token: ${t}`);
            if(this.baseTokens.has(t)) continue; // skip base tokens

            await this.tokenService.getOrAddToken(t);
        }

        const tokens = await this.tokenService.getTokens(tokenAddresses);

        for(let i = 0; i < tokens.length; i++){
            const t = tokens[i].address;
            if(this.baseTokens.has(t)) continue; // skip base tokens

            const token = await this.tokenService.getOrAddToken(t);
            const transactions = await this.nodeClient.getIncomingERC20TransactionsForTokens([token.address], undefined, undefined, undefined, undefined, maxTransactionPerToken);

            const holderAddress = new Set<string>();

            for(let k = 0; k < transactions.length; k++){
                const txn = transactions[k];
                if((this.uniswapAddresses.has(txn.to))) continue;
                if(holderAddress.has(txn.from)) continue; // skip if we have already processed this holder
            
                holderAddress.add(txn.from);

                if(txn.from in wallets){
                    wallets[txn.from].boughtTokens[token.address] = new Date(txn.metadata.blockTimestamp);
                    wallets[txn.from].boughtTokensCount += 1;
                }
                else{
                    wallets[txn.from] = <IWallet>{
                        address: txn.from,
                        boughtTokensCount: 1,
                        boughtTokens: {},
                    }
                    wallets[txn.from].boughtTokens[token.address] =  new Date(txn.metadata.blockTimestamp);
                }
            }
        }

        let commonWallets: IWallet[] = [];
        const walletKeys = Object.keys(wallets);
        for(let i = 0; i < walletKeys.length; i++){
            const wallet = wallets[walletKeys[i]];
            if(!wallet.boughtTokens) continue;
            if(Object.keys(wallet.boughtTokens).length >= scoreMin){
                commonWallets.push(wallet);
            }
        }

        commonWallets = commonWallets.sort((a,b) => a.boughtTokensCount > b.boughtTokensCount ? -1 : 1 );
        fs.writeFile('common_holders_for_tokens.json', JSON.stringify(commonWallets,null, 2), 'utf8', () => console.log('done!'));
        // console.log(commonWallets);
    }
    
    async getCommonTokenBuysV2(walletAddresses: string[], minTokens: number, buyTrigger: number, fromBlock: number = 16884955) {
        console.log(fromBlock);
        // Get all token balances per wallet
        // const wallets: Wallet[] = [];
        const wallets: Record<string, IWallet> = {};
        const tokensBought: Record<string, number> = {};
        for(let i = 0; i < walletAddresses.length; i++){
            const wallet = <IWallet>{
                address: walletAddresses[i],
                tokensHeld: new Set<string>(),
                boughtTokens: {}
            };

            const tBalances = await this.nodeClient.getTokeBalancesForWallet(walletAddresses[i]);
            tBalances.forEach((t) => {
                if(!(wallet.tokensHeld?.has(t.contractAddress))) wallet.tokensHeld?.add(t.contractAddress);
                if(t.contractAddress in tokensBought){
                    tokensBought[t.contractAddress] += 1;
                }
                else{
                    tokensBought[t.contractAddress] = 1;
                    wallet.tokensHeld?.add(t.contractAddress);
                }
            });

            wallets[wallet.address] = wallet;
        }

        // Filter out the ones in common
        const commonTokens: any[] = [];
        Object.keys(tokensBought).forEach((t) => {
            if(tokensBought[t] >= minTokens){
                commonTokens.push({tokenAddress: t, count: tokensBought[t]});
            }
        });
        

        // Get the transactions for those tokens
        const commonTokenAddresses = commonTokens.map((t) => t.tokenAddress);
        for(let i = 0; i < walletAddresses.length; i++){
            const wallet = wallets[walletAddresses[i]];
            const walletCommonTokens: string[] = [];
            commonTokenAddresses.forEach((t) => {
                if(wallets[wallet.address].tokensHeld?.has(t)){
                    walletCommonTokens.push(t);
                }
            })

            console.log("Count ", walletCommonTokens.length);
            let tTxns = await this.nodeClient.getIncomingERC20Transactions(wallet.address, walletCommonTokens, undefined, undefined, "asc");
            tTxns = tTxns.sort((a,b) => a.blockNum < b.blockNum ? -1 : 1);
            tTxns.forEach((t) => {
                if(t.rawContract.address in wallet.boughtTokens){
                    if(wallet.boughtTokens[t.rawContract.address] > new Date(t.metadata.blockTimestamp)){
                        wallet.boughtTokens[t.rawContract.address] = new Date(t.metadata.blockTimestamp);
                    }
                }
                else{
                    wallet.boughtTokens[t.rawContract.address] = new Date(t.metadata.blockTimestamp);
                }
            });

            wallets[wallet.address] = wallet;
        }

        let topBoughtTokens: BoughtTokenStats[] = [];
        for(let i = 0; i < commonTokens.length; i++){
            const token = <BoughtTokenStats>{
                address: commonTokens[i].tokenAddress,
                holdersCount: 0,
                firstBoughtAt: new Date(2500, 1, 1),
                buyTriggeredAt: new Date(2500, 1, 1),
                lastBoughtAt: new Date(100, 1, 1),
                holders: [],
                lastBuyer: "",
                holdersWithDates: [],
            };
            
            // Create list of wallet and bought at
            const walletsThatBought: any[] = [];
            Object.keys(wallets).forEach((wAddress) => {
                if(!(token.address in wallets[wAddress].boughtTokens)) return;
                walletsThatBought.push({"wallet": wAddress, "boughtAt": wallets[wAddress].boughtTokens[token.address]});
            });

            // Sort by boughtAt to see who bought first
            walletsThatBought.sort((a, b) =>  a.boughtAt < b.boughtAt ? -1 : 1);
            walletsThatBought.forEach((w) => {
                const wAddress = w.wallet;
                if(!(token.address in wallets[wAddress].boughtTokens)) return;

                token.holdersCount += 1;
                token.holders.push(wAddress);
                const boughtAt = wallets[wAddress].boughtTokens[token.address];
                const holderWithDate: Record<string, Date> = {};
                holderWithDate[wAddress] = boughtAt;
                token.holdersWithDates.push(holderWithDate);
                
                // if this buy happened before the current first buy at value, replace
                if(boughtAt < token.firstBoughtAt){
                    token.firstBoughtAt = boughtAt;
                }
                
                // if this buy happened after the current last buy at value and this is less then the 3rd wallet that bought, replace
                if(boughtAt > token.lastBoughtAt){
                    token.lastBoughtAt = boughtAt;
                    token.lastBuyer = wAddress;
                }

                // if this buy is has triggered a buy operation
                if(token.holdersCount >= buyTrigger && boughtAt < token.buyTriggeredAt!){
                    token.buyTriggeredAt = boughtAt;
                }

            });

            topBoughtTokens.push(token);
        }

        topBoughtTokens = topBoughtTokens.filter((t) => t.holdersCount >= minTokens && t.buyTriggeredAt < new Date(2023, 6, 1)).sort((a,b) => a.buyTriggeredAt > b.buyTriggeredAt ? -1 : 1);
        fs.writeFile('common_tokens_per_wallet.json', JSON.stringify(topBoughtTokens,null, 2), 'utf8', () => console.log('exported to common_tokens_per_wallet.json'));
    }

    async getCommonTokenBuys(walletAddresses: string[], fromBlock: number = 16884955) {
        const fromBlockStr = BigNumber.from(fromBlock);

        const tokenMap: Set<string> = new Set<string>();
        const tokens: string[] = [];
        const walletMap: Record<string, IWallet> = {};
        for(let i = 0; i < walletAddresses.length; i++){
            const wallet = <IWallet>{
                address: walletAddresses[i].toLocaleLowerCase(),
                boughtTokensCount: 0,
                boughtTokens: {}
            };
            
            console.log(`Getting tokens for wallet: ${wallet.address}`);
            const txns = await this.nodeClient.getIncomingERC20Transactions(walletAddresses[i],undefined, fromBlockStr.toHexString());
            for(let k = 0; k < txns.length; k++){
                if(this.baseTokens.has(txns[k].rawContract.address.toLowerCase())) continue; // skip base tokens
                if(!(txns[k].rawContract.address in wallet.boughtTokens)){
                    wallet.boughtTokens[txns[k].rawContract.address] = new Date(txns[k].metadata.blockTimestamp);
                    if(!(tokenMap.has(txns[k].rawContract.address))){
                        tokenMap.add(txns[k].rawContract.address);
                        tokens.push(txns[k].rawContract.address);
                    }
                }
            }

            walletMap[wallet.address] = wallet;
        }

        const commonTokens: BoughtTokenStats[] = [];
        for(let i = 0; i < tokens.length; i++){
            const token = <BoughtTokenStats>{
                address: tokens[i],
                holdersCount: 0,
                firstBoughtAt: new Date(2500, 1, 1),
                lastBoughtAt: new Date(100, 1, 1),
                holders: [],
                lastBuyer: "",
                holdersWithDates: [],
                buyTriggeredAt: new Date(2500, 1, 1),
            };
            
            for(let k = 0; k < walletAddresses.length; k++){
                const wAddress = walletAddresses[k].toLocaleLowerCase();
                
                if(!(token.address in walletMap[wAddress].boughtTokens)) continue;
                
                token.holdersCount += 1;
                token.holders.push(wAddress);
                const boughtAt = walletMap[wAddress].boughtTokens[token.address];
                const holderWithDate: Record<string, Date> = {};
                holderWithDate[wAddress] = boughtAt;
                token.holdersWithDates.push(holderWithDate);

                // if this buy happened before the current first buy at value, replace
                if(boughtAt < token.firstBoughtAt){
                    token.firstBoughtAt = boughtAt;
                }
                
                // if this buy happened after the current last buy at value and this is less then the 3rd wallet that bought, replace
                if(boughtAt > token.lastBoughtAt && token.holdersCount < 3){
                    token.lastBoughtAt = boughtAt;
                    token.lastBuyer = wAddress;
                }
            }

            commonTokens.push(token);
        }
        console.log('\n\n\n\nDONE\n\n\n\n');
        let winners = commonTokens.filter((t) => t.holdersCount > 1);
        winners = commonTokens.sort((a,b) => a.holdersCount > b.holdersCount ? -1 : 1 );
        fs.writeFile('common_results.json', JSON.stringify(winners,null, 2), 'utf8', console.log);
    }
}
import * as fs from 'fs';
import { Service, Inject } from "typedi";
import { AlchemyClient } from "../clients";
import { TokenService } from "./TokenService";
import { BoughtTokenStats, IWallet } from "../types";

@Service()
export class HolderAnalyser{
    private readonly nodeClient: AlchemyClient;
    private readonly tokenService: TokenService;
    private readonly baseTokens: Set<string>;
    private readonly uniswapAddresses: Set<string>;
    constructor(nodeClient: AlchemyClient, tokenService: TokenService, 
        @Inject('baseTokenAddresses') baseTokens: string[]) {
        this.nodeClient = nodeClient;
        this.tokenService = tokenService;
        this.baseTokens = new Set<string>();
        this.uniswapAddresses = new Set<string>();
        this.uniswapAddresses.add("0x877193009a881359e80df3ded7c6e055be9cc144");
        this.uniswapAddresses.add("0x21d5996bbc760627d71f857f321249b61da96351");

        // create hashset of base tokens addresses
        baseTokens.forEach((t) => { if(!(this.baseTokens.has(t))) this.baseTokens.add(t)}); 
    }

    async getCommonHoldersForTokens(tokenAddresses: string[], scoreMin: number, outputPath: string, maxTransactionPerToken: number = 1000) {
        // Foreach token get all wallet transactions for token, save token, save who bought first
        // Find cluster winner (who bought first)
        const wallets: Record<string, IWallet> = {};
         
        console.log(`\n[[ Chimaera Discovery ]] - Finding common holders.\n`)
        for(let i = 0; i < tokenAddresses.length; i++){
            const t = tokenAddresses[i];
            if(this.baseTokens.has(t)) continue; // skip base tokens

            await this.tokenService.getOrAddToken(t);
        }

        const tokens = await this.tokenService.getTokens(tokenAddresses);

        for(let i = 0; i < tokens.length; i++){
            console.log(`Analyzing token ${tokens[i].address}...`);

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
        fs.writeFile(outputPath, JSON.stringify(commonWallets,null, 2), 'utf8', () => console.log(`Done! Exporting to ${outputPath}`));
    }
    
    async getCommonTokenBuys(walletAddresses: string[], minTokens: number, buyTrigger: number, outputPath: string, fromBlock: number = 0) {
        console.log(`\n[[ Chimaera Discovery ]] - Finding common buy ops.\n`)

        // Get all token balances per wallet
        const wallets: Record<string, IWallet> = {};
        const tokensBought: Record<string, number> = {};
        for(let i = 0; i < walletAddresses.length; i++){
            console.log(`Getting token balances for wallet ${walletAddresses[i]}...`);
            const wallet = <IWallet>{
                address: walletAddresses[i],
                tokensHeld: new Set<string>(),
                boughtTokens: {}
            };

            const tBalances = await this.nodeClient.getTokeBalancesForWallet(walletAddresses[i]);
            tBalances.forEach((t) => {
                if(!(wallet.tokensHeld?.has(t.contractAddress.toLowerCase()))) wallet.tokensHeld?.add(t.contractAddress.toLowerCase());
                if(t.contractAddress.toLowerCase() in tokensBought){
                    tokensBought[t.contractAddress.toLowerCase()] += 1;
                }
                else{
                    tokensBought[t.contractAddress.toLowerCase()] = 1;
                    wallet.tokensHeld?.add(t.contractAddress.toLowerCase());
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
        
        // Get transactions for the common tokens
        const commonTokenAddresses = commonTokens.map((t) => t.tokenAddress);
        for(let i = 0; i < walletAddresses.length; i++){
            const wallet = wallets[walletAddresses[i]];
            const walletCommonTokens: string[] = [];
            commonTokenAddresses.forEach((t) => {
                if(wallets[wallet.address].tokensHeld?.has(t)){
                    walletCommonTokens.push(t);
                }
            })

            let tTxns = await this.nodeClient.getIncomingERC20Transactions(wallet.address, walletCommonTokens, fromBlock.toString(), undefined, "asc");
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
                
                // if this buy happened after the current last buy at value, replace
                if(boughtAt > token.lastBoughtAt){
                    token.lastBoughtAt = boughtAt;
                    token.lastBuyer = wAddress;
                }

                // if this buy has triggered a buy operation
                if(token.holdersCount >= buyTrigger && boughtAt < token.buyTriggeredAt!){
                    token.buyTriggeredAt = boughtAt;
                }
            });

            topBoughtTokens.push(token);
        }

        topBoughtTokens = topBoughtTokens.filter((t) => t.holdersCount >= minTokens && t.buyTriggeredAt < new Date(2023, 6, 1)).sort((a,b) => a.buyTriggeredAt > b.buyTriggeredAt ? -1 : 1);
        fs.writeFile(outputPath, JSON.stringify(topBoughtTokens,null, 2), 'utf8', () => console.log(`Done! Exporting to ${outputPath}`));
    }
}
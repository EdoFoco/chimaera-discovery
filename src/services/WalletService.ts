import { Service } from "typedi";
import { WalletRepositoryMemory } from "../repositories/implementations/WalletRepositoryMemory";
import { SwapPosition, ISwapTransaction, ITokenMetadata, IWallet, SwapStatus, OperationType } from "../types";
import { BigNumber } from "alchemy-sdk";

@Service()
export class WalletService {
    private readonly walletRepo: WalletRepositoryMemory;

    constructor(walletRepo: WalletRepositoryMemory) {
        this.walletRepo = walletRepo;
    }

    async addWallet(walletAddress: string): Promise<IWallet>{
        return await this.walletRepo.add(<IWallet> {
            address: walletAddress,
            wonTrades: 0,
            lossTrades: 0,
            swaps: {}
        });
    }

    async addSwapTransaction(pairHash: string, walletAddress: string, token1: ITokenMetadata, token2: ITokenMetadata,
         transaction: ISwapTransaction): Promise<IWallet>{
            const wallet =  await this.walletRepo.addSwapTransaction(pairHash, walletAddress, token1, token2, transaction);

            const swapsForPair = wallet.swaps[pairHash];
            const updatedSwap = this.buildSwapWithPerformance(swapsForPair);
            return await this.walletRepo.updateSwapPosition(walletAddress, updatedSwap);

    }       

    buildSwapWithPerformance(swap: SwapPosition): SwapPosition {
        let invested = BigNumber.from("0"); // in base token
        let withdrew = BigNumber.from("0"); // in base token
        let profitLoss = BigNumber.from("0"); // withdrew - invested (in base token)
        let bought = BigNumber.from("0");  // in tokens
        let sold = BigNumber.from("0"); // in tokens
        let moonBag = BigNumber.from("0"); // in tokens
        let status = SwapStatus.OPEN;

        const sortedTx = swap.transactions.sort((a, b) => (a.blockNum < b.blockNum ? -1 : 1 ));
        
        sortedTx.forEach((txn) => {
            if(txn.operation === OperationType.BUY){
                invested = invested.add(BigNumber.from(txn.amountIn));
                bought = bought.add(BigNumber.from(txn.amountOut));
            }
            else{
                withdrew = withdrew.add(BigNumber.from(txn.amountOut));
                sold = sold.add(BigNumber.from(txn.amountOut));
            }
        });

        profitLoss = withdrew.sub(invested);
        moonBag = bought.sub(sold);

        // Set status
        if(bought.gt(BigNumber.from("0")) && sold.gt(BigNumber.from("0"))){
            // If his moonbag is less than 10% of the total bought, then consider this a closed trade
            if(moonBag.div(bought).mul(BigNumber.from("100")).lte(BigNumber.from("10"))){
                status = SwapStatus.CLOSED;
            }
        }

        let updatedPosition: SwapPosition = { ...swap };
        updatedPosition.invested = invested.toString();
        updatedPosition.withdrew = withdrew.toString();
        updatedPosition.bought = bought.toString();
        updatedPosition.sold = sold.toString();
        updatedPosition.profitLoss = profitLoss.toString();
        updatedPosition.moonBag = moonBag.toString();
        updatedPosition.status = status;
        updatedPosition.transactions = sortedTx;

        return updatedPosition;
    }
}
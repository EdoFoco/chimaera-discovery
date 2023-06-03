import { Inject, Service } from "typedi";
import { OperationType } from "../types/ISwapTransaction";
import { ISwapTransaction, IUniswappishTransactionDecoded } from "../types";

@Service()
export class SwapTransactionMapper{
    private readonly baseTokensSet: Set<string>;

    constructor(@Inject("baseTokenAddresses") baseTokenAddresses: string[]) {
        this.baseTokensSet = new Set<string>();
        baseTokenAddresses.forEach((a) => {
            if(!this.baseTokensSet.has(a)) this.baseTokensSet.add(a);
        })
    }

    mapFromUnisswappishTransactionDecoded(uniswappishTransaction: IUniswappishTransactionDecoded): ISwapTransaction {
        return <ISwapTransaction> {
            hash: uniswappishTransaction.hash,
            blockNum: uniswappishTransaction.blockNum,
            amountIn: uniswappishTransaction.amountIn,
            amountOut: uniswappishTransaction.amountOut,
            path: uniswappishTransaction.path,
            operation: this.baseTokensSet.has(uniswappishTransaction.path[0]) ? OperationType.BUY : OperationType.SELL
        }
    }
}
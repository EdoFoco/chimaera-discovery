import { TransactionResponse } from "ethers";

export class IUniswappishTransaction extends TransactionResponse {
    input: string;
}
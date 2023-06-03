import { ITokenWithHolders } from "src/types";

export interface ITokenRepository {
    add(token: ITokenWithHolders): Promise<ITokenWithHolders>;
    get(tokenAddress: string): Promise<ITokenWithHolders | undefined>;
    addHolder(tokenAddress: string, holderAddress: string): Promise<ITokenWithHolders>;
}
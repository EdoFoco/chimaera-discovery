import { ITokenMetadata } from "./ITokenMetadata";

export interface ITokenWithHolders extends ITokenMetadata{
    address: string;
    holders: Set<string>;
}
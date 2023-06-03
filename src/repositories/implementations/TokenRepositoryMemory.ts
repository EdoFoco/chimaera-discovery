import { Service } from "typedi";
import { ITokenWithHolders } from "../../types";
import { ITokenRepository } from "../interfaces";

@Service()
export class TokenRepositoryMemory implements ITokenRepository {
    tokens: Record<string, ITokenWithHolders>;

    constructor(){
        this.tokens = {};
    }

    async add(token: ITokenWithHolders): Promise<ITokenWithHolders>{
        if(!(token.address in this.tokens)){
            this.tokens[token.address] = token;
        }
        return this.tokens[token.address];
    }

    async get(tokenAddress: string): Promise<ITokenWithHolders | undefined> {
        if(tokenAddress in this.tokens){
            return this.tokens[tokenAddress];
        }
        return undefined;
    }

    async addHolder(tokenAddress: string, holderAddress: string): Promise<ITokenWithHolders>{
        if(!(tokenAddress in this.tokens)) throw("Token not found");

        const token = this.tokens[tokenAddress];
        if(token.holders.has(holderAddress)) return token;

        token.holders.add(holderAddress);
        return token;
    }
}
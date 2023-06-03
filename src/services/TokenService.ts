import { Service } from "typedi";
import { AlchemyClient } from "../clients";
 import { TokenRepositoryMemory } from "../repositories";
import { ITokenWithHolders } from "../types";

@Service()
export class TokenService {
    private readonly nodeClient: AlchemyClient;
    private readonly tokenRepo: TokenRepositoryMemory;

    constructor(nodeClient: AlchemyClient, tokenRepo:TokenRepositoryMemory) {
       this.nodeClient = nodeClient;
       this.tokenRepo = tokenRepo;
    }

    async getOrAddToken(tokenAddress: string): Promise<ITokenWithHolders> {
        const existing = await this.tokenRepo.get(tokenAddress);
        if(existing) return existing;

        const tokenMeta = await this.nodeClient.getTokenMetadata(tokenAddress);
        if(!tokenMeta){
            console.log(`No metadata found for token: ${tokenAddress}`);
        }
        const token = tokenMeta as ITokenWithHolders;
        token.address = tokenAddress;
        token.holders = new Set<string>();

        return this.tokenRepo.add(token);
    }

    async addHolderToToken(tokenAddress: string, holderAddress: string): Promise<ITokenWithHolders> {
        return this.tokenRepo.addHolder(tokenAddress, holderAddress);
    }

    async getTokens(addresses: string[]){
        const tokens: ITokenWithHolders[] = [];
        addresses.forEach(async (a) => {
           const token = await this.tokenRepo.get(a);
           if(token) tokens.push(token);
        });

        return tokens;
    }

}
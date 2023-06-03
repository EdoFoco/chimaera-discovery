import { Service } from "typedi";

@Service()
export class UtilsService {
    createPairHash(address1: string, address2: string): string {
        const pair = [address1, address2].sort((a, b) => (a > b ? -1 : 1));
        return pair.join(',');
    }
}
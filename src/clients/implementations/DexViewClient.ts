import { Inject, Service } from "typedi";
import { BaseClient } from "./BaseClient";
import { IGetDexViewChartResponse, IGetDexViewPairDataResponse } from "../../types/dexview";

@Service()
export class DexViewClient extends BaseClient{
    private readonly url: string;
    private readonly secret: string;

    constructor(@Inject("dexViewUrl") url: string, @Inject("dexViewSecret") secret: string,) {
        super();
        this.url = url;
        this.secret = secret;
    }

    async getPairData(contractAddress : string): Promise<IGetDexViewPairDataResponse> {
        const path = `pair?chainId=1&baseToken=${contractAddress}`;
        return await this.getData<IGetDexViewPairDataResponse>(`${this.url}/${path}`, { "secret": this.secret });
    }

    async getChartData(contractAddress : string, from: number, to: number): Promise<IGetDexViewChartResponse> {
        const path = `candle-price/history?symbol=${contractAddress}&resolution=15&from=${from}&to=${to}&countback=10000&currencyCode=WETH&chainId=1`;
        return await this.getData<IGetDexViewChartResponse>(`${this.url}/${path}`, { "secret": this.secret });
    }
}
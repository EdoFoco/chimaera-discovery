import * as fs from 'fs';
import { Service } from "typedi";
import { DexViewClient } from "../clients/implementations/DexViewClient";
import { BoughtTokenStats } from "../types";
import { ITokenPerformance } from '../types/ITokenPerformance';

@Service()
export class BacktestService {
    private readonly dexViewClient: DexViewClient;

    constructor(dexViewClient: DexViewClient) {
        this.dexViewClient = dexViewClient;
    }

    async backtest(inputFile: string, minHolders: number) {
        const jsonString = fs.readFileSync(inputFile, 'utf-8');
        const allOperations = JSON.parse(jsonString) as BoughtTokenStats[];
        const operations = allOperations.filter((op) => op.holdersCount >= minHolders);

        const results: ITokenPerformance[] = [];

        for(let i = 0; i < operations.length; i++){
            const op = operations[i];

            const pairData = await this.dexViewClient.getPairData(op.address);
            if(!pairData.data?.address){
                console.log(`No pair detected for this address: ${op.address}`);
                continue;
            }
            const from = new Date(op.buyTriggeredAt);
            const fromUtc = from.getTime() / 1000;
            const now = new Date();
            const nowUtc = Math.floor(now.getTime() / 1000);
            const ts = await this.dexViewClient.getChartData(pairData.data.address, fromUtc, nowUtc);
            
            let startIndex = -1;
            for(let k = i; k < ts.data.t.length; k++){
                const time = ts.data.t[k];
                if(time >= fromUtc){
                    startIndex = k + 2; // allow 3min offset to allow the trade to execute
                    break;
                }
            }

            const startValue = ts.data.c[startIndex];
            const tokenPerf = <ITokenPerformance>{
                hit2x: false,
                hit3x: false,
                hit5x: false,
                hit10x: false,
                hit15x: false
            };

            for(let k = i; k < ts.data.c.length; k++){
                const currentValue = ts.data.c[k];
                const ret = (currentValue - startValue) / startValue;
                
                if(ret >= 2) tokenPerf.hit2x = true;
                if(ret >= 3) tokenPerf.hit3x = true;
                if(ret >= 5) tokenPerf.hit5x = true;
                if(ret >= 10) tokenPerf.hit10x = true;
                if(ret >= 15) tokenPerf.hit15x = true;
            }

            // only get the highest
            if(tokenPerf.hit15x){
                tokenPerf.hit2x = false;
                tokenPerf.hit3x = false;
                tokenPerf.hit5x = false;
                tokenPerf.hit10x = false;
            }
            if(tokenPerf.hit10x){
                tokenPerf.hit2x = false;
                tokenPerf.hit3x = false;
                tokenPerf.hit5x = false;
                tokenPerf.hit15x = false;
            }
            if(tokenPerf.hit5x){
                tokenPerf.hit2x = false;
                tokenPerf.hit3x = false;
                tokenPerf.hit10x = false;
                tokenPerf.hit15x = false;
            }
            if(tokenPerf.hit3x){
                tokenPerf.hit2x = false;
                tokenPerf.hit5x = false;
                tokenPerf.hit10x = false;
                tokenPerf.hit15x = false;
            }
            if(tokenPerf.hit2x){
                tokenPerf.hit3x = false;
                tokenPerf.hit5x = false;
                tokenPerf.hit10x = false;
                tokenPerf.hit15x = false;
            }
            
            results.push(tokenPerf);
        }

        console.log("Total tokens: ", results.length);
        console.log(`Hit 2x: `, results.filter((r) => r.hit2x).length);
        console.log(`Hit 3x: `, results.filter((r) => r.hit3x).length);
        console.log(`Hit 5x: `, results.filter((r) => r.hit5x).length);
        console.log(`Hit 10x: `, results.filter((r) => r.hit10x).length);
        console.log(`Hit 15xPlus: `, results.filter((r) => r.hit15x).length);
    }
}
import 'reflect-metadata';
import "dotenv/config";
import Container from 'typedi';
import { HolderAnalyser } from './services/HolderAnalyser';
import { BacktestService } from './services/BacktestService';

const main = async () => {
    const mode = process.env.MODE;
    switch(mode){
        case("FIND_HOLDERS_FOR_TOKENS"):
            await runFindCommonHoldersForTokens();
            break;
        case("FIND_COMMON_TOKEN_FOR_HOLDERS"):
            await runFindCommonTokensForHolders();
            break;
        case("RUN_BACKTEST"):
            await rundBacktest();
            break;
        default:
            throw("Unknown mode");
    }
};

const runFindCommonHoldersForTokens = async() => {
    const nodeUrl: string | undefined = process.env.NODE_URL;
    if(!nodeUrl){
        console.log("No NODE_URL found.")
        return;
    }

    const baseTokenAddresses: string | undefined = process.env.BASE_TOKEN_ADDRESSES;
    if(!baseTokenAddresses){
        console.log("No BASE_TOKEN_ADDRESSES found.")
        return;
    }


    const tokenAddresses : string | undefined = process.env.FIND_HOLDERS_FOR_TOKENS_TOKENS_TO_SCAN;
    if(!tokenAddresses){
        console.log("No FIND_HOLDERS_FOR_TOKENS_TOKENS_TO_SCAN found.");
        return;
    }

    const scoreMin : string | undefined = process.env.FIND_HOLDERS_FOR_TOKENS_SCORE_MIN;
    if(!scoreMin){
        console.log("No FIND_HOLDERS_FOR_TOKENS_SCORE_MIN found.");
        return;
    }
    
    const outputPath: string | undefined = process.env.FIND_HOLDERS_FOR_TOKENS_OUTPUT_PATH;
    if(!outputPath){
        console.log("No FIND_HOLDERS_FOR_TOKENS_OUTPUT_PATH found.");
        return;
    }

    Container.set('nodeUrl', nodeUrl);
    Container.set('baseTokenAddresses', baseTokenAddresses.split(','));
    
    const holderAnalyser = Container.get(HolderAnalyser);

    await holderAnalyser.getCommonHoldersForTokens(tokenAddresses.split(','), parseInt(scoreMin), outputPath);
}

const runFindCommonTokensForHolders = async() => {
    const nodeUrl: string | undefined = process.env.NODE_URL;
    if(!nodeUrl){
        console.log("No NODE_URL found.")
        return;
    }

    const baseTokenAddresses: string | undefined = process.env.BASE_TOKEN_ADDRESSES;
    if(!baseTokenAddresses){
        console.log("No BASE_TOKEN_ADDRESSES found.")
        return;
    }


    const wallets : string | undefined = process.env.FIND_COMMON_TOKEN_FOR_HOLDERS_WALLETS;
    if(!wallets){
        console.log("No WALLETS found.");
        return;
    }

    const fromBlock : string | undefined = process.env.FIND_COMMON_TOKEN_FOR_HOLDERS_FROM_BLOCK;
    if(!fromBlock){
        console.log("No FROM_BLOCK found.");
        return;
    }

    const minTokens: string | undefined = process.env.FIND_COMMON_TOKEN_FOR_HOLDERS_MIN_TOKENS;
    if(!minTokens){
        console.log("No FIND_COMMON_TOKEN_FOR_HOLDERS_MIN_TOKENS found.");
        return;
    }

    const buyTrigger: string | undefined = process.env.FIND_COMMON_TOKEN_FOR_HOLDERS_BUY_TRIGGER;
    if(!buyTrigger){
        console.log("No FIND_COMMON_TOKEN_FOR_HOLDERS_BUY_TRIGGER found.");
        return;
    }

    const outputPath: string | undefined = process.env.FIND_COMMON_TOKEN_FOR_HOLDERS_OUTPUT_PATH;
    if(!outputPath){
        console.log("No FIND_COMMON_TOKEN_FOR_HOLDERS_OUTPUT_PATH found.");
        return;
    }

    Container.set('nodeUrl', nodeUrl);
    Container.set('baseTokenAddresses', baseTokenAddresses.split(','));
    
    const holderAnalyser = Container.get(HolderAnalyser);

    await holderAnalyser.getCommonTokenBuys(wallets.split(','), parseInt(minTokens), parseInt(buyTrigger), outputPath, parseInt(fromBlock));
}

const rundBacktest = async() => {
    const minHolders: string | undefined = process.env.BACKTESTER_MIN_HOLDERS;
    if(!minHolders){
        console.log("No MIN_HOLDERS found.");
        return;
    }

    const inputFile: string | undefined = process.env.BACKTESTER_FILE;
    if(!inputFile){
        console.log("No BACKTESTER_FILE found.");
        return;
    }

    const dexViewUrl: string | undefined = process.env.DEXVIEW_URL;
    if(!dexViewUrl){
        console.log("No DEXVIEW_URL found.");
        return;
    }

    const dexViewSecret: string | undefined = process.env.DEXVIEW_SECRET;
    if(!dexViewSecret){
        console.log("No DEXVIEW_SECRET found.");
        return;
    }
    

    Container.set('dexViewUrl', dexViewUrl);
    Container.set('dexViewSecret', dexViewSecret);
    
    const backtestService = Container.get(BacktestService);

    await backtestService.backtest(inputFile, parseInt(minHolders));
}

main().catch((err) => {
    console.error(err);
  });
  
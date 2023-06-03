import { TokenMetadata } from "src/types";
import { IBaseAlchemyResponse } from "./IBaseAlchemyResponse";

export interface IGetTokenMetadataResponse extends IBaseAlchemyResponse {
    result: TokenMetadata
}
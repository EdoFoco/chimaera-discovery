import { ITokenMetadata } from "../../ITokenMetadata";
import { IBaseAlchemyResponse } from "./IBaseAlchemyResponse";

export interface IGetTokenMetadataResponse extends IBaseAlchemyResponse {
    result: ITokenMetadata
}
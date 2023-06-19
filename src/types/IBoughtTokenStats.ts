export interface IBoughtTokenStats {
    address: string;
    holdersCount: number;
    holders: string[];
    holdersWithDates: Record<string, Date>[];
    firstBoughtAt: Date; // represent the time of the 1st buy from the 1st caller
    buyTriggeredAt: Date;
    lastBoughtAt: Date; // represents the time of the 1st buy from the last caller
    lastBuyer: string;
}
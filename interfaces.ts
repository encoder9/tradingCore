export interface MarketData {
	Timestamp: string;
	Open: number;
	High: number;
	Low: number;
	Close: number;
	Volume: number;
}

export interface Strategy {
	Name: string;
	Label: string;
	Symbol: string;
	Period: Period;
	init(): void;
}

export type Period = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

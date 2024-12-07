import type { MarketData, Period, Strategy } from "../interfaces";
import Indicators from "../Indicators";
import DataManager from "../DataManager";

export default class BasicEMSStrategy implements Strategy {
	Name = 'BasicEMSStrategy';
	Label = 'Basic Exponential Moving Average Strategy';
	private symbol = 'AUDUSD';
	private period: Period = '1m';
	
	constructor() {}

	public get Symbol() {
		return this.symbol;
	}

	public get Period() {
		return this.period;
	}
	
	public init() {
		console.log('BasicEMSStrategy initialized');
		addEventListener('TICK', evt => { this.onTick(<MarketData>(<CustomEvent>evt).detail); });
	}
	
	private onTick(marketData: MarketData) {
		console.log(`BasicEMSStrategy received market data: ${marketData.Timestamp}, ${marketData.Open}, ${marketData.High}, ${marketData.Low}, ${marketData.Close}, ${marketData.Volume}`);
		
		// Example calculations using DataManager.history() for the last 14 periods
		const data = DataManager.history(this.period, 50);
		if (data.length > 0) {
			const sma = Indicators.sma(data, 14);
			console.log(`SMA (14): ${sma[sma.length - 1]}`);
			
			const ema = Indicators.ema(data, 14);
			console.log(`ema (14): ${ema[ema.length - 1]}`);

			const rsi = Indicators.rsi(data, 14);
			console.log(`RSI (14): ${rsi[rsi.length - 1]}`);

			const macd = Indicators.macd(data, 9, 26, 14);
			if (macd) {
				console.log(`MACD Line: ${macd.macd[macd.macd.length - 1]}, Signal Line: ${macd.signal[macd.signal.length - 1]}, Histogram: ${macd.histogram[macd.histogram.length - 1]}`);
			}

			const bollingerBands = Indicators.bollingerBands(data, 14, 2);
			console.log(`Bollinger Bands - Upper: ${bollingerBands.upper[bollingerBands.upper.length - 1]}, Middle: ${bollingerBands.middle[bollingerBands.middle.length - 1]}, Lower: ${bollingerBands.lower[bollingerBands.lower.length - 1]}`);

			const stochastic = Indicators.stochasticOscillator(data, 14);
			console.log(`Stochastic Oscillator - %K: ${stochastic.k[stochastic.k.length - 1]}, %D: ${stochastic.d[stochastic.d.length - 1]}`);

			const atr = Indicators.atr(data, 14);
			console.log(`ATR (14): ${atr[atr.length - 1]}`);
		}
	}
}

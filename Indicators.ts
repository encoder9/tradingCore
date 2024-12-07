export default abstract class Indicators {
	public static sma(data: { Close: number }[], period: number): number[] {
		if (data.length < period) {
			throw new Error('Not enough data to calculate SMA');
		}

		const result: number[] = [];
		for (let i = 0; i <= data.length - period; i++) {
			const window = data.slice(i, i + period);
			const average = window.reduce((sum, entry) => sum + entry.Close, 0) / period;
			result.push(average);
		}

		return result;
	}

	public static ema(data: { Close: number }[], period: number): number[] {
		if (data.length < period) {
			throw new Error('Not enough data to calculate EMA');
		}

		const k = 2 / (period + 1);
		const result: number[] = [];
		let emaPrev = data.slice(0, period).reduce((sum, entry) => sum + entry.Close, 0) / period; // SMA as initial EMA
		result.push(emaPrev);

		for (let i = period; i < data.length; i++) {
			const emaCurrent = (data[i].Close - emaPrev) * k + emaPrev;
			result.push(emaCurrent);
			emaPrev = emaCurrent;
		}

		return result;
	}

	public static rsi(data: { Close: number }[], period: number): number[] {
		if (data.length < period) {
			throw new Error('Not enough data to calculate RSI');
		}

		const result: number[] = [];
		for (let i = period; i < data.length; i++) {
			const window = data.slice(i - period, i);
			const gains = window.filter((entry, index) => index > 0 && window[index - 1] && entry.Close > window[index - 1].Close).reduce((sum, entry, index) => sum + (entry.Close - (window[index - 1]?.Close || 0)), 0);
			const losses = window.filter((entry, index) => index > 0 && window[index - 1] && entry.Close < window[index - 1].Close).reduce((sum, entry, index) => sum + ((window[index - 1]?.Close || 0) - entry.Close), 0);
			const rs = gains / (losses || 1);
			const rsi = 100 - 100 / (1 + rs);
			result.push(rsi);
		}

		return result;
	}

	public static macd(data: { Close: number }[], shortPeriod: number, longPeriod: number, signalPeriod: number): { macd: number[]; signal: number[]; histogram: number[] } {
		if (data.length < longPeriod) {
			throw new Error('Not enough data to calculate MACD');
		}

		const shortEma = this.ema(data, shortPeriod);
		const longEma = this.ema(data, longPeriod);
		const macdLine = shortEma.map((val, idx) => idx < longEma.length ? val - longEma[idx] : 0);
		const signalLine = this.ema(macdLine.slice(longPeriod - shortPeriod).map(value => ({ Close: value })), signalPeriod);
		const histogram = macdLine.map((val, idx) => idx < signalLine.length ? val - signalLine[idx] : 0);

		return { macd: macdLine, signal: signalLine, histogram };
	}

	public static bollingerBands(data: { Close: number }[], period: number, stdDevMultiplier: number): { upper: number[]; lower: number[]; middle: number[] } {
		if (data.length < period) {
			throw new Error('Not enough data to calculate Bollinger Bands');
		}

		const middleBand = this.sma(data, period);
		const upperBand: number[] = [];
		const lowerBand: number[] = [];

		for (let i = 0; i <= data.length - period; i++) {
			const window = data.slice(i, i + period);
			const mean = middleBand[i];
			const variance = window.reduce((sum, entry) => sum + Math.pow(entry.Close - mean, 2), 0) / period;
			const stdDev = Math.sqrt(variance);
			upperBand.push(mean + stdDevMultiplier * stdDev);
			lowerBand.push(mean - stdDevMultiplier * stdDev);
		}

		return { upper: upperBand, lower: lowerBand, middle: middleBand };
	}

	public static stochasticOscillator(data: { Close: number; High: number; Low: number }[], period: number): { k: number[]; d: number[] } {
		if (data.length < period) {
			throw new Error('Not enough data to calculate Stochastic Oscillator');
		}

		const k: number[] = [];
		for (let i = period - 1; i < data.length; i++) {
			const window = data.slice(i - period + 1, i + 1);
			const high = Math.max(...window.map(entry => entry.High));
			const low = Math.min(...window.map(entry => entry.Low));
			const currentK = ((data[i].Close - low) / (high - low)) * 100;
			k.push(currentK);
		}

		const d = this.sma(k.map(value => ({ Close: value })), 3);
		return { k, d };
	}

	public static fibonacciRetracement(data: { Close: number }[]): { levels: number[] } {
		if (data.length < 2) {
			throw new Error('Not enough data to calculate Fibonacci Retracement');
		}

		const high = Math.max(...data.map(entry => entry.Close));
		const low = Math.min(...data.map(entry => entry.Close));
		const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].map(level => high - (high - low) * level);
		return { levels };
	}

	public static atr(data: { High: number; Low: number; Close: number }[], period: number): number[] {
		if (data.length < period) {
			throw new Error('Not enough data to calculate ATR');
		}

		const tr: number[] = [];
		for (let i = 1; i < data.length; i++) {
			const currentTR = Math.max(
				data[i].High - data[i].Low,
				Math.abs(data[i].High - data[i - 1].Close),
				Math.abs(data[i].Low - data[i - 1].Close)
			);
			tr.push(currentTR);
		}

		return this.sma(tr.map(value => ({ Close: value })), period);
	}

	public static parabolicSar(data: { High: number; Low: number }[], step: number = 0.02, maxStep: number = 0.2): number[] {
		if (data.length < 2) {
			throw new Error('Not enough data to calculate Parabolic SAR');
		}

		const sar: number[] = [];
		let isLong = true;
		let ep = data[0].High;
		let af = step;
		let sarPrev = data[0].Low;
		
		for (let i = 1; i < data.length; i++) {
			const sarCurrent = sarPrev + af * (ep - sarPrev);
			if (isLong) {
				if (data[i].Low < sarCurrent) {
					isLong = false;
					ep = data[i].Low;
					af = step;
					sarPrev = data[i].High;
				} else {
					if (data[i].High > ep) {
						ep = data[i].High;
						af = Math.min(af + step, maxStep);
					}
					sarPrev = sarCurrent;
				}
			} else {
				if (data[i].High > sarCurrent) {
					isLong = true;
					ep = data[i].High;
					af = step;
					sarPrev = data[i].Low;
				} else {
					if (data[i].Low < ep) {
						ep = data[i].Low;
						af = Math.min(af + step, maxStep);
					}
					sarPrev = sarCurrent;
				}
			}
			sar.push(sarCurrent);
		}

		return sar;
	}

	public static ichimokuCloud(data: { High: number; Low: number; Close: number }[]): { tenkanSen: number[]; kijunSen: number[]; senkouSpanA: number[]; senkouSpanB: number[]; chikouSpan: number[] } {
		if (data.length < 52) {
			throw new Error('Not enough data to calculate Ichimoku Cloud');
		}

		const tenkanSen = [];
		const kijunSen = [];
		const senkouSpanA = [];
		const senkouSpanB = [];
		const chikouSpan = data.map(entry => entry.Close).slice(0, -26);

		for (let i = 8; i < data.length; i++) {
			const high9 = Math.max(...data.slice(i - 8, i + 1).map(entry => entry.High));
			const low9 = Math.min(...data.slice(i - 8, i + 1).map(entry => entry.Low));
			tenkanSen.push((high9 + low9) / 2);
		}

		for (let i = 26; i < data.length; i++) {
			const high26 = Math.max(...data.slice(i - 25, i + 1).map(entry => entry.High));
			const low26 = Math.min(...data.slice(i - 25, i + 1).map(entry => entry.Low));
			kijunSen.push((high26 + low26) / 2);
		}

		for (let i = 26; i < tenkanSen.length; i++) {
			senkouSpanA.push((tenkanSen[i - 26] + kijunSen[i - 26]) / 2);
		}

		for (let i = 52; i < data.length; i++) {
			const high52 = Math.max(...data.slice(i - 51, i + 1).map(entry => entry.High));
			const low52 = Math.min(...data.slice(i - 51, i + 1).map(entry => entry.Low));
			senkouSpanB.push((high52 + low52) / 2);
		}

		return { tenkanSen, kijunSen, senkouSpanA, senkouSpanB, chikouSpan };
	}

	public static cci(data: { High: number; Low: number; Close: number }[], period: number): number[] {
		if (data.length < period) {
			throw new Error('Not enough data to calculate CCI');
		}

		const result: number[] = [];
		for (let i = period - 1; i < data.length; i++) {
			const window = data.slice(i - period + 1, i + 1);
			const typicalPrices = window.map(entry => (entry.High + entry.Low + entry.Close) / 3);
			const meanTypicalPrice = typicalPrices.reduce((sum, tp) => sum + tp, 0) / period;
			const meanDeviation = typicalPrices.reduce((sum, tp) => sum + Math.abs(tp - meanTypicalPrice), 0) / period;
			const cci = (typicalPrices[typicalPrices.length - 1] - meanTypicalPrice) / (0.015 * meanDeviation);
			result.push(cci);
		}

		return result;
	}
}

import { readFileSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';
import type { MarketData, Period } from './interfaces';
import WebSocket from 'ws';

export default abstract class DataManager {
	private static dataStore: Record<Period, MarketData[]> = {
		'1m': [],
		'5m': [],
		'15m': [],
		'1h': [],
		'4h': [],
		'1d': []
	};

	public static init() {
		console.log('DataManager initialized');
	}
	
	public static connectLive(apiKey: string, period: string, symbol: string) {
		console.log(`Connecting to live data source for symbol: ${symbol}, period: ${period}`);

		if (!apiKey) {
			throw new Error('API key is required to connect to Finnhub WebSocket');
		}

		const socket = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);

		socket.on('open', () => {
			console.log('WebSocket connection established');
			// Subscribe to the provided symbol
			socket.send(JSON.stringify({ type: 'subscribe', symbol: symbol }));
		});

		socket.on('message', (data) => {
			try {
				const parsedData = JSON.parse(data.toString());
				if (parsedData.type === 'trade') {
					parsedData.data.forEach((trade: any) => {
						const marketData: MarketData = {
							Timestamp: trade.t.toString(),
							Open: trade.p, // Price as open (adjust as needed)
							High: trade.p,
							Low: trade.p,
							Close: trade.p,
							Volume: trade.v,
						};

						DataManager.dataStore[period as Period].push(marketData);
						const event = new CustomEvent('TICK', { detail: marketData });
						dispatchEvent(event);
					});
				}
			} catch (error) {
				console.error('Error processing WebSocket message:', error);
			}
		});

		socket.on('error', (error) => {
			console.error('WebSocket error:', error);
		});

		socket.on('close', () => {
			console.log('WebSocket connection closed');
		});

		// Keep the program running to process incoming data
		const keepRunning = true;
		process.on('SIGINT', () => {
			console.log('Gracefully shutting down on SIGINT...');
			process.exit(0);
		});

		process.on('SIGTERM', () => {
			console.log('Gracefully shutting down on SIGTERM...');
			process.exit(0);
		});

		while (keepRunning) {
			// Keep the event loop active
		}
	}
	
	public static connectDataFile(filename: string) {
		console.log(`Attempting to connect to data file: ${filename}`);
		
		if (!existsSync(filename)) {
			throw new Error(`The file ${filename} does not exist.`);
		}
		
		try {
			const fileContent = readFileSync(filename, 'utf-8');
			const records = parse(fileContent, {
				columns: false,
				skip_empty_lines: true,
				delimiter: ',',
			});
			
			records.shift();
			
			records.forEach((record: any) => {
				const marketData: MarketData = {
					Timestamp: String(record[0]),
					Open: parseFloat(record[1]),
					High: parseFloat(record[2]),
					Low: parseFloat(record[3]),
					Close: parseFloat(record[4]),
					Volume: parseFloat(record[5]),
				};
				
				DataManager.dataStore['1m'].push(marketData);
				
				const event = new CustomEvent('TICK', { detail: marketData });
				dispatchEvent(event);
			});
			
			console.log(`Successfully processed ${records.length} records from ${filename}`);
		} catch (error: any) {
			throw new Error(`Failed to parse the file ${filename}: ${error.message}`);
		}
	}

	public static getData(interval: Period): MarketData[] {
		return DataManager.dataStore[interval];
	}

	public static history(interval: Period, count: number): MarketData[] {
		return DataManager.dataStore[interval].slice(-count);
	}
}

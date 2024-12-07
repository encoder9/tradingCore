import { parseArgs } from "util";
import DataManager from "./DataManager";
import StrategyManager from "./StrategyManager";

const { values, positionals } = parseArgs({
	args: Bun.argv,
	options: {
		live: { type: 'boolean' },
		datasrc: { type: 'string' },
		help: { type: 'boolean' },
		strategy: { type: 'string' },
		apiKey: { type: 'string' },
	},
	strict: true,
	allowPositionals: true,
});

if (values.help) {
	console.log('Usage: bun run index.ts [options]');
	console.log('Options:');
	console.log('  --live       Run in live mode');
	console.log('  --datasrc    Specify data source');
	console.log('  --strategy   Comma-separated list of strategies to run');
	console.log('  --apiKey     API key for connecting to Finnhub WebSocket');
	console.log('  --help       Display this help message');
	console.log('\n');
	process.exit(0);
} else {
	DataManager.init();
	
	if (values.strategy) {
		const strategies = values.strategy.split(',');
		console.log(`Strategies to run: ${strategies.join(', ')}`);
		
		StrategyManager.init();
		StrategyManager.runStrategies(strategies);
		
		if (values.live) {
			if (!values.apiKey) {
				console.error('API key is required to connect to Finnhub WebSocket');
				process.exit(1);
			}
			DataManager.connectLive(values.apiKey, StrategyManager.Period, StrategyManager.Symbol);
		} else {
			if (values.datasrc) {
				DataManager.connectDataFile(values.datasrc);
			} else {
				console.error('No data source specified');
				process.exit(1);
			}
		}
	}
}

process.exit(0);

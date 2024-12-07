import type { Strategy } from "./interfaces";
import BasicEMSStrategy from "./Strategies/BasicEMSStrategy";

export default abstract class StrategyManager {
	private static strategies: Strategy[] = [];
	public static Period: string = "";
	public static Symbol: string = "";
	
	public static init() {
		StrategyManager.strategies.push(new BasicEMSStrategy());
	}
	
	public static runStrategies(strategyNames: string[]) {
		strategyNames.forEach(strategyName => {
			const strategy = StrategyManager.strategies.find(strategy => strategy.Name === strategyName);
			
			if (strategy) {
				strategy.init();
				StrategyManager.Period = strategy.Period;
				StrategyManager.Symbol = strategy.Symbol;
				console.log(`Strategy ${strategyName} initialized with Period: ${StrategyManager.Period}, Symbol: ${StrategyManager.Symbol}`);
			} else {
				console.error(`Strategy ${strategyName} not found`);
			}
		});
	}
}

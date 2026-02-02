# Simulation Runner Guide

Convenient tool for running and comparing multiple copy trading simulations with different parameters.

## Quick Start

### Interactive mode (recommended)

Launch the interactive menu to configure simulations:

```bash
npm run sim
```

You will be prompted to:

1. Choose a preset (quick/standard/full)
2. Enter trader addresses (or use defaults)

### Ready presets

```bash
# Quick test (7 days, 2 multipliers)
npm run sim quick

# Standard test (30 days, 3 multipliers) - RECOMMENDED
npm run sim standard

# Full test (90 days, 4 multipliers)
npm run sim full
```

### Custom simulation

```bash
npm run sim custom <trader_address> [days] [multiplier]

# Examples:
npm run sim custom 0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b 30 2.0
npm run sim custom 0x6bab41a0dc40d6dd4c1a915b8c01969479fd1292 60 1.5
```

## Presets

### Quick

- **History:** 7 days
- **Max trades:** 500
- **Multipliers:** 1.0x, 2.0x
- **Execution time:** ~2-3 minutes
- **When to use:** Quick trader check, initial analysis

### Standard ⭐ RECOMMENDED

- **History:** 30 days
- **Max trades:** 2000
- **Multipliers:** 0.5x, 1.0x, 2.0x
- **Execution time:** ~5-10 minutes
- **When to use:** Main analysis before starting copy trading

### Full

- **History:** 90 days
- **Max trades:** 5000
- **Multipliers:** 0.5x, 1.0x, 2.0x, 3.0x
- **Execution time:** ~15-30 minutes
- **When to use:** Deep analysis of long-term strategy

## Comparing results

After running simulations, use the `compare` command for analysis:

### Show all results

```bash
npm run compare
```

Outputs:

- Table of all simulations by trader
- Top-5 best configurations
- 3 worst configurations
- Aggregated statistics

### Top results

```bash
# Show top-10 best
npm run compare best 10

# Top-3
npm run compare best 3
```

### Worst results

```bash
# Show 5 worst
npm run compare worst 5
```

### Aggregated statistics

```bash
npm run compare stats
```

Shows:

- Total number of simulations
- Percentage profitable/unprofitable
- Average ROI
- Average P&L
- Total number of copied/skipped trades

### Detailed information

```bash
npm run compare detail <name_part>

# Examples:
npm run compare detail std_m2p0
npm run compare detail 0x7c3d
```

## Usage examples

### Scenario 1: Evaluating a new trader

```bash
# 1. Quick check
npm run sim custom 0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b 7 1.0

# 2. If result is good - full analysis
npm run sim custom 0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b 30 1.0

# 3. Testing different multipliers
npm run sim custom 0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b 30 0.5
npm run sim custom 0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b 30 2.0

# 4. Compare results
npm run compare
```

### Scenario 2: Comparing multiple traders

```bash
# Run standard test for all traders
npm run sim standard

# Compare results
npm run compare

# Detailed view of best
npm run compare best 1
```

### Scenario 3: Multiplier optimization

```bash
# Testing one trader with different multipliers
npm run sim custom 0x7c3d... 30 0.5
npm run sim custom 0x7c3d... 30 1.0
npm run sim custom 0x7c3d... 30 1.5
npm run sim custom 0x7c3d... 30 2.0
npm run sim custom 0x7c3d... 30 3.0

# Compare to choose optimal
npm run compare
```

## Results structure

All results are saved in `simulation_results/`:

```
simulation_results/
├── new_logic_0x7c3d..._30d_std_m0p5_2025-10-22.json
├── new_logic_0x7c3d..._30d_std_m1p0_2025-10-22.json
├── new_logic_0x7c3d..._30d_std_m2p0_2025-10-22.json
└── ...
```

File name format:

```
new_logic_<trader>_<days>d_<tag>_<date>.json
```

### JSON result format

```json
{
  "id": "sim_0x7c3db7_1729543210000",
  "name": "NEW_0x7c3d_30d",
  "logic": "capital_percentage",
  "timestamp": 1729543210000,
  "traderAddress": "0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b",
  "startingCapital": 1000,
  "currentCapital": 1247.35,
  "totalTrades": 156,
  "copiedTrades": 98,
  "skippedTrades": 58,
  "totalInvested": 850.25,
  "currentValue": 1247.35,
  "realizedPnl": 100.50,
  "unrealizedPnl": 146.85,
  "totalPnl": 247.35,
  "roi": 24.74,
  "positions": [...]
}
```

## Environment variables for simulations

The script supports the following variables in `.env`:

```bash
# Used by main script simulateProfitability.ts

# Trader address for simulation
SIM_TRADER_ADDRESS = '0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b'

# History period (days)
SIM_HISTORY_DAYS = 30

# Minimum order size (USD)
SIM_MIN_ORDER_USD = 1.0

# Maximum number of trades to load
SIM_MAX_TRADES = 5000

# Tag for result file
SIM_RESULT_TAG = 'test'

# Multiplier (uses TRADE_MULTIPLIER from main .env)
TRADE_MULTIPLIER = 2.0
```

**Note:** When using `npm run sim`, these variables are set automatically.

## Data caching

Historical trades are cached in `trader_data_cache/`:

```
trader_data_cache/
├── 0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b_30d_2025-10-22.json
└── 0x6bab41a0dc40d6dd4c1a915b8c01969479fd1292_30d_2025-10-22.json
```

**Benefits:**

- Repeated simulations execute instantly
- Saves Polymarket API requests
- Cache updates once per day automatically

**Clear cache:**

```bash
rm -rf trader_data_cache/
```

## Interpreting results

### Good indicators ✅

- **ROI > 15%:** Excellent returns
- **Copy rate > 70%:** Most trades are large enough to copy
- **Skip rate < 30%:** Not missing many opportunities
- **Positive Unrealized P&L:** Open positions are profitable

### Warning signs ⚠️

- **ROI < 0%:** Unprofitable strategy
- **Skip rate > 50%:** Too many skipped trades (need more capital)
- **Copy rate < 50%:** Trader makes trades too small for your capital
- **Large negative Unrealized P&L:** Open positions are losing

### Choosing optimal multiplier

| Multiplier | Risk        | When to use                              |
| ---------- | ----------- | ---------------------------------------- |
| 0.5x       | Low         | Testing, small capital                   |
| 1.0x       | Medium      | Standard copy trading                    |
| 2.0x       | High        | Confidence in trader                     |
| 3.0x+      | Very high   | Aggressive strategy, only with experience |

## Tips and best practices

### 1. Start with conservative approach

```bash
# First run - standard test
npm run sim standard

# Analyze results
npm run compare

# If results are good - test with higher multiplier
npm run sim custom <best_trader> 30 2.0
```

### 2. Check multiple periods

```bash
# Short-term performance
npm run sim custom <trader> 7 1.0

# Medium-term
npm run sim custom <trader> 30 1.0

# Long-term
npm run sim custom <trader> 90 1.0
```

### 3. Diversify

Don't rely on one trader:

```bash
# Run simulations for 3-5 traders
npm run sim

# When selecting, enter multiple addresses
# 0xTrader1, 0xTrader2, 0xTrader3

# Compare and choose top-2 or top-3
npm run compare best 3
```

### 4. Consider skip rate

If skip rate > 40%, consider:

- Increasing starting capital
- Reducing minimum order size (if possible)
- Choosing trader with larger positions

### 5. Regularly update analysis

```bash
# Run simulations once a week
npm run sim standard

# Compare with previous results
npm run compare
```

## Troubleshooting

### Error: "No simulation results found"

```bash
# Run simulation first
npm run sim quick
```

### Error: "Failed to fetch trades"

Check:

- Internet connection
- Trader address correctness
- Polymarket API rate limit (wait 1-2 minutes)

### Simulation takes too long

```bash
# Use quick preset
npm run sim quick

# Or limit number of trades
SIM_MAX_TRADES=500 npm run simulate
```

### Many skipped trades (high skip rate)

Causes:

1. Trader makes very small trades
2. Your simulated capital is too small

Solutions:

- Increase `STARTING_CAPITAL` in `simulateProfitability.ts`
- Use smaller multiplier (0.5x)
- Choose another trader with larger positions

## Additional commands

### View help

```bash
npm run sim help
npm run compare help
```

### Clean old results

```bash
# Delete all results
rm -rf simulation_results/*.json

# Delete results older than 7 days
find simulation_results/ -name "*.json" -mtime +7 -delete
```

### Export results

```bash
# Copy all results to archive
tar -czf simulation_results_$(date +%Y%m%d).tar.gz simulation_results/

# Or just copy folder
cp -r simulation_results/ simulation_results_backup/
```

## Next steps

After analyzing simulations:

1. **Choose 2-3 best traders** by ROI and stability
2. **Determine optimal multiplier** for each
3. **Update `.env`** with selected settings:
    ```bash
    USER_ADDRESSES = '0xTrader1, 0xTrader2, 0xTrader3'
    TRADE_MULTIPLIER = 1.5
    ```
4. **Run bot in preview mode** for final check:
    ```bash
    PREVIEW_MODE = true
    ```
5. **Start with small capital** for real testing
6. **Monitor results** and periodically run new simulations

---

**Remember:** Past results do not guarantee future returns. Always start small and gradually increase capital.

Happy simulating! 📊🚀

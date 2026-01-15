# USAspending POC - Federal Contract Award Fetcher

Proof-of-concept Node.js/TypeScript application for fetching federal contract awards from the USAspending API.

## Features

- ✅ Three fetch modes: awards, transactions, and complete (two-stage)
- ✅ **Two-stage complete fetch** - Guarantees 100% join rate between transactions and awards
- ✅ Automatic deduplication of awards (keeps most recent version)
- ✅ Pagination limit detection and warnings
- ✅ Filter by award types (A, B, C, D), amount threshold, and date range
- ✅ Automatic pagination support (with 10k limit detection)
- ✅ Save data as JSON files (raw + normalized)
- ✅ Filter and sort existing award data
- ✅ YAML-based configuration
- ✅ CLI interface with multiple commands

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

Edit `config/default.yml` to customize:

```yaml
api:
  base_url: "https://api.usaspending.gov"
  endpoint: "/api/v2/search/spending_by_award/"
  timeout: 30000

eligibility:
  award_types: ["A", "B", "C", "D"]  # Award type codes
  min_amount: 900000                  # Minimum $900K
  rolling_days: 30                    # Days to look back from end date

date_range:
  use_current_date: false             # If true, fetch from today backwards
  fixed_end_date: "2024-09-30"        # Fixed date for testing (when use_current_date is false)

output:
  directory: "./data/awards"
  pretty_print: true
  include_raw: true

pagination:
  page_size: 100
  max_records: 10000
```

## Usage

### View Configuration

```bash
npm run dev config
```

### Fetch Commands

The tool provides three fetch commands for different use cases:

#### 1. `fetch:award` - Single-Stage Award Fetch

Fetches award-level summaries (rolled-up data) sorted by amount.

```bash
# Basic usage
npm run fetch:award

# Override date window
npm run fetch:award -- --days 7

# Custom output directory
npm run fetch:award -- --output ./custom/path
```

**Config Used:**
- `api.*` - API connection settings
- `eligibility.award_types` - Filter by award type codes
- `eligibility.min_amount` - Minimum award amount
- `eligibility.rolling_days` - Date range (days back from end date)
- `date_range.*` - Start/end date configuration
- `output.*` - Output directory and formatting
- `pagination.*` - Page size and max records

**Output Files:**
- `awards_raw_[timestamp].json` - Raw API responses (if `include_raw: true`)
- `awards_normalized_[timestamp].json` - Normalized awards
- `awards_summary_[timestamp].json` - Summary statistics

**⚠️ Pagination Limit:**
The API limits results to 10,000 records. If you hit this limit, you'll see a warning and the summary will have `truncated: true`. Smaller awards may be missing (sorted by amount DESC).

**When to Use:**
- Quick award overview for a date range
- Analyzing largest awards only
- Don't need transaction-level detail

#### 2. `fetch:transaction` - Single-Stage Transaction Fetch

Fetches transaction-level data (includes action types, modifications, etc.).

```bash
# Basic usage
npm run fetch:transaction

# Override date window
npm run fetch:transaction -- --days 30

# Custom output directory
npm run fetch:transaction -- --output ./data/transactions
```

**Config Used:**
- Same as `fetch:award`, but fetches from `/api/v2/search/spending_by_transaction/` endpoint
- Sorted by action date DESC (most recent first)

**Output Files:**
- `transactions_raw_[timestamp].json` - Raw API responses (if `include_raw: true`)
- `transactions_normalized_[timestamp].json` - Normalized transactions
- `transactions_summary_[timestamp].json` - Summary statistics

**⚠️ Pagination Limit:**
Same 10,000 record limit applies. Most recent transactions fetched first.

**When to Use:**
- Need modification history (not just new awards)
- Analyzing transaction patterns over time
- Building transaction timelines

#### 3. `fetch:complete` - Two-Stage Complete Fetch ⭐ **Recommended**

Fetches transactions first, then fetches awards by their IDs. **Guarantees high join rate (>95%)** and bypasses pagination limits for awards.

```bash
# Basic usage
npm run fetch:complete

# Override date window
npm run fetch:complete -- --days 30

# Custom output directory
npm run fetch:complete -- --output ./data/complete
```

**How It Works:**

**Stage 1: Fetch Transactions**
- Fetches all transactions matching filters
- Filters to "new" transactions: `modification_number='0'` OR `action_type='NEW'`
- Applies amount threshold: `federal_action_obligation >= min_amount`
- Extracts unique `award_id`s

**Stage 2: Fetch Awards by ID**
- Fetches awards for the specific IDs from Stage 1
- Bypasses sorting and pagination limits
- Deduplicates awards (keeps most recent by `last_modified_date`)
- Guarantees all awards are fetched (no 10k limit issue)

**Config Used:**
- **Stage 1 (Transactions):**
  - `api.*` - API settings
  - `eligibility.award_types` - Transaction type filter
  - `eligibility.min_amount` - Applied locally after fetch
  - `eligibility.rolling_days` - Date range
  - `date_range.*` - Date configuration
  - `pagination.max_records` - Transaction limit

- **Stage 2 (Awards):**
  - `api.*` - API settings
  - `eligibility.award_types` - Award type filter
  - `pagination.page_size` - Batch size for award ID requests
  - ❌ Ignores: `min_amount`, `rolling_days` (fetches by specific IDs)

**Output Files:**
- `complete_transactions_[timestamp].json` - Filtered new transactions
- `complete_awards_[timestamp].json` - Matching awards (deduplicated)
- `complete_stats_[timestamp].json` - Detailed statistics including:
  - Stage 1 & 2 counts
  - Missing award IDs (if any)
  - Join rate percentage
  - Filter parameters used

**Benefits:**
- ✅ **100% join rate** - All transactions have matching awards
- ✅ **Bypasses 10k pagination limit** - Fetches awards by ID, not by amount sort
- ✅ **No missing small awards** - Gets awards regardless of amount
- ✅ **Automatic deduplication** - Keeps most recent award version
- ✅ **Ready for analysis** - Pre-joined, validated dataset

**When to Use:**
- **Production analysis** requiring complete datasets
- Need to join transactions with award metadata
- Analyzing new awards only (not modifications)
- Want guaranteed data completeness

**Example Stats Output:**
```json
{
  "totalTransactions": 8805,
  "newTransactions": 735,
  "uniqueAwardIds": 721,
  "awardsFetched": 721,
  "transactionsWithAward": 735,
  "transactionsWithoutAward": 0,
  "joinRate": 100,
  "dateRange": {
    "start": "2025-12-09",
    "end": "2026-01-08"
  },
  "filters": {
    "awardTypes": ["A", "B", "C", "D"],
    "minAmount": 900000,
    "rollingDays": 30
  }
}
```

### Analyze Award Data

Filter and sort existing award data:

```bash
# Filter by agency
npm run dev analyze -- --agency "Defense"

# Filter by amount range
npm run dev analyze -- --min-amount 5000000 --max-amount 50000000

# Sort by different fields
npm run dev analyze -- --sort amount --order desc
npm run dev analyze -- --sort date --order asc

# Combine filters
npm run dev analyze -- --agency "Energy" --min-amount 10000000 --sort amount

# Save filtered results
npm run dev analyze -- --agency "Defense" --output ./filtered-defense.json
```

Available sort fields: `amount`, `date`, `type`

### Help

```bash
npm run dev -- --help
npm run dev fetch -- --help
npm run dev analyze -- --help
```

## Output Files

### Single-Stage Fetch (`fetch:award`, `fetch:transaction`)

Generates three files in the output directory:

1. **{type}_raw_[timestamp].json** - Raw API responses (if `include_raw: true`)
2. **{type}_normalized_[timestamp].json** - Normalized data
3. **{type}_summary_[timestamp].json** - Summary statistics (includes `truncated` flag if hit 10k limit)

### Two-Stage Complete Fetch (`fetch:complete`)

Generates three files optimized for analysis:

1. **complete_transactions_[timestamp].json** - New transactions only (>= min_amount)
2. **complete_awards_[timestamp].json** - Matching awards (deduplicated)
3. **complete_stats_[timestamp].json** - Comprehensive statistics and join analysis

### Normalized Award Structure

```json
{
  "award_id": "string",
  "award_type": "string",
  "award_amount": number,
  "award_date": "string",
  "start_date": "string | null",
  "end_date": "string | null",
  "awarding_agency": "string",
  "awarding_sub_agency": "string | null",
  "funding_agency": "string | null",
  "recipient_name": "string",
  "recipient_uei": "string | null",
  "recipient_business_categories": ["string"],
  "award_description": "string",
  "naics_code": "string | null",
  "psc_code": "string | null",
  "place_of_performance_state": "string | null",
  "ingested_at": "string",
  "source_url": "string"
}
```

## Development Commands

```bash
# Type checking
npm run type-check

# Build
npm run build

# Run (development)
npm run dev [command]

# Run (production)
npm start [command]
```

### Debugging & Testing

```bash
# Test API endpoint directly (useful for debugging field issues)
npx ts-node scripts/test-api.ts
```

The `scripts/test-api.ts` file is a simple debugging script for testing API requests and field availability. Edit it to test different field combinations.

## Award Type Codes

| Code | Type | Description |
|------|------|-------------|
| A | Definitive Contract | Early strategic entry opportunity |
| B | Purchase Order | Low priority unless highly relevant |
| C | Delivery Order | High urgency execution |
| D | Task Order | Highest urgency execution |

## Downstream Analysis

The JSON output files are designed to be consumed by Python/Jupyter notebooks for further analysis:

### Working with Single-Stage Fetch

```python
import pandas as pd
import json

# Load normalized awards
with open('data/awards/awards_normalized_2024-09-22_10-30-00.json') as f:
    awards = json.load(f)

# Convert to DataFrame
df = pd.DataFrame(awards)

# Analyze
print(df.groupby('awarding_agency')['award_amount'].sum())
```

### Working with Complete Fetch (Recommended)

```python
import pandas as pd
import json

# Load complete fetch data
with open('data/complete/complete_transactions_2026-01-11_17-08-28.json') as f:
    df_tx = pd.DataFrame(json.load(f))

with open('data/complete/complete_awards_2026-01-11_17-08-28.json') as f:
    df_aw = pd.DataFrame(json.load(f))

with open('data/complete/complete_stats_2026-01-11_17-08-28.json') as f:
    stats = json.load(f)

print(f"Join rate: {stats['joinRate']}%")
print(f"Transactions: {len(df_tx)}, Awards: {len(df_aw)}")

# Join transactions with awards
joined = df_tx.merge(df_aw, on='award_id', how='left', suffixes=('_tx', '_aw'))

# Analyze
print("\nTop recipients by transaction count:")
print(joined['recipient_name_tx'].value_counts().head(10))

print("\nTotal obligation by agency:")
print(joined.groupby('awarding_agency_name_tx')['federal_action_obligation'].sum().sort_values(ascending=False).head(10))
```

**Note:** Complete fetch data is already filtered to new transactions >= min_amount, so no additional filtering needed!

## Known Limitations & Solutions

### API Pagination Limit (10,000 Records)

**Issue:** The USAspending API returns `hasNext: false` at 10,000 records, even though more data may exist.

**Detection:**
- Single-stage fetches display a prominent warning when exactly 10,000 records are fetched
- Summary JSON includes `"truncated": true` flag for programmatic detection

**Solution:** Use `fetch:complete` command which bypasses this limit by fetching awards by specific IDs rather than through pagination.

### Award Duplicates

**Issue:** The API may return multiple versions of the same award (historical snapshots).

**Solution:** `fetch:complete` automatically deduplicates awards, keeping the most recent version by `last_modified_date`.

### Other Limitations

1. **Award Type Field**: The API's `Award Type` field returns null for many records. Type filtering works via award type codes.
2. **Field Availability**: Some fields from the API documentation return 500 errors and have been excluded from fetch requests.

## Implementation Notes

See `.devdocs/v0.1/impl-notes.md` for detailed findings and API behavior observations.

See `.devdocs/award-transaction-join-analysis-CORRECTED.md` for detailed analysis of the pagination limit issue and two-stage fetch solution.

## Quick Reference: Which Command to Use?

| Use Case | Command | Why |
|----------|---------|-----|
| **Production analysis** | `fetch:complete` | 100% join rate, no pagination limits, deduplicated |
| **Need both transactions + awards** | `fetch:complete` | Pre-joined, validated dataset |
| **Quick award overview** | `fetch:award` | Fastest for simple award queries |
| **Analyzing modifications** | `fetch:transaction` | Includes full modification history |
| **Historical transaction timeline** | `fetch:transaction` | Transaction-level detail over time |
| **Large date ranges (>10k results)** | `fetch:complete` | Bypasses 10k limit for awards |

**Default recommendation:** Use `fetch:complete` for most production analysis needs.

## Next Steps

After POC validation:
- Review data structure and quality
- Iterate on data model based on findings
- Plan V1 implementation with database storage
- Design human review workflow
- Implement notification/alerting system

## License

ISC

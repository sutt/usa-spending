# USAspending POC - Federal Contract Award Fetcher

Proof-of-concept Node.js/TypeScript application for fetching federal contract awards from the USAspending API.

## Features

- ✅ Fetch federal contract awards from USAspending.gov API
- ✅ Filter by award types (A, B, C, D), amount threshold, and date range
- ✅ Automatic pagination support
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
  rolling_days: 30                    # Last 30 days

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

### Fetch Awards

Fetch awards using configured parameters:

```bash
npm run dev fetch
```

Override date window:

```bash
npm run dev fetch -- --days 7
```

Custom output directory:

```bash
npm run dev fetch -- --output ./custom/path
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

The `fetch` command generates three files in the output directory:

1. **awards_raw_[timestamp].json** - Raw API responses
2. **awards_normalized_[timestamp].json** - Normalized award data matching PRD schema
3. **awards_summary_[timestamp].json** - Summary statistics

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

## Known Limitations (POC)

1. **Award Type Field**: The API's `Award Type` field returns null for many records. Type filtering is limited.
2. **Date Range**: Currently using September 2024 data for testing. Update `src/services/fetcher.ts` to use recent dates once API is stable.
3. **Field Availability**: Some fields from the API documentation return 500 errors and have been excluded.
4. **Max Records**: Limited to 10,000 records per fetch (configurable).

## Implementation Notes

See `.devdocs/v0.1/impl-notes.md` for detailed findings and API behavior observations.

## Next Steps

After POC validation:
- Review data structure and quality
- Iterate on data model based on findings
- Plan V1 implementation with database storage
- Design human review workflow
- Implement notification/alerting system

## License

ISC

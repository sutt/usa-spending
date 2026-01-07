# USA Spending POC - Tasklist v0.1

## Overview
Proof-of-concept Node/TypeScript application to fetch federal contract awards from USAspending API, demonstrating data structure and basic filtering capabilities.

## Goals
- Validate API integration and data structure
- Fetch 30-day window of eligible contracts
- Output data to JSON files for inspection
- Demonstrate basic filtering/sorting capabilities
- Enable Python/Jupyter notebook analysis downstream

---

## Tasks

### 1. Project Setup & Configuration
- [ ] Initialize Node.js/TypeScript project
  - Create `package.json` with TypeScript dependencies
  - Configure `tsconfig.json` for Node environment
  - Set up build scripts and dev tooling (ts-node for development)
  - Add `.gitignore` for node_modules, dist, and generated data files

- [ ] Install core dependencies
  - TypeScript and @types/node
  - axios (for HTTP requests)
  - js-yaml and @types/js-yaml (for YAML config)
  - date-fns (for date manipulation)
  - Commander.js (for CLI interface)
  - Development: ts-node, @types packages

- [ ] Create YAML configuration structure
  - Define `config/default.yml` with:
    - API base URL
    - Award eligibility criteria (types: A/B/C/D, min amount: $900k)
    - Rolling date window (default: 30 days)
    - Output directory for JSON files
    - Pagination settings (page size, max records)
  - Create TypeScript types for config schema

### 2. API Client Implementation

- [ ] Create USAspending API client module
  - Base HTTP client with axios
  - Type definitions for API request/response structures
  - Error handling and retry logic
  - Rate limiting consideration (if needed)

- [ ] Implement spending_by_award endpoint integration
  - Build request payload with filters:
    - Award type codes (A, B, C, D)
    - Award amount >= $900,000
    - Time period (configurable rolling window)
  - Define response type mappings for award data
  - Handle pagination (page-based)

- [ ] Add request field mapping
  - Map PRD data model fields to API field names:
    - Award metadata (ID, type, amount, dates)
    - Agency context (awarding/funding agencies)
    - Prime contractor (recipient name, UEI, business categories)
    - Work description (description, NAICS, PSC, location)
  - Create TypeScript interfaces for normalized award data

### 3. Data Fetching & Storage

- [ ] Implement data fetcher service
  - Load configuration from YAML
  - Calculate date range (last N days from config)
  - Build API request with eligibility filters
  - Fetch all pages of results (handle pagination)
  - Progress logging to console

- [ ] Create JSON output handler
  - Generate timestamped output filenames
  - Write raw API responses to JSON files
  - Write normalized/transformed data to separate files
  - Create summary metadata file (record count, date range, fetch timestamp)
  - Organize output by date or run ID

- [ ] Add data normalization layer
  - Transform API response to PRD data model structure
  - Handle missing/optional fields gracefully
  - Standardize date formats
  - Preserve source_url (link to USAspending record)

### 4. CLI Interface

- [ ] Build CLI command structure
  - `fetch`: Main command to fetch awards
    - Options: --days (override config window), --output (custom output path)
  - `config`: Show current configuration
  - Add help text and usage examples

- [ ] Implement logging and progress indicators
  - Console output for fetch progress
  - Summary statistics (records fetched, date range, file locations)
  - Error reporting with actionable messages

### 5. Basic Filtering & Sorting (POC)

- [ ] Add post-fetch filtering capabilities
  - Filter by award type (A/B/C/D)
  - Filter by agency name (substring match)
  - Filter by amount range
  - Filter by date range (within fetched data)

- [ ] Implement sorting functionality
  - Sort by award amount (ascending/descending)
  - Sort by award date (newest/oldest first)
  - Sort by award type
  - Write sorted results to separate JSON files

- [ ] Create filter/sort CLI command
  - `analyze`: Apply filters and sorting to existing JSON data
    - Options: --type, --agency, --min-amount, --sort-by
  - Output filtered/sorted results to new JSON file

### 6. Testing & Validation

- [ ] Manual API testing
  - Test with small date window (7 days) first
  - Verify response structure matches documentation
  - Validate field mappings are correct
  - Test pagination (fetch multiple pages)

- [ ] Data validation
  - Verify all fetched awards meet eligibility criteria
  - Check for duplicates in results
  - Validate data completeness (required fields present)
  - Generate validation report

- [ ] End-to-end test
  - Run full 30-day fetch
  - Verify JSON output files are created
  - Test filtering and sorting on real data
  - Document any API quirks or data quality issues

### 7. Documentation

- [ ] Create README.md
  - Setup instructions (installation, configuration)
  - CLI usage examples
  - Configuration reference
  - Output file structure documentation

- [ ] Document findings in impl-notes.md
  - API behavior observations
  - Data structure insights
  - Field mapping decisions
  - Known limitations or gotchas

- [ ] Add example outputs
  - Sample config.yml
  - Example JSON output structure
  - Example filter/sort commands

---

## Configuration Schema (Reference)

```yaml
# config/default.yml
api:
  base_url: "https://api.usaspending.gov"
  endpoint: "/api/v2/search/spending_by_award/"
  timeout: 30000

eligibility:
  award_types: ["A", "B", "C", "D"]
  min_amount: 900000
  rolling_days: 30

output:
  directory: "./data/awards"
  pretty_print: true
  include_raw: true

pagination:
  page_size: 100
  max_records: 10000  # safety limit
```

---

## Success Criteria

POC is successful when:
- ✅ Can fetch 30 days of eligible awards from USAspending API
- ✅ Data is written to JSON files with correct structure
- ✅ All PRD-required fields are captured
- ✅ Basic filtering by type, agency, amount works
- ✅ Basic sorting by amount and date works
- ✅ Configuration is externalized to YAML
- ✅ CLI is functional and documented
- ✅ Data is ready for Python/Jupyter analysis

---

## Next Steps (Post-POC)

After POC validation:
1. Review data structure and quality with stakeholders
2. Iterate on data model based on findings
3. Plan V1 implementation with storage layer
4. Design human review workflow
5. Plan notification/alerting system

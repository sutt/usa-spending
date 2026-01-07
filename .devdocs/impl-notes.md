# Implementation Notes - USAspending POC

## API Behavior Observations

### Working Endpoint
- **URL**: `https://api.usaspending.gov/api/v2/search/spending_by_award/`
- **Method**: POST
- **Content-Type**: application/json

### Field Availability Issues

Several fields mentioned in the API documentation return 500 errors when requested:

**Problematic Fields** (cause 500 errors):
- `Award Date`
- `Awarding Agency Code`
- `Awarding Sub Agency Code`
- `Funding Agency Code`
- `Funding Sub Agency Code`
- `recipient_id`
- `naics_description`
- `Contract Award Type`
- `Total Outlays`

**Working Fields**:
- `Award ID`
- `Award Amount`
- `Award Type` (returns null for most records)
- `Start Date`
- `End Date`
- `Awarding Agency`
- `Awarding Sub Agency`
- `Funding Agency`
- `Recipient Name`
- `Recipient UEI`
- `Description`
- `naics_code`
- `product_or_service_code`
- `Place of Performance State Code`

**Auto-Returned Fields** (included even if not requested):
- `internal_id`
- `generated_internal_id`
- `awarding_agency_id`
- `agency_slug`

### Award Type Field

The `Award Type` field consistently returns `null` for contract awards, even though the API endpoint successfully filters by `award_type_codes` in the request. This suggests:
- The filtering works correctly on the backend
- The field mapping for returning award type in responses is broken or incomplete
- Awards are correctly matched to type codes A/B/C/D but the type isn't included in response

**Workaround**: Since we filter by type in the request, we know all returned awards match our criteria. For the POC, awards are marked as "Unknown" type. In production, you could:
1. Store the requested type filter alongside the data
2. Map awards to types based on other characteristics
3. Wait for API field to be fixed

### Data Volume

Test fetch (September 22-29, 2024, 7 days):
- Awards matching criteria: 10,000+ (hit max_records limit)
- Total value: $1.17 trillion
- Average award: $116 million
- File sizes: ~7.6MB normalized, ~7.8MB raw

This suggests that a 30-day window with $900K+ threshold will fetch thousands of awards.

### Date Range Considerations

- API successfully accepts date ranges in `yyyy-MM-dd` format
- Recent dates (within last few days) may not have data processed yet
- Using a 3-day buffer from current date recommended for production
- Historical data (Sept 2024) works reliably

### Pagination

- API pagination works as documented
- `page_metadata.hasNext` accurately indicates more data
- Page size of 100 records is performant
- Large fetches (thousands of records) complete in minutes

### Response Times

- Individual page requests: 1-3 seconds
- 10,000 record fetch (~100 pages): ~3-5 minutes
- API appears to have good reliability (no rate limiting observed)

## Data Quality Notes

### Recipient Information
- `Recipient UEI` is consistently populated
- `Recipient Name` is always present
- Business categories field exists but structure not yet explored

### Agency Information
- Agency names are human-readable
- Sub-agency may be null
- Funding agency often matches awarding agency

### Award Descriptions
- Highly variable in quality and format
- Some are clear, others are encoded/abbreviated
- May require additional parsing for human readability

### NAICS Codes
- Generally populated for contracts
- 6-digit format
- Can be used for industry classification

### Geographic Data
- State codes are standard 2-letter abbreviations
- Place of performance may be null for some awards
- Consider additional geographic enrichment for full V1

## Best Practices Discovered

1. **Field Selection**: Only request fields known to work to avoid 500 errors
2. **Date Ranges**: Use historical data for testing, add buffer for production
3. **Pagination**: Set reasonable page_size (100) and max_records (10000) limits
4. **Error Handling**: API errors include HTML responses, not JSON
5. **Data Normalization**: Map API fields carefully as many are null or sparse

## Technical Decisions

### Why TypeScript
- Strong typing helps catch API response mismatches
- Good tooling for Node.js development
- Easy to refactor as requirements evolve

### Why JSON Files (not Database)
- POC goal is data exploration, not production storage
- JSON files easy to inspect and share
- Simple Python/Jupyter integration
- Can migrate to database in V1 after schema validated

### Why YAML Config
- Human-readable and editable
- Good for non-developers to adjust criteria
- Standard format for configuration
- Easy to version control

### Why Commander.js CLI
- Standard Node.js CLI framework
- Good help/documentation generation
- Easy to add new commands
- Familiar to developers

## Recommendations for V1

1. **Investigate Award Type Field**: Contact USAspending support about null Award Type
2. **Additional Fields**: Test for other useful fields we may have missed
3. **Business Categories**: Explore structure and usefulness of this field
4. **Date Handling**: Implement smart date buffer based on API update frequency
5. **Incremental Fetching**: Track last fetch date to avoid re-fetching same data
6. **Deduplication**: Implement award_id-based deduplication
7. **Database Schema**: Design normalized schema based on POC findings
8. **Error Logging**: Add structured logging for production monitoring

## API Quirks

- Field names with spaces (e.g., "Award ID") - unusual but works
- Some fields documented but unavailable (500 errors)
- Award Type field exists but returns null
- Mix of human-readable names and codes
- HTML error responses instead of JSON error objects

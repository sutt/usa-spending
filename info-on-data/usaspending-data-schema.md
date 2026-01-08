# USAspending Data Schema Overview

## Core Concept: Awards vs Transactions

**Award** = The overall contract/grant/loan (summary view)
- A unique identifier (award_id) representing the entire lifecycle
- A "roll-up" of all related transactions
- Example: "5-year IDIQ contract worth $50M"

**Transaction** = Individual action on an award (event-based view)
- The initial "base" award creation
- Any modification, amendment, or funding action
- Example: "Initial award", "Mod 1: +$5M", "Mod 2: extend 6 months"

**Key Principle**: *"One record in USAspending.gov does not necessarily equal one contract; rather, one record equals one action taken on a contract."*

---

## Federal Procurement Hierarchy (4 Levels)

```
Level 1: Vehicle Awards (Master Vehicles)
    ↓
Level 2: Indefinite Delivery Vehicles (IDVs)
    ↓
Level 3: Prime Awards (Contracts)
    ↓
Level 4: Sub Awards (Subcontracts)
```

### Level 1: Vehicle Awards
- **Broadest level** - named contracting programs
- Examples: GSA Multiple Award Schedule, NASA SEWP, GSA 8(a) STARS
- Awarded to **multiple contractors** every 5-10 years
- 30-40% of all federal spending flows through these
- Not direct funding - establishes the competitive framework

### Level 2: IDVs (Indefinite Delivery Vehicles)
- **"Hunting licenses"** for individual contractors
- Issued to each contractor under a Vehicle
- Types include:
  - **IDV_A**: GWAC (Government-Wide Acquisition Contract)
  - **IDV_B**: IDC (Indefinite Delivery Contract) / IDIQ
  - **IDV_C**: FSS (Federal Supply Schedule)
  - **IDV_D**: BOA (Basic Ordering Agreement)
  - **IDV_E**: BPA (Blanket Purchase Agreement)
- Typical duration: 5 years (ranges from months to 20+ years)
- **No direct funding** - just eligibility to receive task orders

### Level 3: Prime Awards (Contracts)
- **Where money is obligated** to contractors
- Your scraper fetches these (codes A, B, C, D)
- Types:
  - **A**: BPA Call (call against Blanket Purchase Agreement)
  - **B**: Purchase Order (direct purchase, often standalone)
  - **C**: Delivery Order (order against an IDC/FSS)
  - **D**: Definitive Contract (standalone direct contract)
- Can be issued under an IDV **or** standalone

### Level 4: Sub Awards
- Awards issued by prime contractors to subcontractors
- Must be reported if >$30,000
- Range from 0-100% of prime award value
- Separate reporting system in USAspending

---

## Award Categories (Beyond Contracts)

USAspending tracks multiple spending types:

### Contracts (A, B, C, D) + IDVs
- Procurement of goods/services
- Types A-D are what your scraper fetches

### Financial Assistance
- **02-05**: Grants (block, formula, project, cooperative agreements)
- **06, 10**: Direct payments
- **07**: Direct loans
- **08**: Guaranteed/insured loans
- **09, 11**: Insurance, other assistance

---

## How Your Scraper Fits In

**What you're fetching**: Level 3 Prime Awards (types A, B, C, D)

**Parent relationships** (not captured):
- Some of your awards have parent IDVs (C and A types especially)
- Some are standalone (B and D types often)
- The `search/spending_by_award/` endpoint returns **award-level summaries**

**To get parent context**: Use `/api/v2/awards/{award_id}/` endpoint which includes:
- `parent_award_id` (links to IDV)
- `parent_award_piid` (parent contract number)
- Full IDV hierarchy information

---

## Data Model Relationships

```
Award Summary (award_id)
├── Transaction 1 (base award)
├── Transaction 2 (mod 001)
├── Transaction 3 (mod 002)
└── Transaction N (final mod)
    ↓
Aggregated into Award Summary shown in search results
```

**Your normalized data** = Award Summary level (rolled up from transactions)

**What you're missing** = Individual transaction history per award

---

## Key Data Files in GSDM

The Government-wide Spending Data Model organizes this as:

- **File D1**: Contract/IDV transaction data (from FPDS)
- **File D2**: Financial assistance transaction data (from FABS)
- **File C**: Award financial info (links to appropriations)
- **File E/F**: Award financial details
- **Files A/B**: Appropriation accounts and program activities

Your scraper hits the aggregated API that combines these underlying files.

---

## Important Distinctions

| Concept | Description | Your Scraper |
|---------|-------------|--------------|
| **Award Type** | A/B/C/D, IDV, Grant, Loan | Filters for A/B/C/D |
| **Action Type** | New award, modification, termination | Not tracked (gets summary) |
| **Record Type** | Individual or aggregate | Individual awards >$900K |
| **Award** | Overall contract (summary) | ✅ This is what you fetch |
| **Transaction** | Individual action/change | ❌ Not captured |
| **IDV** | Parent hunting license | ❌ Not captured (but could) |
| **Sub Award** | Subcontract | ❌ Different endpoint |

---

## Distinguishing New Contracts from Modifications

### The Problem

**With award-level summaries (current endpoint), you cannot tell if a record represents a new contract or a modification to an existing contract.**

The `/api/v2/search/spending_by_award/` endpoint returns:
- Aggregated award data (sum of all transactions)
- Awards that had **any activity** in the date range
- No indication of what type of action occurred

**Impact on "Last 30 Days" Filter**:
- ✅ Brand new $5M contract signed yesterday → **Included**
- ✅ 10-year-old $2B contract with $50K mod yesterday → **Also included**
- ❌ You can't distinguish between them!

This is critical because:
- Old contracts with tiny mods are not subcontracting opportunities
- New awards are high-value targets for business development
- Large modifications (new phases/options) might be valuable

### The Solution: Transaction-Level Fields

These fields distinguish new vs modified contracts, but are **only available** from transaction-level endpoints:

#### From `/api/v2/transactions/` or `/api/v2/awards/{award_id}/`

- **`action_type`**: Code (e.g., "A")
- **`action_type_description`**: "NEW", "MODIFICATION", "CONTINUATION", etc.
- **`modification_number`**: null for new awards, "001", "002", etc. for mods
- **`action_date`**: When this specific action occurred

**Example response**:
```json
{
  "action_type": "A",
  "action_type_description": "NEW",
  "modification_number": null,
  "action_date": "2024-09-15"
}
```

### Recommended Approach for V1

**Two-Phase Strategy**:

1. **Discovery Phase** (current implementation)
   - Use `/api/v2/search/spending_by_award/` for bulk retrieval
   - Fast, efficient pagination
   - Gets awards matching filters

2. **Enrichment Phase** (add in V1)
   - For each award, fetch `/api/v2/awards/{award_id}/`
   - Extract `latest_transaction_contract_data.action_type_description`
   - Filter for "NEW" awards or large modifications
   - Store transaction metadata alongside award data

### Heuristic Filtering (Without Transaction Data)

If you can't fetch transaction details, use these indicators:

#### 1. Start Date Proxy
```python
# Awards with recent start dates are likely new
df_new = df[df['start_date'] >= '2024-09-01']
```

**Limitation**: Misses large mods to old contracts

#### 2. Award Type Patterns
```python
# D (Definitive Contract) often = brand new standalone
# C (Delivery Order) often = task order against existing IDV
df_likely_new = df[df['award_type'] == 'D']
```

**Limitation**: Not reliable - all types can be new or modified

#### 3. Large Award Filter
```python
# Large contracts more likely worth pursuing regardless
df_large = df[df['award_amount'] >= 5_000_000]
```

**Limitation**: Doesn't distinguish new vs mod, just size

#### 4. Incremental Comparison (Track Over Time)
- Fetch awards weekly
- Compare `award_amount` between fetches
- Significant increase → recent modification
- New `award_id` → new contract

**Limitation**: Requires historical data and time

### Recommendation

**For V1, implement transaction enrichment** to reliably identify new contracts:

```typescript
// Pseudo-code
for (const award of awards) {
  const details = await fetchAwardDetails(award.award_id);
  const isNew = details.latest_transaction_contract_data.action_type_description === 'NEW';
  const modNumber = details.latest_transaction_contract_data.modification_number;

  award.is_new_contract = isNew;
  award.modification_number = modNumber;
}
```

This ensures you're not wasting time on $50K administrative mods to decade-old contracts.

---

## V1 Enhancement Opportunities

Based on this schema, you could:

1. **Enrich with parent IDV data** - understand which awards are task orders vs standalone
2. **Track transaction history** - see how awards evolve over time (mods, extensions)
3. **Link to subawards** - identify subcontracting opportunities
4. **Connect to appropriations** - understand funding sources via File C data

---

## Sources

- [Federal Spending Transparency - Award Types](https://fedspendingtransparency.github.io/whitepapers/types/)
- [Federal Contract Hierarchies (HigherGov)](https://docs.highergov.com/reference/federal-contract-hierarchies)
- [USAspending API Award Types](https://api.usaspending.gov/api/v2/references/award_types/)
- [USAspending API Transactions Endpoint](https://github.com/fedspendingtransparency/usaspending-api/blob/master/usaspending_api/api_contracts/contracts/v2/transactions.md)
- [Governmentwide Spending Data Model (GSDM)](https://tfx.treasury.gov/data-transparency/gsdm)
- [Federal Contract Award Data Hierarchy (GovTribe)](https://docs.govtribe.com/user-guide/what-is.../awards/federal-contract-award-data-hierarchy)

---

*Document created: 2026-01-08*

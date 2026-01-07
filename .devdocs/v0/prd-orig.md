Subcontract Opportunity Engine — V1 Specification

1. Purpose

The purpose of this system is to provide Othram with a reliable, repeatable way to discover newly awarded federal contracts that are likely to present legitimate subcontracting opportunities, and to surface them in a clear, human-reviewable format.

V1 prioritizes visibility, correctness, and speed to insight over automation or prediction.
________________________________________
2. Design Principles (V1)
•	Human-first review: Humans make prioritization decisions in V1.
•	No scoring / no ML: Avoid premature optimization.
•	Explainable by inspection: Every surfaced record should be understandable at a glance.
•	Post-award focus: Only contracts with real, awarded budgets.
•	Low operational overhead: Simple to maintain and extend.
________________________________________
3. Scope (In-Scope for V1)

Included
•	Automated ingestion of newly awarded federal contracts
•	Normalized storage of award data
•	Presentation as a sortable, filterable table
•	Manual workflow fields for human review
•	Basic alerts / notifications for new data

Explicitly Excluded
•	Automated prioritization or scoring
•	Automated outreach
•	Contact scraping or enrichment
•	Prediction of subcontracting plan clauses
•	CRM-grade relationship management
________________________________________
4. Data Source

Primary Source
•	USAspending API
o	Endpoint: /api/v2/search/spending_by_award/
o	Public, compliant, no credentials required
________________________________________
5. Award Eligibility Criteria

The system shall ingest awards meeting all of the following:
•	Award Type Codes: A, B, C, D
•	Award Amount: ≥ $900,000
•	Award Date: Within a configurable rolling window (default: last 30 days)
•	Award Category: Federal contracts only

Award Type Definitions
Code	Meaning	Interpretation for V1
A	Definitive Contract	Early strategic entry
B	Purchase Order	Low priority unless highly relevant
C	Delivery Order	High urgency execution
D	Task Order	Highest urgency execution

All types are ingested; interpretation affects human review behavior, not system logic.
________________________________________
6. System Workflow (End-to-End)
1.	Scheduled job queries USAspending for eligible awards
2.	Results are normalized and stored
3.	Duplicate awards are ignored or updated
4.	New awards appear in the review table
5.	Reviewers filter, sort, and annotate records
6.	Review status is updated manually
________________________________________
7. Core Data Model (V1)

Award Table (Minimum Fields)

Award Metadata
•	award_id
•	award_type (A/B/C/D)
•	award_amount
•	award_date
•	start_date
•	end_date

Agency Context
•	awarding_agency
•	awarding_sub_agency
•	funding_agency

Prime Contractor
•	recipient_name
•	recipient_uei
•	recipient_business_categories (as provided)

Work Description
•	award_description
•	naics_code
•	psc_code
•	place_of_performance_state

System Fields
•	ingested_at
•	source_url (USAspending link)
________________________________________
8. Human Review Fields (V1)

These fields are editable by users:
•	review_status
o	New
o	Reviewed
o	Pursue
o	Ignore
•	owner
•	notes
•	follow_up_date

No automation should change these fields.
________________________________________
9. User Interface Requirements

V1 UI may be minimal (internal page, Airtable, Notion, or basic web app).

Required capabilities:
•	Sort by:
o	Award date
o	Award amount
o	Award type
•	Filter by:
o	Award type (A/B/C/D)
o	Agency / sub-agency
o	Date range
o	Free-text search (description, prime name)
•	Click through to USAspending record
•	Inline editing of review fields
________________________________________
10. Notifications (Optional but Recommended)
•	Daily or weekly notification summarizing:
o	Number of new awards ingested
o	Top N awards by amount
•	Delivery via:
o	Slack
o	Email

No real-time alerting required for V1.
________________________________________
11. Operational Considerations
•	System should be idempotent (safe to re-run jobs)
•	Failures should not corrupt stored data
•	Rolling date window should be configurable
•	Award ingestion should complete in <5 minutes per run
________________________________________
12. Success Criteria (V1)

V1 is successful if:
•	New eligible awards appear reliably within 24 hours
•	Reviewers can scan and triage opportunities in minutes
•	No relevant awards are missed
•	The data is trusted by users


/**
 * Award data model types based on PRD specification
 */

export interface Award {
  // Award Metadata
  award_id: string;
  award_type: string;
  award_amount: number;
  award_date: string;
  start_date: string | null;
  end_date: string | null;
  last_modified_date: string | null;
  base_obligation_date: string | null;

  // Agency Context
  awarding_agency: string;
  awarding_sub_agency: string | null;
  funding_agency: string | null;

  // Prime Contractor
  recipient_name: string;
  recipient_uei: string | null;
  recipient_business_categories: string[];

  // Work Description
  award_description: string;
  naics_code: string | null;
  psc_code: string | null;
  place_of_performance_state: string | null;

  // System Fields
  ingested_at: string;
  source_url: string;
}

export interface AwardSummary {
  total_records: number;
  date_range: {
    start: string;
    end: string;
  };
  fetch_timestamp: string;
  total_amount: number;
  by_type: Record<string, number>;
  truncated?: boolean;
  truncation_reason?: string;
}

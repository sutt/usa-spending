/**
 * Transaction-level data types for USAspending API
 */

/**
 * Normalized transaction model
 * Represents a single action (new award, modification, etc.) on an award
 */
export interface Transaction {
  // Transaction identifiers
  transaction_id: string;
  award_id: string;

  // Action metadata
  action_date: string;
  action_type: string;
  action_type_description: string;
  modification_number: string | null;

  // Award amounts
  federal_action_obligation: number;
  total_dollars_obligated: number;

  // Award metadata
  award_type: string;
  award_description: string;

  // Dates
  period_of_performance_start_date: string | null;
  period_of_performance_current_end_date: string | null;

  // Agencies
  awarding_agency_name: string;
  awarding_sub_agency_name: string | null;
  funding_agency_name: string | null;

  // Recipient
  recipient_name: string;
  recipient_uei: string | null;

  // Classification codes
  naics_code: string | null;
  product_or_service_code: string | null;

  // Location
  place_of_performance_state: string | null;

  // System fields
  ingested_at: string;
  source_url: string;
}

/**
 * Summary statistics for transaction fetches
 */
export interface TransactionSummary {
  total_records: number;
  date_range: {
    start: string;
    end: string;
  };
  fetch_timestamp: string;
  total_obligation: number;
  by_action_type: Record<string, number>;
  by_award_type: Record<string, number>;
  unique_awards: number;
}

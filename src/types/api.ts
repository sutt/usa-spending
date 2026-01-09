/**
 * USAspending API request/response types
 */

export interface SpendingByAwardRequest {
  filters: FilterObject;
  fields: string[];
  limit?: number;
  page?: number;
  order?: 'asc' | 'desc';
  sort?: string;
  subawards?: boolean;
}

export interface FilterObject {
  award_type_codes?: string[];
  award_amounts?: {
    lower_bound?: number;
    upper_bound?: number;
  }[];
  time_period?: TimePeriod[];
  agencies?: {
    type: string;
    tier: string;
    name: string;
  }[];
  recipient_search_text?: string[];
  recipient_id?: string;
  recipient_scope?: string;
  recipient_locations?: any[];
  recipient_type_names?: string[];
  place_of_performance_scope?: string;
  place_of_performance_locations?: any[];
  award_ids?: string[];
  program_numbers?: string[];
  naics_codes?: any;
  psc_codes?: any;
  contract_pricing_type_codes?: string[];
  set_aside_type_codes?: string[];
  extent_competed_type_codes?: string[];
}

export interface TimePeriod {
  start_date: string;
  end_date: string;
}

export interface SpendingByAwardResponse {
  limit: number;
  page_metadata: {
    page: number;
    hasNext: boolean;
    last_record_unique_id?: number;
    last_record_sort_value?: string;
  };
  results: AwardResult[];
  messages?: string[];
}

export interface AwardResult {
  // Award identifiers
  'Award ID': string;
  'internal_id': string;
  'generated_internal_id': string;

  // Amounts
  'Award Amount': number;
  'Total Outlays': number;

  // Dates
  'Start Date': string;
  'End Date': string;
  'Award Date': string;
  'Last Date to Order': string | null;
  'Last Modified Date': string | null;
  'Base Obligation Date': string | null;

  // Agencies
  'Awarding Agency': string;
  'Awarding Agency Code': string;
  'Awarding Sub Agency': string;
  'Awarding Sub Agency Code': string;
  'Funding Agency': string;
  'Funding Agency Code': string;
  'Funding Sub Agency': string;
  'Funding Sub Agency Code': string;

  // Recipient
  'Recipient Name': string;
  'recipient_id': string;
  'Recipient UEI': string;
  'prime_award_recipient_id': string;

  // Contract specific
  'Award Type': string;
  'Contract Award Type': string;
  'IDV Type': string;

  // Description and codes
  'Description': string;
  'def_codes': string[];
  'COVID-19 Obligations': number;
  'COVID-19 Outlays': number;
  'Infrastructure Obligations': number;
  'Infrastructure Outlays': number;

  // Location
  'Place of Performance State Code': string;
  'Place of Performance Country Code': string;

  // Business categories
  'prime_award_recipient_name': string;
  'prime_award_base_transaction_description': string;
  'prime_award_piid': string;

  // PSC and NAICS
  'product_or_service_code': string;
  'naics_code': string;
  'naics_description': string;
}

/**
 * Fields to request from the API
 * Note: internal_id and generated_internal_id are returned automatically
 */
export const AWARD_FIELDS = [
  'Award ID',
  'Award Amount',
  'Last Modified Date',
  'Base Obligation Date',
  'Award Type',
  'Start Date',
  'End Date',
  'Awarding Agency',
  'Awarding Sub Agency',
  'Funding Agency',
  'Recipient Name',
  'Recipient UEI',
  'Description',
  'naics_code',
  'product_or_service_code',
  'Place of Performance State Code',
] as const;

/**
 * Transaction search request for spending_by_transaction endpoint
 */
export interface SpendingByTransactionRequest {
  filters: FilterObject;
  fields: string[];
  limit?: number;
  page?: number;
  order?: 'asc' | 'desc';
  sort?: string;
}

/**
 * Transaction search response
 */
export interface SpendingByTransactionResponse {
  limit: number;
  page_metadata: {
    page: number;
    hasNext: boolean;
    last_record_unique_id?: number;
    last_record_sort_value?: string;
  };
  results: TransactionResult[];
  messages?: string[];
}

/**
 * Individual transaction result from API
 */
export interface TransactionResult {
  // Transaction identifiers (auto-returned)
  'internal_id'?: string;
  'generated_internal_id'?: string;
  'Award ID': string;

  // Action metadata
  'Action Date': string;
  'Action Type': string;
  'Mod': string | null;  // Modification number

  // Amount
  'Transaction Amount': number;

  // Award type and description
  'Award Type': string;
  'Transaction Description': string;

  // Performance period dates
  'Issued Date': string | null;
  'Last Date to Order': string | null;

  // Agencies
  'Awarding Agency': string;
  'Awarding Sub Agency': string | null;
  'Funding Agency': string | null;

  // Recipient
  'Recipient Name': string;
  'Recipient UEI': string | null;

  // Classification
  'naics_code': string | null;
  'product_or_service_code': string | null;

  // Location
  'pop_state_code': string | null;
  'pop_city_name': string | null;
  'pop_country_name': string | null;
}

/**
 * Fields to request from transactions endpoint
 * Note: Transaction endpoint has different field names than awards endpoint
 */
export const TRANSACTION_FIELDS = [
  'Award ID',
  'Action Date',
  'Action Type',
  'Mod',  // Modification number
  'Transaction Amount',
  'Award Type',
  'Transaction Description',
  'Issued Date',
  'Last Date to Order',
  'Awarding Agency',
  'Awarding Sub Agency',
  'Funding Agency',
  'Recipient Name',
  'Recipient UEI',
  'naics_code',
  'product_or_service_code',
  'pop_state_code',  // Place of performance state
  'pop_city_name',
  'pop_country_name',
] as const;

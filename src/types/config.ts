/**
 * Application configuration types
 */

export interface AppConfig {
  api: ApiConfig;
  eligibility: EligibilityConfig;
  date_range: DateRangeConfig;
  output: OutputConfig;
  pagination: PaginationConfig;
}

export interface ApiConfig {
  base_url: string;
  endpoint: string;
  timeout: number;
}

export interface EligibilityConfig {
  award_types: string[];
  min_amount: number;
  rolling_days: number;
}

export interface DateRangeConfig {
  use_current_date: boolean;
  fixed_end_date: string;
}

export interface OutputConfig {
  directory: string;
  pretty_print: boolean;
  include_raw: boolean;
}

export interface PaginationConfig {
  page_size: number;
  max_records: number;
}

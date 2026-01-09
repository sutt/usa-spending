/**
 * Data fetcher service - orchestrates API calls and data processing
 */

import { subDays, format } from 'date-fns';
import { AppConfig } from '../types/config';
import { FilterObject } from '../types/api';
import { Award, AwardSummary } from '../types/award';
import { USASpendingClient } from '../api/client';
import { normalizeAwards } from './normalizer';

export class DataFetcher {
  private client: USASpendingClient;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.client = new USASpendingClient(config);
  }

  /**
   * Build filters based on configuration
   */
  private buildFilters(daysOverride?: number): FilterObject {
    const days = daysOverride || this.config.eligibility.rolling_days;

    // Determine end date from config
    const endDate = this.config.date_range.use_current_date
      ? new Date()
      : new Date(this.config.date_range.fixed_end_date);

    const startDate = subDays(endDate, days);

    console.log(`Date range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
    console.log(`Award types: ${this.config.eligibility.award_types.join(', ')}`);
    console.log(`Min amount: $${this.config.eligibility.min_amount.toLocaleString()}`);

    return {
      award_type_codes: this.config.eligibility.award_types,
      award_amounts: [
        {
          lower_bound: this.config.eligibility.min_amount,
        },
      ],
      time_period: [
        {
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
        },
      ],
    };
  }

  /**
   * Fetch awards for the configured time period
   */
  async fetchAwards(daysOverride?: number): Promise<{
    raw: any[];
    normalized: Award[];
    filters: FilterObject;
  }> {
    console.log('Starting award fetch...\n');

    const filters = this.buildFilters(daysOverride);
    const responses = await this.client.fetchAllAwards(filters);

    // Combine all results
    const allRawResults = responses.flatMap((r) => r.results);
    const normalizedAwards = normalizeAwards(allRawResults);

    console.log(`\nFetch complete. Total awards: ${normalizedAwards.length}`);

    return {
      raw: allRawResults,
      normalized: normalizedAwards,
      filters,
    };
  }

  /**
   * Generate summary statistics
   */
  generateSummary(awards: Award[], filters: FilterObject): AwardSummary {
    const totalAmount = awards.reduce((sum, award) => sum + award.award_amount, 0);
    const byType: Record<string, number> = {};

    awards.forEach((award) => {
      byType[award.award_type] = (byType[award.award_type] || 0) + 1;
    });

    return {
      total_records: awards.length,
      date_range: {
        start: filters.time_period?.[0]?.start_date || '',
        end: filters.time_period?.[0]?.end_date || '',
      },
      fetch_timestamp: new Date().toISOString(),
      total_amount: totalAmount,
      by_type: byType,
    };
  }
}

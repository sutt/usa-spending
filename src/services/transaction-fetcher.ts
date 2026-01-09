/**
 * Transaction fetcher service
 * Handles fetching, filtering, and normalizing transaction data from USAspending API
 */

import { USASpendingClient } from '../api/client';
import { AppConfig } from '../types/config';
import { FilterObject, TransactionResult } from '../types/api';
import { Transaction, TransactionSummary } from '../types/transaction';
import {
  normalizeTransactions,
  generateTransactionSummary,
} from './transaction-normalizer';
import { subDays, format } from 'date-fns';

export class TransactionFetcher {
  private client: USASpendingClient;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.client = new USASpendingClient(config);
  }

  /**
   * Build filters for transaction search
   */
  private buildFilters(daysBack?: number): FilterObject {
    // Use provided days or config default
    const days = daysBack || this.config.eligibility.rolling_days;

    // Determine end date from config
    const endDate = this.config.date_range.use_current_date
      ? new Date()
      : new Date(this.config.date_range.fixed_end_date);

    const startDate = subDays(endDate, days);

    const filters: FilterObject = {
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

    console.log('Transaction filters:', JSON.stringify(filters, null, 2));
    return filters;
  }

  /**
   * Fetch and normalize transactions
   */
  async fetchTransactions(daysBack?: number): Promise<{
    raw: TransactionResult[];
    normalized: Transaction[];
    filters: FilterObject;
  }> {
    console.log('Building transaction filters...');
    const filters = this.buildFilters(daysBack);

    console.log('Fetching transactions from USAspending API...');
    const responses = await this.client.fetchAllTransactions(filters);

    // Flatten all results
    const rawTransactions = responses.flatMap((r) => r.results);

    console.log(`\nTotal transactions fetched: ${rawTransactions.length}`);

    // Normalize transactions
    console.log('Normalizing transaction data...');
    const normalizedTransactions = normalizeTransactions(rawTransactions);

    return {
      raw: rawTransactions,
      normalized: normalizedTransactions,
      filters,
    };
  }

  /**
   * Generate summary statistics
   */
  generateSummary(
    transactions: Transaction[],
    filters: FilterObject
  ): TransactionSummary {
    return generateTransactionSummary(transactions, filters);
  }
}

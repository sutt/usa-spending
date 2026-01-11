/**
 * USAspending API client
 */

import axios, { AxiosInstance } from 'axios';
import { AppConfig } from '../types/config';
import {
  SpendingByAwardRequest,
  SpendingByAwardResponse,
  SpendingByTransactionRequest,
  SpendingByTransactionResponse,
  FilterObject,
  AWARD_FIELDS,
  TRANSACTION_FIELDS,
  AwardResult,
} from '../types/api';
import { Award } from '../types/award';
import { normalizeAwards } from '../services/normalizer';

export class USASpendingClient {
  private client: AxiosInstance;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.api.base_url,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch awards from the spending_by_award endpoint
   */
  async fetchAwards(
    filters: FilterObject,
    page: number = 1,
    limit?: number
  ): Promise<SpendingByAwardResponse> {
    const requestBody: SpendingByAwardRequest = {
      filters,
      fields: [...AWARD_FIELDS],
      page,
      limit: limit || this.config.pagination.page_size,
      order: 'desc',
      sort: 'Award Amount',
    };

    try {
      console.log(`Fetching page ${page} with limit ${requestBody.limit}...`);

      const response = await this.client.post<SpendingByAwardResponse>(
        this.config.api.endpoint,
        requestBody
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `API request failed: ${error.message}. ` +
          `Status: ${error.response?.status}, ` +
          `Data: ${JSON.stringify(error.response?.data)}`
        );
      }
      throw error;
    }
  }

  /**
   * Fetch all pages of awards matching the filters
   */
  async fetchAllAwards(filters: FilterObject): Promise<SpendingByAwardResponse[]> {
    const responses: SpendingByAwardResponse[] = [];
    let currentPage = 1;
    let hasMore = true;
    let totalFetched = 0;
    let stoppedByHasNext = false;

    while (hasMore && totalFetched < this.config.pagination.max_records) {
      const response = await this.fetchAwards(filters, currentPage);
      responses.push(response);

      totalFetched += response.results.length;
      hasMore = response.page_metadata.hasNext;
      currentPage++;

      console.log(
        `Fetched ${response.results.length} awards (total: ${totalFetched}). ` +
        `Has more: ${hasMore}`
      );

      // Track if we stopped because of hasNext
      if (!hasMore) {
        stoppedByHasNext = true;
      }

      // Safety check
      if (totalFetched >= this.config.pagination.max_records) {
        console.log(`Reached max_records limit (${this.config.pagination.max_records})`);
        break;
      }
    }

    // Check for artificial truncation by API limit
    this.checkForTruncation(totalFetched, responses.length, stoppedByHasNext, 'awards');

    return responses;
  }

  /**
   * Fetch transactions from the spending_by_transaction endpoint
   */
  async fetchTransactions(
    filters: FilterObject,
    page: number = 1,
    limit?: number
  ): Promise<SpendingByTransactionResponse> {
    const requestBody: SpendingByTransactionRequest = {
      filters,
      fields: [...TRANSACTION_FIELDS],
      page,
      limit: limit || this.config.pagination.page_size,
      order: 'desc',
      sort: 'Action Date',
    };

    try {
      console.log(`Fetching transactions page ${page} with limit ${requestBody.limit}...`);

      const response = await this.client.post<SpendingByTransactionResponse>(
        '/api/v2/search/spending_by_transaction/',
        requestBody
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Transaction API request failed: ${error.message}. ` +
          `Status: ${error.response?.status}, ` +
          `Data: ${JSON.stringify(error.response?.data)}`
        );
      }
      throw error;
    }
  }

  /**
   * Fetch all pages of transactions matching the filters
   */
  async fetchAllTransactions(filters: FilterObject): Promise<SpendingByTransactionResponse[]> {
    const responses: SpendingByTransactionResponse[] = [];
    let currentPage = 1;
    let hasMore = true;
    let totalFetched = 0;
    let stoppedByHasNext = false;

    while (hasMore && totalFetched < this.config.pagination.max_records) {
      const response = await this.fetchTransactions(filters, currentPage);
      responses.push(response);

      totalFetched += response.results.length;
      hasMore = response.page_metadata.hasNext;
      currentPage++;

      console.log(
        `Fetched ${response.results.length} transactions (total: ${totalFetched}). ` +
        `Has more: ${hasMore}`
      );

      // Track if we stopped because of hasNext
      if (!hasMore) {
        stoppedByHasNext = true;
      }

      // Safety check
      if (totalFetched >= this.config.pagination.max_records) {
        console.log(`Reached max_records limit (${this.config.pagination.max_records})`);
        break;
      }
    }

    // Check for artificial truncation by API limit
    this.checkForTruncation(totalFetched, responses.length, stoppedByHasNext, 'transactions');

    return responses;
  }

  /**
   * Fetch awards by specific award IDs
   * This bypasses the 10k pagination limit and sorting issues
   *
   * @param awardIds - Array of award IDs to fetch
   * @param batchSize - Number of IDs per request (default: 100)
   * @returns Array of awards
   */
  async fetchAwardsByIds(
    awardIds: string[],
    batchSize: number = 100
  ): Promise<Award[]> {
    console.log(`\nFetching ${awardIds.length} awards by ID (batch size: ${batchSize})...`);

    const allAwards: AwardResult[] = [];
    const totalBatches = Math.ceil(awardIds.length / batchSize);

    // Process in batches
    for (let i = 0; i < awardIds.length; i += batchSize) {
      const batch = awardIds.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;

      console.log(`  Batch ${batchNum}/${totalBatches}: Fetching ${batch.length} awards...`);

      // Determine award types from config
      const awardTypes = this.config.eligibility.award_types.length > 0
        ? this.config.eligibility.award_types
        : ['A', 'B', 'C', 'D', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];

      const filters: FilterObject = {
        award_ids: batch,
        award_type_codes: awardTypes
      };

      try {
        const responses = await this.fetchAllAwards(filters);
        const batchResults = responses.flatMap(r => r.results);
        allAwards.push(...batchResults);

        console.log(`    ✓ Fetched ${batchResults.length} awards`);
      } catch (error) {
        console.error(`    ✗ Batch ${batchNum} failed:`, error);
        // Continue with next batch
      }
    }

    console.log(`\n✓ Total awards fetched: ${allAwards.length} / ${awardIds.length} requested`);

    return normalizeAwards(allAwards);
  }

  /**
   * Check if results were artificially truncated by API limit
   * Display prominent warning if detected
   */
  private checkForTruncation(
    totalFetched: number,
    pagesFetched: number,
    stoppedByHasNext: boolean,
    dataType: 'awards' | 'transactions'
  ): void {
    // Known API limit: 10,000 records at 100 pages
    const KNOWN_API_LIMIT = 10000;
    const EXPECTED_PAGES_AT_LIMIT = Math.ceil(KNOWN_API_LIMIT / this.config.pagination.page_size);

    const hitLimit = (
      totalFetched === KNOWN_API_LIMIT &&
      pagesFetched === EXPECTED_PAGES_AT_LIMIT &&
      stoppedByHasNext
    );

    if (hitLimit) {
      this.displayTruncationWarning(totalFetched, dataType);
    }
  }

  /**
   * Display prominent warning about truncated results
   */
  private displayTruncationWarning(totalFetched: number, dataType: 'awards' | 'transactions'): void {
    const border = '═'.repeat(80);
    const warningLines = [
      '',
      border,
      '⚠️  WARNING: RESULTS LIKELY INCOMPLETE - API PAGINATION LIMIT HIT',
      border,
      '',
      `Fetched exactly ${totalFetched.toLocaleString()} ${dataType} (100 pages).`,
      '',
      'The USAspending API returns hasNext=false at 10,000 records, but more',
      'data may exist beyond this limit.',
      '',
      '🔍 IMPACT:',
      dataType === 'awards'
        ? '   - Smaller awards (by amount) may be missing from the dataset'
        : '   - Older transactions (by date) may be missing from the dataset',
      dataType === 'awards'
        ? '   - Awards sorted by amount DESC - only largest 10k were fetched'
        : '   - Transactions sorted by date DESC - only most recent 10k were fetched',
      '   - Transaction-to-award joins may fail if awards are missing',
      '',
      '✅ SOLUTIONS:',
      '   1. Use fetch:complete command (two-stage fetch: transactions → awards)',
      '   2. Narrow your filters (date range, award types, amount threshold)',
      dataType === 'awards'
        ? '   3. Fetch transactions first, then fetch awards by award_id'
        : '   3. Reduce the date range to capture fewer transactions',
      '',
      '📖 See: .devdocs/award-transaction-join-analysis-CORRECTED.md',
      '',
      border,
      ''
    ].join('\n');

    console.warn(warningLines);
  }
}

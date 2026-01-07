/**
 * USAspending API client
 */

import axios, { AxiosInstance } from 'axios';
import { AppConfig } from '../types/config';
import {
  SpendingByAwardRequest,
  SpendingByAwardResponse,
  FilterObject,
  AWARD_FIELDS,
} from '../types/api';

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

      // Safety check
      if (totalFetched >= this.config.pagination.max_records) {
        console.log(`Reached max_records limit (${this.config.pagination.max_records})`);
        break;
      }
    }

    return responses;
  }
}

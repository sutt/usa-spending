/**
 * Types for two-stage complete fetch (transactions + awards)
 */

import { Transaction } from './transaction';
import { Award } from './award';

export interface CompleteFetchResult {
  transactions: Transaction[];
  awards: Award[];
  stats: CompleteFetchStats;
}

export interface CompleteFetchStats {
  // Stage 1: Transactions
  totalTransactions: number;
  newTransactions: number;
  uniqueAwardIds: number;

  // Stage 2: Awards
  awardsRequested: number;
  awardsFetched: number;
  awardsMissing: number;
  missingAwardIds: string[];

  // Join Analysis
  transactionsWithAward: number;
  transactionsWithoutAward: number;
  joinRate: number;

  // Metadata
  fetchTimestamp: string;
  dateRange: {
    start: string;
    end: string;
  };
  filters: {
    awardTypes: string[];
    minAmount: number;
    rollingDays: number;
  };
}

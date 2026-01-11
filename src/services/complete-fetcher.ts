/**
 * Complete Fetcher Service - Two-Stage Fetch
 * Fetches transactions first, then fetches awards by their IDs
 * Guarantees high match rate between transactions and awards
 */

import { TransactionFetcher } from './transaction-fetcher';
import { USASpendingClient } from '../api/client';
import { AppConfig } from '../types/config';
import { Transaction } from '../types/transaction';
import { Award } from '../types/award';
import { CompleteFetchResult, CompleteFetchStats } from '../types/complete-fetch';

export class CompleteFetcher {
  private config: AppConfig;
  private client: USASpendingClient;
  private txFetcher: TransactionFetcher;

  constructor(config: AppConfig) {
    this.config = config;
    this.client = new USASpendingClient(config);
    this.txFetcher = new TransactionFetcher(config);
  }

  /**
   * Execute two-stage fetch: transactions → awards
   * Guarantees high match rate by fetching awards by ID
   */
  async fetchComplete(daysBack?: number): Promise<CompleteFetchResult> {
    console.log('\n' + '═'.repeat(80));
    console.log('TWO-STAGE COMPLETE FETCH');
    console.log('═'.repeat(80));
    console.log('Stage 1: Fetch transactions');
    console.log('Stage 2: Fetch awards by transaction award_ids');
    console.log('Result: Guaranteed high match rate');
    console.log('═'.repeat(80) + '\n');

    // Stage 1: Fetch transactions
    const txResult = await this.fetchTransactionsStage(daysBack);

    // Stage 2: Fetch awards by ID
    const awResult = await this.fetchAwardsByIdStage(txResult.uniqueAwardIds);

    // Analyze join
    const joinAnalysis = this.analyzeJoin(txResult.newTransactions, awResult.awards);

    // Build stats
    const stats: CompleteFetchStats = {
      // Stage 1
      totalTransactions: txResult.totalTransactions,
      newTransactions: txResult.newTransactions.length,
      uniqueAwardIds: txResult.uniqueAwardIds.length,

      // Stage 2
      awardsRequested: txResult.uniqueAwardIds.length,
      awardsFetched: awResult.awards.length,
      awardsMissing: txResult.uniqueAwardIds.length - awResult.awards.length,
      missingAwardIds: awResult.missingIds,

      // Join
      transactionsWithAward: joinAnalysis.matched,
      transactionsWithoutAward: joinAnalysis.unmatched,
      joinRate: joinAnalysis.matchRate,

      // Metadata
      fetchTimestamp: new Date().toISOString(),
      dateRange: txResult.dateRange,
      filters: {
        awardTypes: this.config.eligibility.award_types,
        minAmount: this.config.eligibility.min_amount,
        rollingDays: daysBack || this.config.eligibility.rolling_days
      }
    };

    // Display summary
    this.displaySummary(stats);

    return {
      transactions: txResult.newTransactions,
      awards: awResult.awards,
      stats
    };
  }

  /**
   * Stage 1: Fetch and filter transactions
   */
  private async fetchTransactionsStage(daysBack?: number) {
    console.log('\n┌─ STAGE 1: FETCH TRANSACTIONS ─────────────────────────────┐\n');

    const { normalized: allTransactions, filters } = await this.txFetcher.fetchTransactions(daysBack);

    console.log(`\n✓ Fetched ${allTransactions.length} total transactions`);

    // Filter to "new" transactions
    console.log('\nFiltering to new transactions (modification_number=0 or action_type=NEW)...');
    const newTransactions = allTransactions.filter(tx =>
      tx.modification_number === '0' || tx.action_type_description === 'NEW'
    );

    console.log(`✓ Found ${newTransactions.length} new transactions`);

    // Apply amount threshold
    const minAmount = this.config.eligibility.min_amount;
    const filteredTransactions = minAmount > 0
      ? newTransactions.filter(tx => tx.federal_action_obligation >= minAmount)
      : newTransactions;

    if (minAmount > 0) {
      console.log(`\nApplying minimum amount filter: >= $${minAmount.toLocaleString()}...`);
      console.log(`✓ ${filteredTransactions.length} transactions after amount filter`);
    }

    // Extract unique award IDs
    console.log('\nExtracting unique award_ids...');
    const uniqueAwardIds = [...new Set(filteredTransactions.map(tx => tx.award_id))];
    console.log(`✓ Found ${uniqueAwardIds.length} unique awards referenced by transactions`);

    console.log('\n└───────────────────────────────────────────────────────────┘');

    return {
      totalTransactions: allTransactions.length,
      newTransactions: filteredTransactions,
      uniqueAwardIds,
      dateRange: {
        start: filters.time_period?.[0]?.start_date || '',
        end: filters.time_period?.[0]?.end_date || ''
      }
    };
  }

  /**
   * Stage 2: Fetch awards by their IDs
   */
  private async fetchAwardsByIdStage(awardIds: string[]) {
    console.log('\n┌─ STAGE 2: FETCH AWARDS BY ID ─────────────────────────────┐\n');

    const batchSize = this.config.pagination.page_size;
    const awards = await this.client.fetchAwardsByIds(awardIds, batchSize);

    // Find missing IDs
    const fetchedIds = new Set(awards.map(a => a.award_id));
    const missingIds = awardIds.filter(id => !fetchedIds.has(id));

    if (missingIds.length > 0) {
      console.log(`\n⚠️  ${missingIds.length} award IDs could not be fetched:`);
      console.log(`   (First 10): ${missingIds.slice(0, 10).join(', ')}`);
    }

    console.log('\n└───────────────────────────────────────────────────────────┘');

    return {
      awards,
      missingIds
    };
  }

  /**
   * Analyze join between transactions and awards
   */
  private analyzeJoin(transactions: Transaction[], awards: Award[]) {
    const awardIds = new Set(awards.map(a => a.award_id));

    let matched = 0;
    let unmatched = 0;

    transactions.forEach(tx => {
      if (awardIds.has(tx.award_id)) {
        matched++;
      } else {
        unmatched++;
      }
    });

    const matchRate = transactions.length > 0
      ? (matched / transactions.length) * 100
      : 0;

    return { matched, unmatched, matchRate };
  }

  /**
   * Display final summary
   */
  private displaySummary(stats: CompleteFetchStats): void {
    console.log('\n' + '═'.repeat(80));
    console.log('COMPLETE FETCH SUMMARY');
    console.log('═'.repeat(80));
    console.log('\n📊 STAGE 1: TRANSACTIONS');
    console.log(`   Total transactions fetched: ${stats.totalTransactions.toLocaleString()}`);
    console.log(`   New transactions: ${stats.newTransactions.toLocaleString()}`);
    console.log(`   Unique awards referenced: ${stats.uniqueAwardIds.toLocaleString()}`);

    console.log('\n🎯 STAGE 2: AWARDS');
    console.log(`   Awards requested: ${stats.awardsRequested.toLocaleString()}`);
    console.log(`   Awards fetched: ${stats.awardsFetched.toLocaleString()}`);
    console.log(`   Awards missing: ${stats.awardsMissing.toLocaleString()}`);

    console.log('\n🔗 JOIN ANALYSIS');
    console.log(`   Transactions with award: ${stats.transactionsWithAward.toLocaleString()}`);
    console.log(`   Transactions without award: ${stats.transactionsWithoutAward.toLocaleString()}`);
    console.log(`   Join rate: ${stats.joinRate.toFixed(1)}%`);

    if (stats.joinRate >= 95) {
      console.log('\n✅ EXCELLENT: >95% join rate achieved!');
    } else if (stats.joinRate >= 85) {
      console.log('\n✓ GOOD: >85% join rate achieved');
    } else {
      console.log('\n⚠️  WARNING: Join rate below 85%');
    }

    console.log('\n' + '═'.repeat(80) + '\n');
  }
}

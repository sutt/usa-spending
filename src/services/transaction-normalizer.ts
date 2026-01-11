/**
 * Transaction data normalization service
 * Transforms raw API transaction responses into normalized Transaction objects
 */

import { TransactionResult } from '../types/api';
import { Transaction, TransactionSummary } from '../types/transaction';
import { FilterObject } from '../types/api';

/**
 * Normalize a single transaction from API format to our internal model
 */
export function normalizeTransaction(apiTransaction: TransactionResult): Transaction {
  // Generate transaction ID
  const transactionId = apiTransaction.internal_id ||
                       apiTransaction.generated_internal_id ||
                       `${apiTransaction['Award ID']}_${apiTransaction['Action Date']}`;

  // Extract award ID - handle incomplete IDs from API
  // Some transactions return just "0001" instead of full contract ID
  // The full ID is embedded in generated_internal_id like: CONT_AWD_0001_9700_W52P1J13G0027_9700
  let awardId = apiTransaction['Award ID'];

  // If Award ID is suspiciously short (like "0001"), try to extract from generated_internal_id
  if (awardId && awardId.length <= 4 && /^\d+$/.test(awardId)) {
    const genId = apiTransaction.generated_internal_id;
    if (genId) {
      // Extract the real contract ID from pattern: CONT_AWD_0001_9700_W52P1J13G0027_9700
      const parts = genId.split('_');
      if (parts.length >= 6) {
        // The real contract ID is typically at index 4
        const extractedId = parts[4];
        if (extractedId && extractedId.length > 4) {
          awardId = extractedId;
        }
      }
    }
  }

  const sourceUrl = `https://www.usaspending.gov/award/${awardId}`;

  // Map action type code to description
  const actionTypeMap: Record<string, string> = {
    'A': 'NEW',
    'B': 'CONTINUATION',
    'C': 'REVISION',
    'D': 'FUNDING_ADJUSTMENT',
    'E': 'CORRECTION',
  };
  const actionType = apiTransaction['Action Type'] || '';
  const actionTypeDescription = actionTypeMap[actionType] || actionType || 'Unknown';

  return {
    // Identifiers
    transaction_id: transactionId,
    award_id: awardId,
    generated_internal_id: apiTransaction.generated_internal_id || null,

    // Action metadata
    action_date: apiTransaction['Action Date'] || '',
    action_type: actionType,
    action_type_description: actionTypeDescription,
    modification_number: apiTransaction['Mod'],

    // Amounts
    federal_action_obligation: apiTransaction['Transaction Amount'] || 0,
    total_dollars_obligated: apiTransaction['Transaction Amount'] || 0,  // Same as federal action obligation

    // Award metadata
    award_type: apiTransaction['Award Type'] || 'Unknown',
    award_description: apiTransaction['Transaction Description'] || '',

    // Dates
    period_of_performance_start_date: apiTransaction['Issued Date'],
    period_of_performance_current_end_date: apiTransaction['Last Date to Order'],

    // Agencies
    awarding_agency_name: apiTransaction['Awarding Agency'] || '',
    awarding_sub_agency_name: apiTransaction['Awarding Sub Agency'],
    funding_agency_name: apiTransaction['Funding Agency'],

    // Recipient
    recipient_name: apiTransaction['Recipient Name'] || '',
    recipient_uei: apiTransaction['Recipient UEI'],

    // Classification
    naics_code: apiTransaction['naics_code'],
    product_or_service_code: apiTransaction['product_or_service_code'],

    // Location
    place_of_performance_state: apiTransaction['pop_state_code'],

    // System fields
    ingested_at: new Date().toISOString(),
    source_url: sourceUrl,
  };
}

/**
 * Normalize an array of transactions
 */
export function normalizeTransactions(apiTransactions: TransactionResult[]): Transaction[] {
  return apiTransactions.map(normalizeTransaction);
}

/**
 * Generate summary statistics from normalized transactions
 */
export function generateTransactionSummary(
  transactions: Transaction[],
  filters: FilterObject
): TransactionSummary {
  // Calculate total obligation
  const totalObligation = transactions.reduce(
    (sum, t) => sum + (t.federal_action_obligation || 0),
    0
  );

  // Count by action type
  const byActionType: Record<string, number> = {};
  transactions.forEach((t) => {
    const actionType = t.action_type_description || 'Unknown';
    byActionType[actionType] = (byActionType[actionType] || 0) + 1;
  });

  // Count by award type
  const byAwardType: Record<string, number> = {};
  transactions.forEach((t) => {
    const awardType = t.award_type || 'Unknown';
    byAwardType[awardType] = (byAwardType[awardType] || 0) + 1;
  });

  // Count unique awards
  const uniqueAwards = new Set(transactions.map(t => t.award_id)).size;

  // Extract date range from filters
  const timePeriod = filters.time_period?.[0];
  const dateRange = {
    start: timePeriod?.start_date || '',
    end: timePeriod?.end_date || '',
  };

  return {
    total_records: transactions.length,
    date_range: dateRange,
    fetch_timestamp: new Date().toISOString(),
    total_obligation: totalObligation,
    by_action_type: byActionType,
    by_award_type: byAwardType,
    unique_awards: uniqueAwards,
  };
}

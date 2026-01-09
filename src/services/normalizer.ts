/**
 * Data normalization service - transforms API responses to PRD data model
 */

import { AwardResult } from '../types/api';
import { Award } from '../types/award';

/**
 * Transform API award result to normalized Award model
 */
export function normalizeAward(apiAward: AwardResult): Award {
  // Build USAspending source URL
  const sourceUrl = apiAward['internal_id']
    ? `https://www.usaspending.gov/award/${apiAward['internal_id']}`
    : `https://www.usaspending.gov/search/?hash=${apiAward['Award ID']}`;

  // Parse business categories if available (this field structure may vary)
  const businessCategories: string[] = [];

  return {
    // Award Metadata
    award_id: apiAward['Award ID'] || apiAward['internal_id'] || apiAward['generated_internal_id'],
    award_type: apiAward['Contract Award Type'] || apiAward['Award Type'] || 'Unknown',
    award_amount: apiAward['Award Amount'] || 0,
    award_date: apiAward['Award Date'] || '',
    start_date: apiAward['Start Date'] || null,
    end_date: apiAward['End Date'] || null,
    last_modified_date: apiAward['Last Modified Date'] || null,
    base_obligation_date: apiAward['Base Obligation Date'] || null,

    // Agency Context
    awarding_agency: apiAward['Awarding Agency'] || '',
    awarding_sub_agency: apiAward['Awarding Sub Agency'] || null,
    funding_agency: apiAward['Funding Agency'] || null,

    // Prime Contractor
    recipient_name: apiAward['Recipient Name'] || '',
    recipient_uei: apiAward['Recipient UEI'] || null,
    recipient_business_categories: businessCategories,

    // Work Description
    award_description: apiAward['Description'] || '',
    naics_code: apiAward['naics_code'] || null,
    psc_code: apiAward['product_or_service_code'] || null,
    place_of_performance_state: apiAward['Place of Performance State Code'] || null,

    // System Fields
    ingested_at: new Date().toISOString(),
    source_url: sourceUrl,
  };
}

/**
 * Normalize an array of API awards
 */
export function normalizeAwards(apiAwards: AwardResult[]): Award[] {
  return apiAwards.map(normalizeAward);
}

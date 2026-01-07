/**
 * Simple API test to verify endpoint accessibility
 */

import axios from 'axios';

async function testAPI() {
  const url = 'https://api.usaspending.gov/api/v2/search/spending_by_award/';

  // Simple request with minimal fields
  const requestBody = {
    filters: {
      award_type_codes: ['A', 'B', 'C', 'D'],
      time_period: [
        {
          start_date: '2024-09-01',
          end_date: '2024-09-30',
        },
      ],
      award_amounts: [
        {
          lower_bound: 900000,
        },
      ],
    },
    fields: [
      'Award ID',
      'Award Amount',
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
    ],
    limit: 10,
    page: 1,
  };

  console.log('Testing API with request:');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('\nSending request...\n');

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    console.log('Success!');
    console.log('Status:', response.status);
    console.log('Results count:', response.data.results?.length);
    console.log('\nSample result:');
    console.log(JSON.stringify(response.data.results?.[0], null, 2));
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAPI();

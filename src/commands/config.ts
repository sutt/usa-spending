/**
 * Config command - display current configuration
 */

import { Command } from 'commander';
import { loadConfig } from '../utils/config';

export function createConfigCommand(): Command {
  const command = new Command('config');

  command
    .description('Display current configuration')
    .option('-c, --config <path>', 'Path to config file')
    .action((options) => {
      try {
        const config = loadConfig(options.config);

        console.log('=== Current Configuration ===\n');
        console.log('API:');
        console.log(`  Base URL: ${config.api.base_url}`);
        console.log(`  Endpoint: ${config.api.endpoint}`);
        console.log(`  Timeout: ${config.api.timeout}ms`);

        console.log('\nEligibility Criteria:');
        console.log(`  Award Types: ${config.eligibility.award_types.join(', ')}`);
        console.log(`  Min Amount: $${config.eligibility.min_amount.toLocaleString()}`);
        console.log(`  Rolling Days: ${config.eligibility.rolling_days}`);

        console.log('\nOutput:');
        console.log(`  Directory: ${config.output.directory}`);
        console.log(`  Pretty Print: ${config.output.pretty_print}`);
        console.log(`  Include Raw: ${config.output.include_raw}`);

        console.log('\nPagination:');
        console.log(`  Page Size: ${config.pagination.page_size}`);
        console.log(`  Max Records: ${config.pagination.max_records}`);
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}

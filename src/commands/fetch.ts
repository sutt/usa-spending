/**
 * Fetch awards command - fetches award-level summaries from USAspending API
 */

import { Command } from 'commander';
import { loadConfig } from '../utils/config';
import { DataFetcher } from '../services/fetcher';
import { StorageService } from '../services/storage';

export function createFetchCommand(): Command {
  const command = new Command('fetch:award');

  command
    .description('Fetch award-level summaries from USAspending API (rolled-up data)')
    .option('-d, --days <number>', 'Number of days to look back (overrides config)', parseInt)
    .option('-c, --config <path>', 'Path to config file')
    .option('-o, --output <path>', 'Custom output directory (overrides config)')
    .action(async (options) => {
      try {
        console.log('=== USAspending Award Fetcher ===\n');

        // Load configuration
        const config = loadConfig(options.config);

        // Override output directory if specified
        if (options.output) {
          config.output.directory = options.output;
        }

        // Initialize services
        const fetcher = new DataFetcher(config);
        const storage = new StorageService(config);

        // Fetch awards
        const { raw, normalized, filters } = await fetcher.fetchAwards(options.days);

        // Generate summary
        const summary = fetcher.generateSummary(normalized, filters);

        // Display summary to console
        console.log('\n=== Fetch Summary ===');
        console.log(`Total Records: ${summary.total_records}`);
        console.log(`Total Amount: $${summary.total_amount.toLocaleString()}`);
        console.log(`Date Range: ${summary.date_range.start} to ${summary.date_range.end}`);
        console.log('\nAwards by Type:');
        Object.entries(summary.by_type).forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`);
        });

        // Save to files
        console.log('\n=== Saving Files ===');
        storage.saveAwards(raw, normalized, summary);

        console.log('\n=== Complete ===');
        console.log('Files saved successfully!');
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}

/**
 * fetch:complete command - Two-stage fetch for high match rate
 * Fetches transactions first, then fetches awards by their IDs
 */

import { Command } from 'commander';
import { loadConfig } from '../utils/config';
import { CompleteFetcher } from '../services/complete-fetcher';
import { StorageService } from '../services/storage';

export function createFetchCompleteCommand(): Command {
  const command = new Command('fetch:complete');

  command
    .description('Two-stage fetch: transactions + their awards (guarantees high join rate)')
    .option('-d, --days <number>', 'Number of days to look back (overrides config)', parseInt)
    .option('-c, --config <path>', 'Path to config file')
    .option('-o, --output <path>', 'Custom output directory (overrides config)')
    .action(async (options) => {
      try {
        console.log('=== USAspending Complete Fetcher ===\n');

        // Load configuration
        const config = loadConfig(options.config);

        // Override output directory if specified
        if (options.output) {
          config.output.directory = options.output;
        }

        // Initialize services
        const fetcher = new CompleteFetcher(config);
        const storage = new StorageService(config);

        // Execute two-stage fetch
        const result = await fetcher.fetchComplete(options.days);

        // Save results
        console.log('\n=== Saving Files ===');
        storage.saveCompleteFetch(result);

        console.log('\n=== Complete ===');
        console.log('✅ Complete fetch finished successfully!');

      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}

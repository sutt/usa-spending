/**
 * Fetch transactions command - fetches transaction-level data from USAspending API
 */

import { Command } from 'commander';
import { loadConfig } from '../utils/config';
import { TransactionFetcher } from '../services/transaction-fetcher';
import { StorageService } from '../services/storage';

export function createFetchTransactionsCommand(): Command {
  const command = new Command('fetch:transaction');

  command
    .description('Fetch transaction-level data from USAspending API (includes action types, modifications)')
    .option('-d, --days <number>', 'Number of days to look back (overrides config)', parseInt)
    .option('-c, --config <path>', 'Path to config file')
    .option('-o, --output <path>', 'Custom output directory (overrides config)')
    .action(async (options) => {
      try {
        console.log('=== USAspending Transaction Fetcher ===\n');

        // Load configuration
        const config = loadConfig(options.config);

        // Override output directory if specified
        if (options.output) {
          config.output.directory = options.output;
        }

        // Initialize services
        const fetcher = new TransactionFetcher(config);
        const storage = new StorageService(config);

        // Fetch transactions
        const { raw, normalized, filters } = await fetcher.fetchTransactions(options.days);

        // Generate summary
        const summary = fetcher.generateSummary(normalized, filters);

        // Display summary to console
        console.log('\n=== Fetch Summary ===');
        console.log(`Total Transactions: ${summary.total_records}`);
        console.log(`Unique Awards: ${summary.unique_awards}`);
        console.log(`Total Obligation: $${summary.total_obligation.toLocaleString()}`);
        console.log(`Date Range: ${summary.date_range.start} to ${summary.date_range.end}`);

        console.log('\nTransactions by Action Type:');
        Object.entries(summary.by_action_type)
          .sort(([, a], [, b]) => b - a)
          .forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
          });

        console.log('\nTransactions by Award Type:');
        Object.entries(summary.by_award_type)
          .sort(([, a], [, b]) => b - a)
          .forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
          });

        // Save to files
        console.log('\n=== Saving Files ===');
        storage.saveTransactions(raw, normalized, summary);

        console.log('\n=== Complete ===');
        console.log('Transaction files saved successfully!');
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}

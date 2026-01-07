/**
 * Analyze command - filter and sort existing award data
 */

import { Command } from 'commander';
import { loadConfig } from '../utils/config';
import { StorageService } from '../services/storage';
import * as path from 'path';

export function createAnalyzeCommand(): Command {
  const command = new Command('analyze');

  command
    .description('Filter and sort existing award data')
    .option('-f, --file <path>', 'Path to normalized awards JSON file')
    .option('-t, --type <types>', 'Filter by award types (comma-separated, e.g., A,B,C)')
    .option('-a, --agency <name>', 'Filter by agency name (substring match)')
    .option('--min-amount <number>', 'Minimum award amount', parseFloat)
    .option('--max-amount <number>', 'Maximum award amount', parseFloat)
    .option('-s, --sort <field>', 'Sort by field (amount, date, type)', 'amount')
    .option('--order <order>', 'Sort order (asc, desc)', 'desc')
    .option('-o, --output <path>', 'Output file path')
    .action(async (options) => {
      try {
        console.log('=== Award Data Analyzer ===\n');

        const config = loadConfig();
        const storage = new StorageService(config);

        // Determine input file
        let inputFile = options.file;
        if (!inputFile) {
          const files = storage.listAwardFiles();
          if (files.length === 0) {
            throw new Error('No award files found. Run "fetch" command first.');
          }
          inputFile = files[0]; // Use most recent
          console.log(`Using most recent file: ${path.basename(inputFile)}\n`);
        }

        // Load awards
        let awards = storage.readNormalizedAwards(inputFile);
        console.log(`Loaded ${awards.length} awards\n`);

        // Apply filters
        const originalCount = awards.length;

        if (options.type) {
          const types = options.type.split(',').map((t: string) => t.trim().toUpperCase());
          awards = awards.filter((a) => types.includes(a.award_type.toUpperCase()));
          console.log(`Filtered by type [${types.join(', ')}]: ${awards.length} awards`);
        }

        if (options.agency) {
          const agencySearch = options.agency.toLowerCase();
          awards = awards.filter((a) =>
            a.awarding_agency.toLowerCase().includes(agencySearch) ||
            (a.awarding_sub_agency?.toLowerCase().includes(agencySearch) ?? false)
          );
          console.log(`Filtered by agency "${options.agency}": ${awards.length} awards`);
        }

        if (options.minAmount !== undefined) {
          awards = awards.filter((a) => a.award_amount >= options.minAmount);
          console.log(`Filtered by min amount $${options.minAmount.toLocaleString()}: ${awards.length} awards`);
        }

        if (options.maxAmount !== undefined) {
          awards = awards.filter((a) => a.award_amount <= options.maxAmount);
          console.log(`Filtered by max amount $${options.maxAmount.toLocaleString()}: ${awards.length} awards`);
        }

        // Apply sorting
        const sortField = options.sort;
        const sortOrder = options.order === 'asc' ? 1 : -1;

        awards.sort((a, b) => {
          let comparison = 0;

          switch (sortField) {
            case 'amount':
              comparison = a.award_amount - b.award_amount;
              break;
            case 'date':
              comparison = new Date(a.award_date).getTime() - new Date(b.award_date).getTime();
              break;
            case 'type':
              comparison = a.award_type.localeCompare(b.award_type);
              break;
            default:
              throw new Error(`Unknown sort field: ${sortField}`);
          }

          return comparison * sortOrder;
        });

        console.log(`Sorted by ${sortField} (${options.order})\n`);

        // Display results summary
        console.log('=== Analysis Summary ===');
        console.log(`Original count: ${originalCount}`);
        console.log(`Filtered count: ${awards.length}`);
        console.log(`Reduction: ${((1 - awards.length / originalCount) * 100).toFixed(1)}%`);

        if (awards.length > 0) {
          const totalAmount = awards.reduce((sum, a) => sum + a.award_amount, 0);
          console.log(`\nTotal amount: $${totalAmount.toLocaleString()}`);
          console.log(`Average amount: $${Math.round(totalAmount / awards.length).toLocaleString()}`);
          console.log(`\nTop 5 awards by amount:`);
          awards.slice(0, 5).forEach((a, i) => {
            console.log(
              `  ${i + 1}. ${a.recipient_name} - $${a.award_amount.toLocaleString()} (${a.award_type})`
            );
          });
        }

        // Save if output specified
        if (options.output) {
          const fs = require('fs');
          fs.writeFileSync(options.output, JSON.stringify(awards, null, 2));
          console.log(`\nSaved filtered results to: ${options.output}`);
        }

        console.log('\n=== Complete ===');
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}

#!/usr/bin/env node
/**
 * USAspending POC - Main CLI entry point
 */

import { Command } from 'commander';
import { createFetchCommand } from './commands/fetch';
import { createAnalyzeCommand } from './commands/analyze';
import { createConfigCommand } from './commands/config';

const program = new Command();

program
  .name('usa-spending')
  .description('USAspending API client for fetching federal contract awards')
  .version('0.1.0');

// Add commands
program.addCommand(createFetchCommand());
program.addCommand(createAnalyzeCommand());
program.addCommand(createConfigCommand());

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

/**
 * JSON file storage service
 */

import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';
import { AppConfig } from '../types/config';
import { Award, AwardSummary } from '../types/award';
import { Transaction, TransactionSummary } from '../types/transaction';
import { CompleteFetchResult } from '../types/complete-fetch';

export class StorageService {
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.ensureOutputDirectory();
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.config.output.directory)) {
      fs.mkdirSync(this.config.output.directory, { recursive: true });
      console.log(`Created output directory: ${this.config.output.directory}`);
    }
  }

  /**
   * Generate timestamped filename
   */
  private generateFilename(prefix: string, extension: string = 'json'): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    return `${prefix}_${timestamp}.${extension}`;
  }

  /**
   * Write JSON to file
   */
  private writeJson(filename: string, data: any): string {
    const filePath = path.join(this.config.output.directory, filename);
    const jsonString = this.config.output.pretty_print
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);

    fs.writeFileSync(filePath, jsonString, 'utf8');
    return filePath;
  }

  /**
   * Save awards data
   */
  saveAwards(raw: any[], normalized: Award[], summary: AwardSummary): {
    rawPath: string | null;
    normalizedPath: string;
    summaryPath: string;
  } {
    const paths = {
      rawPath: null as string | null,
      normalizedPath: '',
      summaryPath: '',
    };

    // Save raw data if configured
    if (this.config.output.include_raw) {
      const rawFilename = this.generateFilename('awards_raw');
      paths.rawPath = this.writeJson(rawFilename, raw);
      console.log(`Saved raw data: ${paths.rawPath}`);
    }

    // Save normalized data
    const normalizedFilename = this.generateFilename('awards_normalized');
    paths.normalizedPath = this.writeJson(normalizedFilename, normalized);
    console.log(`Saved normalized data: ${paths.normalizedPath}`);

    // Save summary
    const summaryFilename = this.generateFilename('awards_summary');
    paths.summaryPath = this.writeJson(summaryFilename, summary);
    console.log(`Saved summary: ${paths.summaryPath}`);

    return paths;
  }

  /**
   * Read normalized awards from file
   */
  readNormalizedAwards(filePath: string): Award[] {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as Award[];
  }

  /**
   * List available normalized award files
   */
  listAwardFiles(): string[] {
    const files = fs.readdirSync(this.config.output.directory);
    return files
      .filter((f) => f.startsWith('awards_normalized_') && f.endsWith('.json'))
      .map((f) => path.join(this.config.output.directory, f))
      .sort()
      .reverse(); // Most recent first
  }

  /**
   * Save transaction data
   */
  saveTransactions(raw: any[], normalized: Transaction[], summary: TransactionSummary): {
    rawPath: string | null;
    normalizedPath: string;
    summaryPath: string;
  } {
    const paths = {
      rawPath: null as string | null,
      normalizedPath: '',
      summaryPath: '',
    };

    // Save raw data if configured
    if (this.config.output.include_raw) {
      const rawFilename = this.generateFilename('transactions_raw');
      paths.rawPath = this.writeJson(rawFilename, raw);
      console.log(`Saved raw transaction data: ${paths.rawPath}`);
    }

    // Save normalized data
    const normalizedFilename = this.generateFilename('transactions_normalized');
    paths.normalizedPath = this.writeJson(normalizedFilename, normalized);
    console.log(`Saved normalized transaction data: ${paths.normalizedPath}`);

    // Save summary
    const summaryFilename = this.generateFilename('transactions_summary');
    paths.summaryPath = this.writeJson(summaryFilename, summary);
    console.log(`Saved transaction summary: ${paths.summaryPath}`);

    return paths;
  }

  /**
   * Read normalized transactions from file
   */
  readNormalizedTransactions(filePath: string): Transaction[] {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as Transaction[];
  }

  /**
   * List available normalized transaction files
   */
  listTransactionFiles(): string[] {
    const files = fs.readdirSync(this.config.output.directory);
    return files
      .filter((f) => f.startsWith('transactions_normalized_') && f.endsWith('.json'))
      .map((f) => path.join(this.config.output.directory, f))
      .sort()
      .reverse(); // Most recent first
  }

  /**
   * Save complete fetch results (two-stage fetch: transactions + awards)
   */
  saveCompleteFetch(result: CompleteFetchResult): {
    transactionsPath: string;
    awardsPath: string;
    statsPath: string;
  } {
    const paths = {
      transactionsPath: '',
      awardsPath: '',
      statsPath: '',
    };

    // Save transactions
    const txFilename = this.generateFilename('complete_transactions');
    paths.transactionsPath = this.writeJson(txFilename, result.transactions);
    console.log(`\n📁 Saved transactions: ${paths.transactionsPath}`);

    // Save awards
    const awFilename = this.generateFilename('complete_awards');
    paths.awardsPath = this.writeJson(awFilename, result.awards);
    console.log(`📁 Saved awards: ${paths.awardsPath}`);

    // Save stats
    const statsFilename = this.generateFilename('complete_stats');
    paths.statsPath = this.writeJson(statsFilename, result.stats);
    console.log(`📁 Saved stats: ${paths.statsPath}`);

    return paths;
  }
}

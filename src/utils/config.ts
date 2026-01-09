/**
 * Configuration loader utility
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { AppConfig } from '../types/config';

/**
 * Load configuration from YAML file
 */
export function loadConfig(configPath?: string): AppConfig {
  const defaultPath = path.join(process.cwd(), 'config', 'default.yml');
  const filePath = configPath || defaultPath;

  if (!fs.existsSync(filePath)) {
    throw new Error(`Configuration file not found: ${filePath}`);
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const config = yaml.load(fileContents) as AppConfig;

  // Validate required fields
  validateConfig(config);

  return config;
}

/**
 * Validate configuration object
 */
function validateConfig(config: AppConfig): void {
  if (!config.api?.base_url) {
    throw new Error('Missing required config: api.base_url');
  }
  if (!config.api?.endpoint) {
    throw new Error('Missing required config: api.endpoint');
  }
  if (!config.eligibility?.award_types || !Array.isArray(config.eligibility.award_types)) {
    throw new Error('Missing required config: eligibility.award_types (must be an array)');
  }
  if (config.eligibility?.min_amount === undefined) {
    throw new Error('Missing required config: eligibility.min_amount');
  }
  if (!config.eligibility?.rolling_days) {
    throw new Error('Missing required config: eligibility.rolling_days');
  }
  if (!config.output?.directory) {
    throw new Error('Missing required config: output.directory');
  }
  if (!config.pagination?.page_size) {
    throw new Error('Missing required config: pagination.page_size');
  }
}

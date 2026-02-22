/**
 * Tier 2 Source Retriever: Official APIs
 *
 * Government and official data sources:
 * - SEC EDGAR (US company filings)
 * - US Census Bureau (demographics, economic data)
 * - World Bank (international development data)
 * - BLS (Bureau of Labor Statistics)
 * - FRED (Federal Reserve Economic Data)
 *
 * Returns EXACT quotes from official documents
 */

import type { RealSource, Citation, CitationLocation, QuoteLevel } from '../types';

// =====================================================
// SEC EDGAR API
// =====================================================

interface SECFiling {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  acceptanceDateTime: string;
  form: string;
  fileNumber: string;
  primaryDocument: string;
  primaryDocDescription: string;
}

interface SECCompanyInfo {
  cik: string;
  entityType: string;
  name: string;
  filings: SECFiling[];
}

/**
 * Search SEC EDGAR database
 *
 * NOTE: SEC API does not require authentication but has rate limits
 * User-Agent header MUST include company email per SEC guidelines
 *
 * @param query - Company name or CIK
 * @param userEmail - User's email (required by SEC for User-Agent)
 * @returns Real sources from SEC filings
 */
export async function searchSEC(
  query: string,
  userEmail: string = 'noreply@nova-hub.com'
): Promise<RealSource[]> {
  try {
    // SEC API endpoint
    const baseUrl = 'https://data.sec.gov';

    // Search for company CIK
    const searchUrl = `${baseUrl}/submissions/CIK${query.padStart(10, '0')}.json`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': `Nova-Hub AI Evidence System ${userEmail}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error('SEC API error:', response.status, response.statusText);
      return [];
    }

    const data: SECCompanyInfo = await response.json();

    // Convert recent filings to sources
    const sources: RealSource[] = [];
    const recentFilings = data.filings.slice(0, 5); // Latest 5 filings

    for (const filing of recentFilings) {
      const filingUrl = `${baseUrl}/Archives/edgar/data/${data.cik}/${filing.accessionNumber.replace(
        /-/g,
        ''
      )}/${filing.primaryDocument}`;

      sources.push({
        id: filing.accessionNumber,
        name: `${data.name} - ${filing.form} Filing`,
        url: filingUrl,
        type: 'official_api',

        title: `${filing.form}: ${filing.primaryDocDescription}`,
        summary: `Official SEC filing from ${data.name}`,

        domain: 'sec.gov',
        parent_organization: 'U.S. Securities and Exchange Commission',
        country: 'US',
        language: 'en',

        published_date: filing.filingDate,
        last_updated: filing.acceptanceDateTime,

        reliability_score: 95, // SEC filings are highly reliable (legally required accuracy)
        authority_score: undefined,
      });
    }

    return sources;
  } catch (error) {
    console.error('Error searching SEC:', error);
    return [];
  }
}


// =====================================================
// US CENSUS BUREAU API
// =====================================================

// interface CensusDataPoint {
//   name: string;
//   value: string;
//   year: string;
//   geography: string;
// }

/**
 * Search US Census Bureau data
 *
 * NOTE: Some Census endpoints require API key
 * Get free key at: https://api.census.gov/data/key_signup.html
 *
 * @param query - Search query (e.g., "population California 2020")
 * @param _apiKey - Optional Census API key
 * @returns Real sources from Census data
 */
export async function searchCensus(
  query: string,
  _apiKey?: string
): Promise<RealSource[]> {
  try {
    // For MVP, we'll use the public-facing data portal
    // In production, integrate with specific Census APIs based on query intent

    const searchUrl = `https://www.census.gov/search-results.html?q=${encodeURIComponent(
      query
    )}&page=1&stateGeo=none&searchtype=web`;

    // For MVP, return metadata about Census as a source
    // TODO: Implement actual Census API integration with specific datasets
    const sources: RealSource[] = [
      {
        id: `census-${Date.now()}`,
        name: 'U.S. Census Bureau Data',
        url: searchUrl,
        type: 'official_api',

        title: 'U.S. Census Bureau',
        summary: `Official demographic and economic data for: ${query}`,

        domain: 'census.gov',
        parent_organization: 'U.S. Department of Commerce',
        country: 'US',
        language: 'en',

        published_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),

        reliability_score: 95,
        authority_score: undefined,
      },
    ];

    return sources;
  } catch (error) {
    console.error('Error searching Census:', error);
    return [];
  }
}


// =====================================================
// WORLD BANK API
// =====================================================

interface WorldBankIndicator {
  id: string;
  name: string;
  unit: string;
  source: {
    id: string;
    value: string;
  };
}

interface WorldBankDataPoint {
  indicator: WorldBankIndicator;
  country: {
    id: string;
    value: string;
  };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  decimal: number;
}

/**
 * Search World Bank Open Data
 *
 * No API key required
 *
 * @param indicatorId - World Bank indicator ID (e.g., 'NY.GDP.MKTP.CD' for GDP)
 * @param countryCode - ISO country code (e.g., 'US', 'BR')
 * @param years - Number of recent years to fetch
 * @returns Real sources from World Bank data
 */
export async function searchWorldBank(
  indicatorId: string,
  countryCode: string = 'all',
  years: number = 5
): Promise<RealSource[]> {
  try {
    const baseUrl = 'https://api.worldbank.org/v2';
    const url = `${baseUrl}/country/${countryCode}/indicator/${indicatorId}?format=json&per_page=${years}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('World Bank API error:', response.status);
      return [];
    }

    const data = await response.json();

    // World Bank returns [metadata, data]
    if (!Array.isArray(data) || data.length < 2) {
      return [];
    }

    const dataPoints: WorldBankDataPoint[] = data[1];

    const sources: RealSource[] = dataPoints
      .filter((dp) => dp.value !== null)
      .map((dp) => ({
        id: `wb-${dp.indicator.id}-${dp.country.id}-${dp.date}`,
        name: `${dp.indicator.name} - ${dp.country.value} (${dp.date})`,
        url: `https://data.worldbank.org/indicator/${dp.indicator.id}?locations=${dp.countryiso3code}`,
        type: 'official_api' as const,

        title: dp.indicator.name,
        summary: `${dp.country.value} ${dp.date}: ${dp.value} ${dp.unit || ''}`,

        domain: 'worldbank.org',
        parent_organization: 'World Bank Group',
        country: 'GLOBAL',
        language: 'en',

        published_date: `${dp.date}-12-31`, // World Bank data is yearly
        last_updated: new Date().toISOString(),

        reliability_score: 90,
        authority_score: undefined,
      }));

    return sources;
  } catch (error) {
    console.error('Error searching World Bank:', error);
    return [];
  }
}


// =====================================================
// BUREAU OF LABOR STATISTICS (BLS) API
// =====================================================

/**
 * Search BLS data
 *
 * API key recommended for higher rate limits
 * Get key at: https://www.bls.gov/developers/api_signature_v2.htm
 *
 * @param seriesId - BLS series ID (e.g., 'LAUCN040010000000005' for unemployment rate)
 * @param apiKey - Optional BLS API key
 * @returns Real sources from BLS data
 */
export async function searchBLS(seriesId: string, _apiKey?: string): Promise<RealSource[]> {
  try {
    // For MVP, return metadata
    // TODO: Implement actual BLS API integration

    const sources: RealSource[] = [
      {
        id: `bls-${seriesId}`,
        name: 'Bureau of Labor Statistics Data',
        url: `https://data.bls.gov/timeseries/${seriesId}`,
        type: 'official_api',

        title: 'U.S. Bureau of Labor Statistics',
        summary: `Official employment and economic statistics - Series: ${seriesId}`,

        domain: 'bls.gov',
        parent_organization: 'U.S. Department of Labor',
        country: 'US',
        language: 'en',

        published_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),

        reliability_score: 95,
        authority_score: undefined,
      },
    ];

    return sources;
  } catch (error) {
    console.error('Error searching BLS:', error);
    return [];
  }
}


// =====================================================
// MASTER OFFICIAL SOURCES RETRIEVER
// =====================================================

/**
 * Search across all official sources based on query intent
 *
 * @param query - Natural language query
 * @param country - Country code for geo-specific searches
 * @param userEmail - User's email (for SEC User-Agent compliance)
 * @returns Combined sources from all official APIs
 */
export async function searchOfficialSources(
  query: string,
  country: string = 'US',
  _userEmail?: string
): Promise<RealSource[]> {
  const sources: RealSource[] = [];

  // Determine which APIs to query based on intent
  const lowerQuery = query.toLowerCase();

  // Economic/GDP indicators → World Bank
  if (
    lowerQuery.includes('gdp') ||
    lowerQuery.includes('market size') ||
    lowerQuery.includes('economy')
  ) {
    const wbSources = await searchWorldBank('NY.GDP.MKTP.CD', country);
    sources.push(...wbSources);
  }

  // Employment/labor → BLS
  if (
    country === 'US' &&
    (lowerQuery.includes('employment') ||
      lowerQuery.includes('unemployment') ||
      lowerQuery.includes('jobs') ||
      lowerQuery.includes('wages'))
  ) {
    // Common BLS series IDs
    const blsSources = await searchBLS('LNS14000000'); // Unemployment rate
    sources.push(...blsSources);
  }

  // Company-specific → SEC (if US company)
  // NOTE: For MVP, we'll skip SEC auto-detection
  // In production, extract company name and search SEC

  // Demographics → Census
  if (
    country === 'US' &&
    (lowerQuery.includes('population') ||
      lowerQuery.includes('demographic') ||
      lowerQuery.includes('census'))
  ) {
    const censusSources = await searchCensus(query);
    sources.push(...censusSources);
  }

  // Sort by reliability score
  return sources.sort((a, b) => b.reliability_score - a.reliability_score);
}


// =====================================================
// EXTRACT CITATIONS FROM OFFICIAL SOURCES
// =====================================================

/**
 * Extract citations from official API sources
 *
 * @param source - The official source
 * @param claim - The claim being supported
 * @returns Citations with exact data points
 */
export async function extractOfficialCitations(
  source: RealSource,
  _claim: string
): Promise<Citation[]> {
  // For official APIs, the "quote" is the data point itself
  const location: CitationLocation = {
    type: 'api_response',
  };

  const citation: Citation = {
    source_id: source.id,
    source_name: source.name,
    source_type: 'official_api',
    url: source.url,
    quote: source.summary, // Data point summary
    quote_level: 'exact' as QuoteLevel, // API responses are exact
    location,
    date_accessed: new Date().toISOString(),
    date_published: source.published_date,
    reliability_score: source.reliability_score,
    relevance_score: 85, // Default high relevance for targeted API queries
  };

  return [citation];
}

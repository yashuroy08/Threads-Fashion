/**
 * fuzzySearch.ts
 * Client-side heuristic fuzzy search with Levenshtein distance,
 * prefix matching, token-based scoring, and word boundary bonuses.
 */

/* ─── Types ─────────────────────────────────────────────── */

export interface Product {
  id?: string;
  _id?: string;
  slug?: string;
  title: string;
  description?: string;
  price: { amount: number; currency: string };
  images: { url: string }[];
}

export interface ScoredProduct extends Product {
  /** 0-100 relevance score */
  score: number;
  /** Which scoring tier placed this result */
  matchType: 'exact-title' | 'prefix-title' | 'fuzzy-title' | 'exact-desc' | 'fuzzy-desc';
}

export interface GroupedResults {
  /** score > 60 */
  bestMatches: ScoredProduct[];
  /** score 20-60 */
  related: ScoredProduct[];
}

/* ─── Levenshtein Distance ──────────────────────────────── */

export function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  // Optimisation: use single-row DP
  let prev = new Array<number>(lb + 1);
  let curr = new Array<number>(lb + 1);

  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost  // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[lb];
}

/* ─── Tokenisation & Normalisation ──────────────────────── */

export function normalizeString(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // strip ALL symbols and spaces
}

/**
 * Clean up symbols, brackets, and extra spaces for professional display,
 * similar to how Amazon and Flipkart keep product listings clean in search dropdowns.
 */
export function cleanDisplayString(text: string): string {
  if (!text) return '';
  return text
    .replace(/[®™*\[\]{}()]/g, '') // remove trademark, registered, brackets, parens
    .replace(/[-_/\\]+/g, ' ')     // replace hyphens, underscores, slashes with spaces
    .replace(/\s+/g, ' ')          // collapse multiple spaces
    .trim();
}

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/* ─── Single-token Scoring ──────────────────────────────── */

interface TokenMatch {
  score: number;
  type: 'exact' | 'prefix' | 'fuzzy' | 'none';
  /** bonus for word-boundary alignment */
  boundaryBonus: number;
}

function scoreTokenAgainstTarget(
  queryToken: string,
  targetToken: string,
  isWordStart: boolean
): TokenMatch {
  const boundaryBonus = isWordStart ? 5 : 0;

  // Exact match
  if (queryToken === targetToken) {
    return { score: 1.0, type: 'exact', boundaryBonus };
  }

  // Prefix match – query is a prefix of target
  if (targetToken.startsWith(queryToken) && queryToken.length >= 2) {
    const ratio = queryToken.length / targetToken.length;
    return { score: 0.6 + ratio * 0.3, type: 'prefix', boundaryBonus };
  }

  // Fuzzy match / nearest match with length-proportional typo tolerance
  if (queryToken.length >= 4) {
    const dist = levenshtein(queryToken, targetToken);
    const maxAllowed = queryToken.length <= 6 ? 1 : 2;
    if (dist <= maxAllowed) {
      const similarity = 1 - dist / Math.max(queryToken.length, targetToken.length);
      return { score: similarity * 0.7, type: 'fuzzy', boundaryBonus };
    }
  }

  return { score: 0, type: 'none', boundaryBonus: 0 };
}

/* ─── Score a product against the full query ────────────── */

function scoreProduct(product: Product, query: string): ScoredProduct | null {
  const queryTokens = tokenise(query);
  if (queryTokens.length === 0) return null;

  const titleTokens = tokenise(product.title || '');
  const descTokens = tokenise(product.description || '');

  let bestScore = 0;
  let bestType: ScoredProduct['matchType'] = 'fuzzy-desc';

  // ── 1. Whole-string normalized matching ──
  // This bypasses spacing/symbol differences (e.g. "t-shirt" vs "tshirt" vs "T Shirt")
  const normQuery = normalizeString(query);
  const normTitle = normalizeString(product.title || '');
  const normDesc = normalizeString(product.description || '');

  if (normTitle === normQuery) {
    bestScore = 100;
    bestType = 'exact-title';
  } else if (normTitle.includes(normQuery) && normQuery.length >= 3) {
    // If the normalized query is directly inside the title (e.g. "airmax" inside "nikeairmax")
    bestScore = 95;
    bestType = 'exact-title';
  }

  // ── 2. Title token scoring (handling reordering and partial nearest matches) ──
  let titleAccum = 0;
  let titleMatchCount = 0;

  for (const qt of queryTokens) {
    let bestTokenScore = 0;
    let bestTokenType: 'exact' | 'prefix' | 'fuzzy' | 'none' = 'none';

    for (let i = 0; i < titleTokens.length; i++) {
      const match = scoreTokenAgainstTarget(qt, titleTokens[i], i === 0);
      const totalScore = match.score + match.boundaryBonus / 100;
      if (totalScore > bestTokenScore) {
        bestTokenScore = totalScore;
        bestTokenType = match.type;
      }
    }

    if (bestTokenType !== 'none') {
      titleAccum += bestTokenScore;
      titleMatchCount++;
    }
  }

  if (titleMatchCount > 0) {
    const coverage = titleMatchCount / queryTokens.length;
    const avgScore = titleAccum / queryTokens.length;

    // Nearest matches logic: score scale accounts for both matched token quality and overall coverage.
    const tokenScore = (avgScore * 0.6 + coverage * 0.4) * 100;

    if (tokenScore > bestScore) {
      bestScore = tokenScore;
      if (coverage >= 1.0 && avgScore >= 0.9) {
        bestType = 'exact-title';
      } else if (coverage >= 0.8) {
        bestType = 'prefix-title';
      } else {
        bestType = 'fuzzy-title';
      }
    }
  }

  // ── 3. Description scoring (only if title score is low) ──
  if (bestScore < 60) {
    if (normDesc.includes(normQuery) && normQuery.length >= 4) {
      bestScore = Math.max(bestScore, 50);
      bestType = 'exact-desc';
    }

    let descAccum = 0;
    let descMatchCount = 0;

    for (const qt of queryTokens) {
      let bestTokenScore = 0;
      let bestTokenType: 'exact' | 'prefix' | 'fuzzy' | 'none' = 'none';

      for (let i = 0; i < descTokens.length; i++) {
        const match = scoreTokenAgainstTarget(qt, descTokens[i], i === 0);
        const totalScore = match.score + match.boundaryBonus / 100;
        if (totalScore > bestTokenScore) {
          bestTokenScore = totalScore;
          bestTokenType = match.type;
        }
      }

      if (bestTokenType !== 'none') {
        descAccum += bestTokenScore;
        descMatchCount++;
      }
    }

    if (descMatchCount > 0) {
      const coverage = descMatchCount / queryTokens.length;
      const avgScore = descAccum / queryTokens.length;
      const tokenScore = (avgScore * 0.5 + coverage * 0.5) * 50; // Description matches capped at 50

      if (tokenScore > bestScore) {
        bestScore = tokenScore;
        bestType = 'fuzzy-desc';
      }
    }
  }

  if (bestScore <= 0) return null;

  return {
    ...product,
    score: Math.min(Math.round(bestScore), 100),
    matchType: bestType,
  };
}

/* ─── Public API ────────────────────────────────────────── */

/**
 * Score and rank products against a fuzzy query.
 * Returns only products with score > 0, sorted descending.
 */
export function fuzzySearchProducts(
  products: Product[],
  query: string
): ScoredProduct[] {
  if (!query || query.trim().length === 0) return [];

  const scored: ScoredProduct[] = [];

  for (const p of products) {
    const result = scoreProduct(p, query);
    if (result && result.score > 0) {
      scored.push(result);
    }
  }

  // Sort by score descending, then alphabetically for ties
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.title.localeCompare(b.title);
  });

  return scored;
}

/**
 * Group scored products into "Best Matches" (score > 60)
 * and "Related" (score 20–60).
 */
export function groupSearchResults(scored: ScoredProduct[]): GroupedResults {
  const bestMatches: ScoredProduct[] = [];
  const related: ScoredProduct[] = [];

  for (const item of scored) {
    if (item.score > 60) {
      bestMatches.push(item);
    } else if (item.score >= 20) {
      related.push(item);
    }
  }

  return { bestMatches, related };
}

/* ─── Product Cache (for instant local results) ─────────── */

const CACHE_MAX = 200;
let _productCache: Product[] = [];

/** Add products to the local cache (deduped by id/_id). */
export function cacheProducts(products: Product[]): void {
  const existingIds = new Set(
    _productCache.map((p) => p.id || p._id)
  );

  for (const p of products) {
    const pid = p.id || p._id;
    if (pid && !existingIds.has(pid)) {
      _productCache.push(p);
      existingIds.add(pid);
    }
  }

  // Trim to max size (keep most recent)
  if (_productCache.length > CACHE_MAX) {
    _productCache = _productCache.slice(-CACHE_MAX);
  }
}

/** Get all cached products. */
export function getCachedProducts(): Product[] {
  return _productCache;
}

/** Clear the local product cache. */
export function clearProductCache(): void {
  _productCache = [];
}

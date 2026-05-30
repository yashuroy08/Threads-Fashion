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

/* ─── Tokenisation ──────────────────────────────────────── */

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

  // Fuzzy match – Levenshtein distance ≤ 2
  if (queryToken.length >= 3) {
    const dist = levenshtein(queryToken, targetToken);
    const maxAllowed = queryToken.length <= 4 ? 1 : 2;
    if (dist <= maxAllowed) {
      const similarity = 1 - dist / Math.max(queryToken.length, targetToken.length);
      return { score: similarity * 0.6, type: 'fuzzy', boundaryBonus };
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

  // ── Title scoring ──

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

    // Check match quality for type assignment
    const fullQueryLower = query.toLowerCase().trim();
    const titleLower = (product.title || '').toLowerCase();

    if (titleLower.includes(fullQueryLower) || fullQueryLower === titleLower) {
      // Full exact substring match in title
      bestScore = 100;
      bestType = 'exact-title';
    } else if (coverage >= 1.0 && avgScore >= 0.8) {
      bestScore = 80 + avgScore * 10;
      bestType = 'prefix-title';
    } else if (coverage >= 0.5) {
      bestScore = 60 + avgScore * coverage * 15;
      bestType = avgScore >= 0.5 ? 'prefix-title' : 'fuzzy-title';
    } else {
      bestScore = 40 + avgScore * coverage * 20;
      bestType = 'fuzzy-title';
    }
  }

  // ── Description scoring (only if title score is low) ──

  if (bestScore < 60) {
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

      const fullQueryLower = query.toLowerCase().trim();
      const descLower = (product.description || '').toLowerCase();

      let descScore: number;
      let descType: ScoredProduct['matchType'];

      if (descLower.includes(fullQueryLower)) {
        descScore = 40 + avgScore * 10;
        descType = 'exact-desc';
      } else if (coverage >= 0.5) {
        descScore = 20 + avgScore * coverage * 20;
        descType = 'fuzzy-desc';
      } else {
        descScore = avgScore * coverage * 20;
        descType = 'fuzzy-desc';
      }

      if (descScore > bestScore) {
        bestScore = descScore;
        bestType = descType;
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
    // score < 20 → too weak, discard
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

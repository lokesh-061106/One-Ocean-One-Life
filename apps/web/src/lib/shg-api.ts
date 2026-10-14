import { api } from "@/lib/api";
import {
  SHG_FRESH_FISH,
  SHG_RECIPES,
  SHG_REVENUE_ROWS,
  SHG_SCHEMES,
  type ShgFreshFish,
  type ShgRecipe,
  type ShgRevenueRow,
  type ShgScheme,
} from "@/data/shg";

interface Paged<T> {
  count: number;
  results: T[];
}

interface ApiSection {
  key: string;
  num: string;
  label: string;
  title: string;
  subtitle: string;
  message: string[];
  slogan: string;
  tagline: string;
  chain: string[];
  sign: string;
  tone: string;
}

interface ApiRevenueItem {
  key: string;
  activity: string;
  what: string;
  market: string;
  price: string;
  income: string;
  image: string;
}

interface ApiScheme {
  name: string;
  purpose: string;
  amount: string;
}

interface ApiFish {
  english: string;
  tamil: string;
  translit: string;
  names: { lang: string; script: string; translit: string }[];
  image: string;
}

interface ApiRecipe {
  fish: string;
  tamil: string;
  translit: string;
  dish: string;
  ingredients: string[];
  cook: string;
  serve: string;
  fish_image: string;
  dish_image: string;
}

async function getOrFallback<T>(endpoint: string, fallback: T): Promise<T> {
  try {
    const data = await api.get<Paged<unknown>>(endpoint);
    if (!data?.results?.length) return fallback;
    return data.results as unknown as T;
  } catch {
    return fallback;
  }
}

/** Section header/footer copy — falls back to `null` (pages keep their static copy). */
export async function fetchShgSection(key: string): Promise<ApiSection | null> {
  try {
    return await api.get<ApiSection>(`/livelihood/shg/sections/${key}/`);
  } catch {
    return null;
  }
}

export async function fetchShgRevenueItems(): Promise<ShgRevenueRow[]> {
  const rows = await getOrFallback<ApiRevenueItem[]>("/livelihood/shg/revenue-items/", []);
  if (!rows.length) return SHG_REVENUE_ROWS;
  return rows.map((row) => ({
    key: row.key,
    activity: row.activity,
    what: row.what,
    market: row.market,
    price: row.price,
    income: row.income,
    figure: row.image ? { src: row.image, alt: row.activity } : undefined,
  }));
}

export async function fetchShgSchemes(): Promise<ShgScheme[]> {
  const rows = await getOrFallback<ApiScheme[]>("/livelihood/shg/schemes/", []);
  if (!rows.length) return SHG_SCHEMES;
  return rows.map((row) => ({ name: row.name, purpose: row.purpose, amount: row.amount }));
}

export async function fetchShgFishProducts(): Promise<ShgFreshFish[]> {
  const rows = await getOrFallback<ApiFish[]>("/livelihood/shg/fish-products/", []);
  if (!rows.length) return SHG_FRESH_FISH;
  return rows.map((row, index) => ({
    key: row.english.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    no: index + 1,
    english: row.english,
    tamil: row.tamil,
    translit: row.translit,
    names: row.names,
    figure: { src: row.image, alt: `${row.english} with a prepared dish` },
  }));
}

export async function fetchShgRecipes(): Promise<ShgRecipe[]> {
  const rows = await getOrFallback<ApiRecipe[]>("/livelihood/shg/recipes/", []);
  if (!rows.length) return SHG_RECIPES;
  return rows.map((row, index) => ({
    key: `${row.fish}-${row.dish}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    no: index + 1,
    fish: row.fish,
    tamil: row.tamil,
    translit: row.translit,
    dish: row.dish,
    ingredients: row.ingredients,
    cook: row.cook,
    serve: row.serve,
    fishFigure: { src: row.fish_image, alt: `Fresh ${row.fish}` },
    dishFigure: { src: row.dish_image, alt: row.dish },
  }));
}

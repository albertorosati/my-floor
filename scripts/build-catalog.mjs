import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEED_PART_1 } from './seed-part1.mjs';
import { SEED_PART_2 } from './seed-part2.mjs';
import { SEED_PART_3 } from './seed-part3.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.resolve(__dirname, '../src/data/generatedCatalog.json');

const USER_AGENT =
  'FloorArenaCatalogBuilder/2.0 (https://github.com/albertorosati/my-floor; educational trivia game)';

async function fetchJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
      });
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
      }
    } catch {
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  return null;
}

function isGoodPhotoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  if (lower.endsWith('.svg') || lower.includes('.svg.png')) return false;
  if (lower.endsWith('.ogg') || lower.endsWith('.webm') || lower.endsWith('.ogv') || lower.endsWith('.pdf') || lower.endsWith('.tif') || lower.endsWith('.tiff')) {
    return false;
  }
  if (
    lower.includes('question_book') ||
    lower.includes('no_free_image') ||
    lower.includes('replace_this_image') ||
    lower.includes('disambig') ||
    lower.includes('commons-logo') ||
    lower.includes('flag_of_') ||
    lower.includes('_wordmark') ||
    lower.includes('_logo')
  ) {
    return false;
  }
  return true;
}

/**
 * Risolve in batch fino a 40 titoli su Wikipedia (EN o IT) usando `pithumbsize=500` (bucket Varnish standard).
 */
async function resolveWikiBatch(titles, lang = 'en') {
  const resultMap = new Map();
  if (titles.length === 0) return resultMap;

  const batchSize = 40;
  for (let i = 0; i < titles.length; i += batchSize) {
    const chunk = titles.slice(i, i + batchSize);
    const encoded = chunk.map((t) => encodeURIComponent(t)).join('|');
    // Note: MediaWiki expects raw '|' between encoded titles OR single encoded param:
    const params = new URLSearchParams({
      action: 'query',
      titles: chunk.join('|'),
      prop: 'pageimages',
      piprop: 'thumbnail|original',
      pithumbsize: '500',
      pilicense: 'any',
      redirects: '1',
      format: 'json',
    });

    const apiUrl = `https://${lang}.wikipedia.org/w/api.php?${params.toString()}`;
    const data = await fetchJson(apiUrl);
    if (!data?.query) continue;

    // Mappa normalizzazioni e redirect per ricollegare il titolo richiesto alla pagina finale
    const normMap = new Map();
    for (const n of data.query.normalized || []) {
      normMap.set(n.from, n.to);
    }
    const redirMap = new Map();
    for (const r of data.query.redirects || []) {
      redirMap.set(r.from, r.to);
    }

    const pagesByTitle = new Map();
    for (const page of Object.values(data.query.pages || {})) {
      if (page?.title) {
        pagesByTitle.set(page.title, page);
      }
    }

    for (const origTitle of chunk) {
      let cur = normMap.get(origTitle) ?? origTitle;
      let guard = 0;
      while (redirMap.has(cur) && guard < 5) {
        cur = redirMap.get(cur);
        guard++;
      }
      const page = pagesByTitle.get(cur);
      const thumb = page?.thumbnail?.source;
      const orig = page?.original?.source;
      const candidate = isGoodPhotoUrl(thumb)
        ? thumb
        : isGoodPhotoUrl(orig)
        ? orig
        : null;
      if (candidate) {
        resultMap.set(origTitle, candidate);
      }
    }
  }
  return resultMap;
}

/**
 * Fallback singolo: cerca su Wikipedia IT/EN tramite generator=search oppure su Wikimedia Commons (filetype:bitmap)
 */
async function resolveFallbackSingle(query, answer) {
  for (const lang of ['it', 'en']) {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: query,
      gsrlimit: '4',
      prop: 'pageimages',
      piprop: 'thumbnail',
      pithumbsize: '500',
      pilicense: 'any',
      format: 'json',
    });
    const data = await fetchJson(
      `https://${lang}.wikipedia.org/w/api.php?${params.toString()}`
    );
    const pages = Object.values(data?.query?.pages || {}).sort(
      (a, b) => (a.index ?? 99) - (b.index ?? 99)
    );
    for (const p of pages) {
      if (isGoodPhotoUrl(p?.thumbnail?.source)) {
        return p.thumbnail.source;
      }
    }
  }

  // Fallback finale su Wikimedia Commons cercando esplicitamente una fotografia bitmap
  const commonsParams = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: `filetype:bitmap ${query || answer}`,
    gsrlimit: '5',
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '500',
    format: 'json',
  });
  const cData = await fetchJson(
    `https://commons.wikimedia.org/w/api.php?${commonsParams.toString()}`
  );
  for (const p of Object.values(cData?.query?.pages || {})) {
    const thumbUrl = p?.imageinfo?.[0]?.thumburl || p?.imageinfo?.[0]?.url;
    if (isGoodPhotoUrl(thumbUrl)) {
      return thumbUrl;
    }
  }
  return null;
}

async function main() {
  const allSeeds = [...SEED_PART_1, ...SEED_PART_2, ...SEED_PART_3];
  const outputCategories = [];
  let totalItems = 0;

  console.log(`Avvio generazione di ${allSeeds.length} categorie...`);

  for (const cat of allSeeds) {
    const primaryLang = cat.lang || 'en';
    const secondaryLang = primaryLang === 'en' ? 'it' : 'en';

    const normalizedEntries = cat.entries.map((raw, idx) => {
      if (Array.isArray(raw)) {
        return {
          id: `${cat.id}-${idx + 1}`,
          answer: raw[0].trim(),
          wikiQuery: raw[1].trim(),
          aliases: (raw[2] || []).map((a) => a.trim()).filter(Boolean),
        };
      }
      return {
        id: `${cat.id}-${idx + 1}`,
        answer: raw.answer.trim(),
        wikiQuery: raw.wikiQuery || raw.answer.trim(),
        steamAppId: raw.steamAppId,
        pokeId: raw.pokeId,
        flagCode: raw.flagCode,
        aliases: (raw.aliases || []).map((a) => a.trim()).filter(Boolean),
      };
    });

    const wikiNeeded = normalizedEntries
      .filter((e) => !e.steamAppId && !e.pokeId && !e.flagCode)
      .map((e) => e.wikiQuery);

    const primaryMap = await resolveWikiBatch(wikiNeeded, primaryLang);

    const stillMissing = wikiNeeded.filter((q) => !primaryMap.has(q));
    const secondaryMap = await resolveWikiBatch(stillMissing, secondaryLang);

    const items = [];
    for (const entry of normalizedEntries) {
      let imageUrl = null;

      if (entry.pokeId) {
        imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${entry.pokeId}.png`;
      } else if (entry.flagCode) {
        imageUrl = `https://flagcdn.com/w640/${entry.flagCode.toLowerCase()}.png`;
      } else if (entry.steamAppId) {
        imageUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${entry.steamAppId}/library_hero.jpg`;
      } else {
        imageUrl =
          primaryMap.get(entry.wikiQuery) ||
          secondaryMap.get(entry.wikiQuery) ||
          (await resolveFallbackSingle(entry.wikiQuery, entry.answer));
      }

      if (imageUrl) {
        items.push({
          id: entry.id,
          answer: entry.answer,
          aliases: entry.aliases,
          imageUrl,
        });
      }
    }

    const coverImage = items[0]?.imageUrl || '';
    const previewImages = items.slice(0, 4).map((i) => i.imageUrl);

    outputCategories.push({
      id: cat.id,
      name: cat.name,
      subtitle: cat.subtitle,
      icon: cat.icon,
      themeHex: cat.accent,
      coverImage,
      previewImages,
      items,
    });

    totalItems += items.length;
    console.log(
      `✓ [${outputCategories.length}/${allSeeds.length}] ${cat.icon} ${cat.name}: ${items.length}/${normalizedEntries.length} foto reali pronte`
    );
  }

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(outputCategories, null, 2), 'utf8');
  console.log(
    `\nCOMPLETATO! Salvate ${outputCategories.length} categorie per un totale di ${totalItems} fotografie reali in ${OUT_FILE}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

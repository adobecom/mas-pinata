/**
 * Spreadsheet parser for the Import Variations flow.
 *
 * Detects rows by tab name (`Regional Pricing` / `Intro Pricing`) — never by
 * header sniffing. SheetJS is loaded on-demand from a CDN so users who never
 * reach the import page do not pay the bundle cost.
 */

const XLSX_CDN_URL = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs';

export const REGIONAL_TAB_NAME = 'Regional Pricing';
export const INTRO_TAB_NAME = 'Intro Pricing';

export const REGIONAL_HEADERS = ['Countries', 'Price Point', 'Regional Price Offer ID'];
export const INTRO_HEADERS = ['Countries', 'Promo Vanity Code', 'Price Point'];

export const MAX_PASTE_BYTES = 5_000_000;

let xlsxModule;

/**
 * Lazy-loads SheetJS from a CDN. Re-exported so the template-download module
 * can share the same instance.
 */
export async function loadXlsx() {
    if (!xlsxModule) {
        xlsxModule = await import(/* @vite-ignore */ XLSX_CDN_URL);
    }
    return xlsxModule;
}

function normalizeRow(row) {
    const out = {};
    for (const key of Object.keys(row)) {
        const value = row[key];
        out[key.trim()] = typeof value === 'string' ? value.trim() : value;
    }
    return out;
}

function isRowEmpty(row) {
    return Object.values(row).every((v) => v === '' || v === null || v === undefined);
}

/**
 * Parses an XLSX file. Detects tabs by exact name (case-insensitive trim).
 * @param {File|Blob} file
 * @returns {Promise<{ regionalRows: Object[], introRows: Object[], formatError: string|null }>}
 */
export async function parseSpreadsheetFile(file) {
    const xlsx = await loadXlsx();
    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'array' });

    const sheetByName = {};
    for (const name of workbook.SheetNames || []) {
        sheetByName[name.trim().toLowerCase()] = workbook.Sheets[name];
    }

    const regionalSheet = sheetByName[REGIONAL_TAB_NAME.toLowerCase()];
    const introSheet = sheetByName[INTRO_TAB_NAME.toLowerCase()];

    if (!regionalSheet && !introSheet) {
        return {
            regionalRows: [],
            introRows: [],
            formatError: `No matching tabs found. The workbook must contain "${REGIONAL_TAB_NAME}" and/or "${INTRO_TAB_NAME}".`,
        };
    }

    const regionalRows = regionalSheet
        ? xlsx.utils
              .sheet_to_json(regionalSheet, { defval: '' })
              .map(normalizeRow)
              .filter((row) => !isRowEmpty(row))
        : [];
    const introRows = introSheet
        ? xlsx.utils
              .sheet_to_json(introSheet, { defval: '' })
              .map(normalizeRow)
              .filter((row) => !isRowEmpty(row))
        : [];

    return { regionalRows, introRows, formatError: null };
}

function parseTsvBlock(block) {
    const lines = block.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) return [];
    const headers = lines[0].split('\t').map((h) => h.trim());
    return lines.slice(1).map((line) => {
        const cells = line.split('\t');
        const row = {};
        headers.forEach((header, idx) => {
            row[header] = (cells[idx] ?? '').trim();
        });
        return row;
    });
}

/**
 * Parses tab-separated text from the clipboard. Two blocks separated by a blank
 * line → first is Regional, second is Intro. A single block is treated as
 * Regional. This is a deliberate fallback for users who paste from Excel; the
 * flag is surfaced to the user via help text on the paste panel.
 * @param {string} text
 * @returns {{ regionalRows: Object[], introRows: Object[], formatError: string|null }}
 */
export function parsePastedText(text) {
    if (!text) {
        return { regionalRows: [], introRows: [], formatError: 'No data pasted.' };
    }
    if (text.length > MAX_PASTE_BYTES) {
        return { regionalRows: [], introRows: [], formatError: 'Pasted content exceeds the 5 MB limit.' };
    }

    const blocks = text
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean);

    if (blocks.length === 0) {
        return { regionalRows: [], introRows: [], formatError: 'No data pasted.' };
    }

    const regionalRows = parseTsvBlock(blocks[0]);
    const introRows = blocks[1] ? parseTsvBlock(blocks[1]) : [];

    return { regionalRows, introRows, formatError: null };
}

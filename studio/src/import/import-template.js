import { INTRO_HEADERS, INTRO_TAB_NAME, REGIONAL_HEADERS, REGIONAL_TAB_NAME, loadXlsx } from './import-spreadsheet-parser.js';

/**
 * Builds an empty two-tab workbook with the canonical header rows and triggers
 * a browser download. Tabs are named so they survive the parser's name-based
 * detection.
 */
export async function downloadTemplate() {
    const xlsx = await loadXlsx();
    const workbook = xlsx.utils.book_new();

    const regionalSheet = xlsx.utils.aoa_to_sheet([REGIONAL_HEADERS]);
    const introSheet = xlsx.utils.aoa_to_sheet([INTRO_HEADERS]);

    xlsx.utils.book_append_sheet(workbook, regionalSheet, REGIONAL_TAB_NAME);
    xlsx.utils.book_append_sheet(workbook, introSheet, INTRO_TAB_NAME);

    xlsx.writeFile(workbook, 'mas-import-template.xlsx');
}

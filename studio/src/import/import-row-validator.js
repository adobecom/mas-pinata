/**
 * Row validators for the Import Variations preview step.
 *
 * Each function returns:
 *   { valid: true } — row is good to import
 *   { valid: false, reason, alreadyExists?: true } — row will be skipped
 *
 * The `alreadyExists` flag distinguishes "duplicate of an existing variation"
 * from "malformed input" so the summary screen can categorize each correctly.
 */

function missing(value) {
    return value === undefined || value === null || String(value).trim() === '';
}

export function validateRegionalRow(row, { existingOsiSet = new Set() } = {}) {
    const countries = row['Countries'];
    const pricePoint = row['Price Point'];
    const osi = row['Regional Price Offer ID'];

    if (missing(countries)) return { valid: false, reason: 'Missing required field: Countries' };
    if (missing(pricePoint)) return { valid: false, reason: 'Missing required field: Price Point' };
    if (missing(osi)) return { valid: false, reason: 'Missing required field: Regional Price Offer ID' };

    if (existingOsiSet.has(String(osi).trim())) {
        return {
            valid: false,
            alreadyExists: true,
            reason: 'OSI already exists under base card',
        };
    }

    return { valid: true };
}

export function validateIntroRow(row, { existingPromoSet = new Set() } = {}) {
    const countries = row['Countries'];
    const pricePoint = row['Price Point'];
    const promo = row['Promo Vanity Code'];

    if (missing(countries)) return { valid: false, reason: 'Missing required field: Countries' };
    if (missing(promo)) return { valid: false, reason: 'Missing required field: Promo Vanity Code' };
    if (missing(pricePoint)) return { valid: false, reason: 'Missing required field: Price Point' };

    if (existingPromoSet.has(String(promo).trim())) {
        return {
            valid: false,
            alreadyExists: true,
            reason: 'Promo vanity code already exists under base card',
        };
    }

    return { valid: true };
}

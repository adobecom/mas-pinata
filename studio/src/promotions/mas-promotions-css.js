import { css } from 'lit';
import { tableCellBaseStyles } from '../common/styles/table-styles.css.js';

export const styles = css`
    ${tableCellBaseStyles}

    .status-cell .status-dot.yellow {
        background-color: var(--spectrum-yellow-600);
    }

    .promotions-container {
        height: 100%;
        min-height: 200px;
        border-radius: 8px;
        padding: 24px;
        background-color: var(--spectrum-white);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;
        position: relative;
    }

    .promotions-page-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }

    .promotions-page-header {
        color: #000;
        font-family: var(--spectrum-sans-font-family-stack, 'Adobe Clean', sans-serif);
        font-size: var(--Font-size-600, 25px);
        font-style: normal;
        font-weight: 700;
        line-height: var(--Line-height-Font-size-600, 30px);
        letter-spacing: var(--Letter-spacing, 0);
        margin: 0;
    }

    .promotions-create-button {
        display: flex;
        min-width: 72px;
        justify-content: center;
        align-items: flex-start;
        --mod-button-border-radius: 16px;
        --mod-button-background-color-default: var(--Alias-background-semantic-accent-default, #3b63fb);
    }

    .promotions-status-tiles {
        display: flex;
        align-items: center;
        gap: 20px;
        align-self: stretch;
        margin-bottom: 24px;
    }

    .promotions-status-tile {
        display: flex;
        padding: 12px 20px;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        flex: 1 0 0;
        border-radius: 12px;
        background: var(--Palette-white, #fff);
        box-shadow:
            0 0 2px 0 var(--Alias-drop-shadow-elevated-key, rgba(0, 0, 0, 0.12)),
            0 2px 6px 0 var(--Alias-drop-shadow-transition, rgba(0, 0, 0, 0.04)),
            0 4px 12px 0 var(--Alias-drop-shadow-ambient, rgba(0, 0, 0, 0.08));
        cursor: pointer;
    }

    .promotions-status-tile.selected {
        border: 2px solid var(--Alias-background-semantic-accent-default, #3b63fb);
    }

    .promotions-status-tile-label {
        align-self: flex-end;
        color: var(--Alias-content-neutral-default, var(--Alias-content-neutral-default, #292929));
        font-family: var(--spectrum-sans-font-family-stack, 'Adobe Clean', sans-serif);
        font-size: var(--Font-size-100, 14px);
        font-style: normal;
        font-weight: 400;
        line-height: var(--Line-height-Font-size-100, 18px);
        letter-spacing: var(--Letter-spacing, 0);
    }

    .promotions-status-tile-count {
        flex: 1 0 0;
        color: #000;
        font-family: var(--spectrum-sans-font-family-stack, 'Adobe Clean', sans-serif);
        font-size: var(--Font-size-600, 25px);
        font-style: normal;
        font-weight: 700;
        line-height: var(--Line-height-Font-size-600, 30px);
        letter-spacing: var(--Letter-spacing, 0);
    }

    .promotions-rule {
        display: flex;
        height: 1px;
        min-height: 1px;
        max-height: 1px;
        align-items: flex-start;
        align-self: stretch;
        background: var(--spectrum-gray-200);
        margin-bottom: 24px;
    }

    .promotions-search-bar {
        display: flex;
        width: 1148px;
        height: 32px;
        align-items: center;
        gap: 6px;
        margin-bottom: 24px;
    }

    .promotions-search-field-container {
        display: flex;
        width: 246px;
        min-width: 112px;
        flex-direction: column;
        align-items: flex-start;
        flex-shrink: 0;
    }

    .promotions-search-field-container sp-search {
        display: flex;
        box-sizing: border-box;
        height: 32px;
        padding-left: 14px;
        align-items: flex-start;
        align-self: stretch;
        width: 100%;
        --spectrum-search-border-radius: 16px;
        --spectrum-search-border-width: 2px;
        --spectrum-search-border-color-default: var(--Palette-gray-300, #dadada);
        --spectrum-search-background-color: var(--Palette-gray-25, #fff);
    }

    .promotions-search-help-text {
        flex: 1 0 0;
        color: var(--Alias-content-neutral-default, #292929);
        font-family: var(--spectrum-sans-font-family-stack, 'Adobe Clean', sans-serif);
        font-size: var(--Font-size-100, 14px);
        font-style: normal;
        font-weight: 400;
        line-height: var(--Line-height-Font-size-100, 18px);
        letter-spacing: var(--Letter-spacing, 0);
    }

    .promotions-table {
        border-radius: 8px;
        border: 1px solid var(--spectrum-gray-200);
    }

    .promotions-table sp-table-head {
        background-color: var(--spectrum-global-color-gray-100);
    }

    .promotions-table sp-table-head-cell:last-child,
    .promotions-table sp-table-cell:last-child {
        max-width: 100px;
    }

    .promotions-table sp-table-head-cell:last-child {
        text-align: center;
        justify-content: center;
    }

    .promotions-table sp-table-cell:last-child {
        justify-content: center;
    }

    .timeline-cell {
        display: grid;
        grid-template-columns: 140px auto;
        align-items: center;
        gap: var(--spectrum-spacing-100, 8px);
    }

    .evergreen-badge {
        background-color: var(--spectrum-orange-200);
        color: var(--spectrum-gray-900);
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 4px;
        white-space: nowrap;
    }

    .duplicating-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.7);
        z-index: 10;
    }
`;

export default styles;

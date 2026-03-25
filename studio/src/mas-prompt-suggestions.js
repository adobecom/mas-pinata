import { LitElement, html } from 'lit';
import { PROMPT_SUGGESTIONS } from './utils/adobe-topic-filter.js';

class MasPromptSuggestions extends LitElement {
    static properties = {
        suggestions: { type: Array },
    };

    constructor() {
        super();
        this.suggestions = PROMPT_SUGGESTIONS;
    }

    createRenderRoot() {
        return this;
    }

    handleChipClick(query) {
        this.dispatchEvent(
            new CustomEvent('prompt-selected', {
                detail: { query },
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        return html`
            <div
                class="prompt-suggestions"
                style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;"
            >
                ${this.suggestions.map(
                    ({ label, query }) => html`
                        <sp-action-button
                            quiet
                            size="s"
                            @click=${() => this.handleChipClick(query)}
                        >${label}</sp-action-button>
                    `,
                )}
            </div>
        `;
    }
}

customElements.define('mas-prompt-suggestions', MasPromptSuggestions);

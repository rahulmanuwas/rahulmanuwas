# JSON to Markdown Converter

This script processes a specific JSON file format, extracts the markdown content and citations, and generates a clean markdown file with hyperlinked citations.

## How to Use

1.  **Install Dependencies:**
    Navigate to the `deep-research` directory and run the following command to install the necessary packages:
    ```bash
    npm install
    ```

2.  **Run the Script:**
    Use the following command to execute the script. Replace `<input-json-file>` with the path to your JSON file, `<output-directory>` with your desired output folder, and optionally specify a citation style.
    ```bash
    npx ts-node converter.ts <input-json-file> <output-directory> [citation-style]
    ```

### Citation Styles

You can specify one of the following citation styles as the third argument:

*   `superscript` (default): Clean numbered superscripts with references at the end.
*   `inline`: Full citation inline with the text.
*   `bracketed`: Source names in brackets.

### Usage Examples

*   **Default (superscript style):**
    ```bash
    npx ts-node converter.ts input.json output/
    ```
*   **Inline citations:**
    ```bash
    npx ts-node converter.ts input.json output/ inline
    ```
*   **Bracketed citations:**
    ```bash
    npx ts-node converter.ts input.json output/ bracketed
    ```

## Acknowledgements

This script is based on the work of **hrishioa**. The original gist can be found here:
[https://gist.github.com/hrishioa/this](https://gist.github.com/hrishioa/80e5d16884f085c98f91eb592f601e9f)
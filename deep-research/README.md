# JSON to Markdown Converter

This script processes a specific JSON file format, extracts the markdown content and citations, and generates a clean markdown file with hyperlinked citations.

## How to Use

1.  **Install Dependencies:**
    Navigate to the `deep-research` directory and run the following command to install the necessary packages:
    ```bash
    npm install
    ```

2.  **Run the Script:**
    Use the following command to execute the script. Replace `<input-json-file>` with the path to your JSON file and `<output-directory>` with your desired output folder.
    ```bash
    npx ts-node converter.ts <input-json-file> <output-directory>
    ```
    For example:
    ```bash
    npx ts-node converter.ts deep-research-sample.json output
    ```

## Acknowledgements

This script is based on the work of **hrishioa**. The original gist can be found here:
[https://gist.github.com/hrishioa/this](https://gist.github.com/hrishioa/80e5d16884f085c98f91eb592f601e9f)
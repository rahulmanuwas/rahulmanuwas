import { existsSync, mkdirSync, writeFileSync } from "fs";
import { readFile } from "fs/promises";
import { resolve } from "path";

/**
 * Main function to process the JSON file
 */
async function main() {
  // Check command line arguments
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(
      "Usage: npx ts-node deep-research/something.ts <input-json-file> <output-directory>"
    );
    process.exit(1);
  }

  const inputFile = args[0];
  const outputDir = args[1];

  try {
    // Read and parse the JSON file
    const jsonContent = await readFile(inputFile, "utf-8");
    const data = JSON.parse(jsonContent);

    // Extract markdown content
    let markdownContent = data.final_message?.content?.parts?.[0];

    if (!markdownContent || typeof markdownContent !== 'string') {
        console.error("Could not find markdown content in the JSON file.");
        process.exit(1);
    }

    // Process citations
    const citations = data.final_message?.metadata?.citations;
    if (citations && Array.isArray(citations)) {
        const citationUrlMap = new Map<string, {url: string, title: string}>();
        for (const cit of citations) {
            const extra = cit.metadata?.extra;
            if (extra && cit.metadata.url) {
                const placeholder = `【${extra.cited_message_idx}†L${extra.start_line_num}-L${extra.end_line_num}】`;
                citationUrlMap.set(placeholder, {url: cit.metadata.url, title: cit.metadata.title});
            }
        }

        const uniqueUrls = new Map<string, {number: number, title: string}>();
        let urlCounter = 1;

        markdownContent = markdownContent.replace(/【[^】]+】/g, (match: string) => {
            const citation = citationUrlMap.get(match);
            if (citation) {
                if (!uniqueUrls.has(citation.url)) {
                    uniqueUrls.set(citation.url, {number: urlCounter++, title: citation.title});
                }
                const number = uniqueUrls.get(citation.url)!.number;
                return `[${number}]`;
            }
            return match;
        });

        let citationLinks = "\n\n---\n\n## Citations\n";
        const sortedCitations = [...uniqueUrls.entries()].sort((a, b) => a[1].number - b[1].number);

        for (const [url, {number, title}] of sortedCitations) {
            citationLinks += `${number}. [${title}](${url})\n`;
        }
        markdownContent += citationLinks;
    }

    // Extract title from the first line of markdown
    const firstLine = markdownContent.split('\n')[0];
    const title = firstLine.startsWith('# ') ? firstLine.substring(2) : 'output';

    // Generate a safe filename from the title
    const safeTitle = title
      .replace(/[^a-z0-9\s-]/gi, "")
      .replace(/\s+/g, "-")
      .toLowerCase();

    const filePath = resolve(outputDir, `${safeTitle}.md`);

    // Create output directory if it doesn't exist
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Save to file
    writeFileSync(filePath, markdownContent);
    console.log(`Saved: ${filePath}`);

    console.log("Processing completed successfully!");
  } catch (error) {
    console.error("Error processing the JSON file:", error);
    process.exit(1);
  }
}

// Run the script
main();
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { readFile } from "fs/promises";
import { resolve } from "path";

interface Citation {
  metadata?: {
    extra?: {
      cited_message_idx?: number;
      start_line_num?: number;
      end_line_num?: number;
    };
    url?: string;
    title?: string;
    href?: string;
    source_url?: string;
    pub_date?: string;
  };
  url?: string;
  title?: string;
}

interface Message {
  content?: {
    parts?: string[];
  };
  metadata?: {
    citations?: Citation[];
  };
  create_time?: number;
  author?: {
    role?: string;
  };
}

/**
 * Formats citations based on the specified style
 */
function formatCitations(
  bodyContent: string,
  sourcesSection: string,
  citations: Citation[],
  style: "superscript" | "inline" | "bracketed" = "superscript"
): { processedBody: string; cleanedSources: string } {
  const placeholderRegex = /【\d+†L\d+-L\d+】/g;

  // 1. Create a map from placeholder to the source number in the curated list
  const placeholderToSourceNumberMap = new Map<string, number>();
  const sourceLines = sourcesSection.split('\n');
  sourceLines.forEach((line, index) => {
    const sourceNumberMatch = line.match(/^(\d+)\./);
    if (sourceNumberMatch) {
      const sourceNumber = parseInt(sourceNumberMatch[1], 10);
      const placeholders = line.match(placeholderRegex) || [];
      placeholders.forEach(placeholder => {
        placeholderToSourceNumberMap.set(placeholder, sourceNumber);
      });
    }
  });

  // 2. Replace placeholders in the body with the correct superscript number
  const processedBody = bodyContent.replace(placeholderRegex, (match) => {
    const sourceNumber = placeholderToSourceNumberMap.get(match);
    if (sourceNumber) {
      switch (style) {
        case "superscript":
          return `<sup>${sourceNumber}</sup>`;
        // Add other style cases if needed, though problem description implies superscript
        default:
          return `<sup>${sourceNumber}</sup>`;
      }
    }
    return ""; // Remove placeholder if no mapping is found
  });

  // 3. Clean the placeholders from the sources section
  const cleanedSources = sourcesSection.replace(placeholderRegex, "").trim();

  return { processedBody, cleanedSources };
}

/**
 * Main function to process the JSON file
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(
      "Usage: npx ts-node deep-research/converter.ts <input-json-file> <output-directory> [citation-style]"
    );
    console.error("Citation styles: superscript (default), inline, bracketed");
    process.exit(1);
  }

  const inputFile = args[0];
  const outputDir = args[1];
  const citationStyle = (args[2] as "superscript" | "inline" | "bracketed") || "superscript";

  try {
    // Read and parse the JSON file
    const jsonContent = await readFile(inputFile, "utf-8");
    const data = JSON.parse(jsonContent);

    // Extract markdown content
    let finalMessage: Message | undefined;
    
    if (data.final_message) {
      finalMessage = data.final_message;
    } else if (data.mapping) {
      let latestTime = 0;
      for (const key in data.mapping) {
        const messageNode = data.mapping[key];
        if (
          messageNode.message &&
          messageNode.message.author?.role === "assistant" &&
          messageNode.message.create_time > latestTime &&
          messageNode.message.content?.parts?.[0]
        ) {
          latestTime = messageNode.message.create_time;
          finalMessage = messageNode.message;
        }
      }
    }

    if (!finalMessage) {
      console.error("Could not find a final message in the JSON file.");
      process.exit(1);
    }

    let markdownContent = finalMessage.content?.parts?.[0];

    if (!markdownContent || typeof markdownContent !== "string") {
      console.error("Could not find markdown content in the JSON file.");
      process.exit(1);
    }

    // Process citations if available
    const citations = finalMessage.metadata?.citations;
    if (citations && Array.isArray(citations)) {
      console.log(`Processing ${citations.length} citations with style: ${citationStyle}`);
      
      // Split content to exclude the final "Sources" or "References" section from citation processing
      const sourcesRegex = /\n(---\n\n)?\*\*?(Sources|References):\*\*?\n/i;
      const match = markdownContent.match(sourcesRegex);
      
      let bodyContent = markdownContent;
      let sourcesSection = "";

      if (match && match.index) {
        bodyContent = markdownContent.substring(0, match.index);
        sourcesSection = markdownContent.substring(match.index);
        
        const { processedBody, cleanedSources } = formatCitations(
          bodyContent,
          sourcesSection,
          citations,
          citationStyle
        );
        
        markdownContent = processedBody + cleanedSources;

      } else {
        // Fallback for documents without a clear sources section
        // This re-implements the original logic in a simplified way
        const citationUrlMap = new Map<string, { url: string; title: string }>();
        for (const cit of citations) {
            const extra = cit.metadata?.extra;
            const url = cit.metadata?.url || cit.url || cit.metadata?.href || cit.metadata?.source_url;
            if (extra && url) {
                const placeholder = `【${extra.cited_message_idx}†L${extra.start_line_num}-L${extra.end_line_num}】`;
                citationUrlMap.set(placeholder, { url, title: cit.metadata?.title || cit.title || "Untitled" });
            }
        }

        let urlCounter = 1;
        const uniqueUrls = new Map<string, number>();
        markdownContent = markdownContent.replace(/(【[^】]+】)+/g, (match: string) => {
            const placeholders = match.match(/【[^】]+】/g) || [];
            const citationNumbers = new Set<number>();
            for (const placeholder of placeholders) {
                const citation = citationUrlMap.get(placeholder);
                if (citation && citation.url) {
                    if (!uniqueUrls.has(citation.url)) {
                        uniqueUrls.set(citation.url, urlCounter++);
                    }
                    citationNumbers.add(uniqueUrls.get(citation.url)!);
                }
            }
            return [...citationNumbers].sort((a, b) => a - b).map(n => `<sup>${n}</sup>`).join('');
        });
      }
    }

    // Extract title from the first line of markdown
    const firstLine = markdownContent.split("\n")[0];
    const title = firstLine.startsWith("# ") 
      ? firstLine.substring(2).trim() 
      : "output";

    // Generate a safe filename from the title
    const safeTitle = title
      .replace(/[^a-z0-9\s-]/gi, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .substring(0, 100); // Limit filename length

    const filePath = resolve(outputDir, `${safeTitle}.md`);

    // Create output directory if it doesn't exist
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Save to file
    writeFileSync(filePath, markdownContent);
    console.log(`✅ Saved: ${filePath}`);
    console.log(`📊 Total citations processed: ${citations?.length || 0}`);

  } catch (error) {
    console.error("❌ Error processing the JSON file:", error);
    process.exit(1);
  }
}

// Run the script
main();
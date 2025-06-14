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
  markdownContent: string,
  citations: Citation[],
  style: "superscript" | "inline" | "bracketed" = "superscript"
): string {
  const citationUrlMap = new Map<string, { url: string; title: string }>();

  // Build citation map
  for (const cit of citations) {
    const extra = cit.metadata?.extra;
    const url = cit.metadata?.url || cit.url || cit.metadata?.href || cit.metadata?.source_url;
    
    let title = (cit.metadata?.title || cit.title || "Untitled")
      .replace(/\s+/g, " ")
      .trim();
    
    // Clean up common URL artifacts from titles
    title = title.replace(/#:~:text=.*$/, "").trim();
    
    if (title.length > 60) {
      title = title.substring(0, 57) + "...";
    }

    if (extra && url) {
      const placeholder = `【${extra.cited_message_idx}†L${extra.start_line_num}-L${extra.end_line_num}】`;
      citationUrlMap.set(placeholder, { url, title });
    }
  }

  const uniqueUrls = new Map<string, { number: number; title: string; domain: string }>();
  let urlCounter = 1;

  // Extract domain from URL for inline citations
  const getDomain = (url: string): string => {
    try {
      const u = new URL(url);
      return u.hostname.replace("www.", "");
    } catch {
      return "source";
    }
  };

  // Replace citation placeholders based on style
  let processedContent = markdownContent.replace(/(【[^】]+】)+/g, (match: string) => {
    const placeholders = match.match(/【[^】]+】/g) || [];
    const citationNumbers = new Set<number>();
    const citationData: Array<{ url: string; title: string; domain: string }> = [];

    for (const placeholder of placeholders) {
      const citation = citationUrlMap.get(placeholder);
      if (citation && citation.url) {
        const domain = getDomain(citation.url);
        
        if (!uniqueUrls.has(citation.url)) {
          uniqueUrls.set(citation.url, {
            number: urlCounter++,
            title: citation.title,
            domain
          });
        }
        
        const data = uniqueUrls.get(citation.url);
        if (data) {
          citationNumbers.add(data.number);
          citationData.push({ ...citation, domain });
        }
      }
    }

    if (citationNumbers.size === 0) return "";

    const sortedNumbers = [...citationNumbers].sort((a, b) => a - b);

    switch (style) {
      case "superscript":
        return sortedNumbers.map(n => `<sup>${n}</sup>`).join("");
        
      case "inline":
        // For inline, use the first citation's data
        const firstCitation = citationData[0];
        return ` ([${firstCitation.title}](${firstCitation.url}))`;
        
      case "bracketed":
        // Use domain names for bracketed style
        const domains = [...new Set(citationData.map(c => c.domain))];
        return ` [${domains.join(", ")}]`;
        
      default:
        return sortedNumbers.map(n => `<sup>${n}</sup>`).join("");
    }
  });

  // Add reference section for superscript and bracketed styles
  if ((style === "superscript" || style === "bracketed") && uniqueUrls.size > 0) {
    let citationLinks = "\n\n---\n\n## References\n\n";
    const sortedCitations = [...uniqueUrls.entries()].sort((a, b) => a[1].number - b[1].number);

    for (const [url, { number, title }] of sortedCitations) {
      if (url && url.trim() !== "") {
        citationLinks += `${number}. [${title}](${url})\n`;
      } else {
        citationLinks += `${number}. ${title} (URL not available)\n`;
      }
    }
    processedContent += citationLinks;
  }

  return processedContent;
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
      markdownContent = formatCitations(markdownContent, citations, citationStyle);
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
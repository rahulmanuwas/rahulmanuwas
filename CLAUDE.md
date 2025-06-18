# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Deep Research Project
- **Install dependencies**: `npm install` (in deep-research/)
- **Run converter**: `npx ts-node converter.ts <input-json> <output-dir> [citation-style]` (in deep-research/)
- **Type checking**: `npx tsc --noEmit` (in deep-research/)
- **Build**: `npx tsc` (in deep-research/)

### Citation Styles
The converter supports three citation formats:
- `superscript` (default): Clean numbered superscripts with references at the end
- `inline`: Full citation inline with the text
- `bracketed`: Source names in brackets

## Project Architecture

### Repository Structure
This is a professional portfolio repository focused on showcasing technical leadership and investment capabilities:

1. **deep-research/**: AI-Powered Market Intelligence Platform
   - Converts research papers and market reports from JSON format to structured analysis
   - Handles multiple citation styles and source formatting for investment research
   - Enables due diligence acceleration and investment thesis generation
   - Based on work by hrishioa with custom business-focused enhancements

### Key Technical Details

**TypeScript Configuration**:
- Strict mode enabled with ES2022 target
- CommonJS modules for Node.js compatibility
- Type definitions for complex JSON structures (Citation, Message interfaces)

**Data Processing**:
- Processes JSON files with nested citation metadata
- Regex-based placeholder replacement for citation formatting
- File system operations for batch processing

**Code Patterns**:
- Interface-driven development with clear type definitions
- Functional approach to data transformation
- Error handling through file existence checks

## File Naming Conventions
- Research outputs: Descriptive names with hyphens for clarity
- TypeScript files: camelCase with clear purpose indication
- Documentation files: Descriptive names reflecting business value

## Important Notes
- Utility-focused tools with validation and error handling
- Portfolio repository showcasing technical leadership and market analysis capabilities
- Professional showcase repository - demonstrating business-focused technical solutions
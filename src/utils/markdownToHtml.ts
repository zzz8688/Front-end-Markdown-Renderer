import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github.css';
import remarkSpoiler from './remarkSpoiler';

export function repairMarkdown(text: string): string {
  let fixed = text;

  let backslashCount = 0;
  for (let i = fixed.length - 1; i >= 0; i--) {
    if (fixed[i] === '\\') {
      backslashCount++;
    } else {
      break;
    }
  }
  if (backslashCount % 2 !== 0) {
    fixed = fixed.slice(0, -1);
  }

  const placeholders: { key: string, content: string }[] = [];
  const createPlaceholder = (content: string) => {
    const key = `%%BLOCK_PLACEHOLDER_${placeholders.length}%%`;
    placeholders.push({ key, content });
    return key;
  };

  const processBlocks = (pattern: RegExp, closeStr: string, isMath = false) => {
      const breakerRegex = isMath 
          ? /\n(?:(?:\s*\n(?=#{1,6}\s|\|))|(?=```))/
          : /\n(?:(?:\s*\n(?=#{1,6}\s|\|))|(?=\$\$))/;

      const parts = [];
      let lastIndex = 0;
      let match;
      
      const globalPattern = new RegExp(pattern, 'g');
      
      while ((match = globalPattern.exec(fixed)) !== null) {
          if (match.index < lastIndex) continue;

          parts.push(fixed.slice(lastIndex, match.index));
          
          const start = match.index;
          const contentStart = start + match[0].length;
          
          let end = -1;
          const remaining = fixed.slice(contentStart);
          
          const closePattern = isMath ? /\$\$/ : /```/;
          const closeMatch = remaining.match(closePattern);
          const naturalEndIndex = closeMatch ? contentStart + closeMatch.index! : -1;
          
          let breakerIndex = -1;
          const bMatch = remaining.match(breakerRegex);
          if (bMatch) {
              breakerIndex = contentStart + bMatch.index!;
          }
          
          if (breakerIndex !== -1 && (naturalEndIndex === -1 || breakerIndex < naturalEndIndex)) {
              end = breakerIndex;
              const blockContent = fixed.slice(start, end);
              const closedContent = blockContent + (blockContent.endsWith('\n') ? closeStr : '\n' + closeStr);
              parts.push(createPlaceholder(closedContent));
              lastIndex = end;
          } else if (naturalEndIndex !== -1) {
              end = naturalEndIndex + closeMatch![0].length;
              const blockContent = fixed.slice(start, end);
              parts.push(createPlaceholder(blockContent));
              lastIndex = end;
          } else {
              const blockContent = fixed.slice(start);
              const closedContent = blockContent + (blockContent.endsWith('\n') ? closeStr : '\n' + closeStr);
              parts.push(createPlaceholder(closedContent));
              lastIndex = fixed.length;
          }
          
          globalPattern.lastIndex = lastIndex;
      }
      
      parts.push(fixed.slice(lastIndex));
      fixed = parts.join('');
  };

  processBlocks(/(^|\n)```/g, '```', false);
  processBlocks(/(^|\n)\$\$/g, '$$', true);

  const paragraphs = fixed.split(/(\n\s*\n)/); 
  
  for (let p = 0; p < paragraphs.length; p++) {
      if (p % 2 !== 0) continue;
      
      let segment = paragraphs[p];
      
      let backtickCount = 0;
      for (let i = 0; i < segment.length; i++) {
        if (segment[i] === '\\') {
          i++; continue;
        }
        if (segment[i] === '`') {
          backtickCount++;
        }
      }
      if (backtickCount % 2 !== 0) {
        segment += '`';
      }

      let dollarCount = 0;
      for (let i = 0; i < segment.length; i++) {
        if (segment[i] === '\\') {
          i++; continue;
        }
        if (segment[i] === '$') {
          dollarCount++;
        }
      }
      if (dollarCount % 2 !== 0) {
        segment += '$';
      }
      
      paragraphs[p] = segment;
  }
  
  fixed = paragraphs.join('');

  const linkRegex = /(!?\[[^\]\n]*\]\([^\)\n]*)(?=$|\n)/gm;
  fixed = fixed.replace(linkRegex, '$1)');

  placeholders.forEach(({ key, content }) => {
    fixed = fixed.replace(key, () => content);
  });

  return fixed;
}

interface MarkdownOptions {
  enableSyntaxFix?: boolean;
}

export async function markdownToHtml(markdown: string, options: MarkdownOptions = {}): Promise<string> {
  let textToProcess = markdown;
  
  if (options.enableSyntaxFix) {
    textToProcess = repairMarkdown(markdown);
  } else {
    const mathBlockCount = (textToProcess.match(/\$\$/g) || []).length;
    if (mathBlockCount % 2 !== 0) {
        const lastIndex = textToProcess.lastIndexOf('$$');
        if (lastIndex !== -1) {
            textToProcess = textToProcess.substring(0, lastIndex) + '\\$$' + textToProcess.substring(lastIndex + 2);
        }
    }

    const codeBlockCount = (textToProcess.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
        const lastIndex = textToProcess.lastIndexOf('```');
        if (lastIndex !== -1) {
            textToProcess = textToProcess.substring(0, lastIndex) + '\\```' + textToProcess.substring(lastIndex + 3);
        }
    }
    
    let temp = textToProcess.replace(/\$\$.*?\$\$/g, 'PLACEHOLDER');
    
    const inlineMathCount = (temp.match(/(?<!\\)\$/g) || []).length;
    if (inlineMathCount % 2 !== 0) {
        const lastIndex = textToProcess.lastIndexOf('$');
        if (lastIndex !== -1) {
             textToProcess = textToProcess.substring(0, lastIndex) + '\\$' + textToProcess.substring(lastIndex + 1);
        }
    }
  }

  const file = await unified()
    .use(remarkParse)
    .use(remarkSpoiler)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(rehypeStringify)
    .process(textToProcess);

  return String(file);
}
import React, { useState, useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, ExternalLink } from 'lucide-react';
import Prism from 'prismjs';

// Load common language grammars for Prism
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-docker';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  py: 'python',
  python3: 'python',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  md: 'markdown',
  dockerfile: 'docker',
  rs: 'rust',
  golang: 'go',
  'c++': 'cpp',
  'c#': 'csharp',
  cs: 'csharp'
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming }) => {
  return (
    <div className="markdown-body select-text text-dark-100">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children, ...props }: any) {
            const codeChild = children;
            if (codeChild && typeof codeChild === 'object' && codeChild.props) {
              const { className, children: rawCode } = codeChild.props;
              const match = /language-([a-zA-Z0-9_-]+)/.exec(className || '');
              const lang = match ? match[1] : '';
              const codeString = String(rawCode || '').replace(/\n$/, '');
              return <CodeBlock language={lang} code={codeString} />;
            }
            return <pre {...props}>{children}</pre>;
          },
          code({ children, className, ...props }: any) {
            return (
              <code
                className="px-1.5 py-0.5 rounded bg-dark-800 border border-dark-700/70 font-mono text-[13px] text-sky-400 select-text"
                {...props}
              >
                {children}
              </code>
            );
          },
          a({ href, children, ...props }: any) {
            const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              if (href) {
                if ((window as any).electronAPI?.openExternalUrl) {
                  (window as any).electronAPI.openExternalUrl(href);
                } else {
                  window.open(href, '_blank');
                }
              }
            };
            return (
              <a
                href={href}
                onClick={handleClick}
                className="text-pi-accent hover:text-blue-400 underline underline-offset-2 inline-flex items-center gap-0.5 cursor-pointer font-medium"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                <span>{children}</span>
                <ExternalLink size={11} className="inline opacity-70 ml-0.5" />
              </a>
            );
          },
          table({ children, ...props }: any) {
            return (
              <div className="my-3 overflow-x-auto rounded-lg border border-dark-750 bg-dark-900/50">
                <table className="w-full text-left border-collapse text-xs" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          th({ children, ...props }: any) {
            return (
              <th className="bg-dark-800/90 text-dark-200 font-semibold px-3 py-2 border-b border-dark-700 text-xs" {...props}>
                {children}
              </th>
            );
          },
          td({ children, ...props }: any) {
            return (
              <td className="px-3 py-2 border-b border-dark-800 text-dark-300 text-xs" {...props}>
                {children}
              </td>
            );
          },
          blockquote({ children, ...props }: any) {
            return (
              <blockquote
                className="my-3 pl-3.5 py-1 border-l-2 border-pi-accent bg-dark-850/60 rounded-r-md text-dark-300 text-xs italic"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          h1({ children, ...props }: any) {
            return (
              <h1 className="text-lg font-bold text-dark-100 mt-4 mb-2 pb-1 border-b border-dark-800" {...props}>
                {children}
              </h1>
            );
          },
          h2({ children, ...props }: any) {
            return (
              <h2 className="text-base font-semibold text-dark-100 mt-3.5 mb-1.5 pb-0.5 border-b border-dark-800/60" {...props}>
                {children}
              </h2>
            );
          },
          h3({ children, ...props }: any) {
            return (
              <h3 className="text-sm font-semibold text-dark-200 mt-3 mb-1" {...props}>
                {children}
              </h3>
            );
          },
          h4({ children, ...props }: any) {
            return (
              <h4 className="text-xs font-semibold text-dark-300 mt-2.5 mb-1 uppercase tracking-wider" {...props}>
                {children}
              </h4>
            );
          },
          ul({ children, ...props }: any) {
            return (
              <ul className="list-disc list-outside pl-5 my-2 space-y-1 text-sm text-dark-200" {...props}>
                {children}
              </ul>
            );
          },
          ol({ children, ...props }: any) {
            return (
              <ol className="list-decimal list-outside pl-5 my-2 space-y-1 text-sm text-dark-200" {...props}>
                {children}
              </ol>
            );
          },
          li({ children, ...props }: any) {
            return (
              <li className="leading-relaxed" {...props}>
                {children}
              </li>
            );
          },
          p({ children, ...props }: any) {
            return (
              <p className="my-2 leading-relaxed text-sm text-dark-100" {...props}>
                {children}
              </p>
            );
          },
          hr({ ...props }: any) {
            return <hr className="my-3 border-dark-750" {...props} />;
          }
        }}
      >
        {content}
      </Markdown>
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 bg-pi-accent ml-1 align-middle animate-pulse" />
      )}
    </div>
  );
};

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const normalizedLang = useMemo(() => {
    const raw = (language || '').toLowerCase().trim();
    return LANGUAGE_ALIASES[raw] || raw;
  }, [language]);

  const highlightedHtml = useMemo(() => {
    if (!normalizedLang || !Prism.languages[normalizedLang]) {
      return null;
    }
    try {
      return Prism.highlight(code, Prism.languages[normalizedLang], normalizedLang);
    } catch {
      return null;
    }
  }, [code, normalizedLang]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const displayLanguage = (normalizedLang || 'text').toUpperCase();

  return (
    <div className="my-3 rounded-xl border border-dark-750 bg-[#0d0e11] overflow-hidden shadow-lg group/code">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-dark-900/90 border-b border-dark-800 text-[11px] select-none">
        <span className="font-mono font-medium text-dark-400 tracking-wider text-[10px]">
          {displayLanguage}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-dark-400 hover:text-dark-200 transition px-2 py-0.5 rounded hover:bg-dark-800"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check size={11} className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-3.5 overflow-x-auto font-mono text-xs leading-relaxed select-text">
        {highlightedHtml ? (
          <pre
            className="!bg-transparent !p-0 !m-0 overflow-visible font-mono"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <pre className="!bg-transparent !p-0 !m-0 overflow-visible text-dark-200 font-mono">
            {code}
          </pre>
        )}
      </div>
    </div>
  );
};

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from '../hooks/useTheme';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { isDark } = useTheme();

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            return !inline && language ? (
              <div className="relative">
                <SyntaxHighlighter
                  style={isDark ? oneDark : oneLight}
                  language={language}
                  PreTag="div"
                  className="rounded-lg"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                  }}
                  className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 dark:bg-gray-600 text-white rounded opacity-70 hover:opacity-100 transition-opacity"
                >
                  Copy
                </button>
              </div>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a({ ...props }) {
            return (
              <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}


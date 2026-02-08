// Code Preview Component with Syntax Highlighting
import { Highlight, themes } from 'prism-react-renderer'
import { Sandpack } from '@codesandbox/sandpack-react'
import { useMemo } from 'react'

interface CodePreviewProps {
  code: string
  language: string
  showLineNumbers?: boolean
}

export function CodePreview({
  code,
  language,
  showLineNumbers = true,
}: CodePreviewProps) {
  return (
    <Highlight theme={themes.vsDark} code={code} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${className} text-sm overflow-auto p-4 rounded-lg`}
          style={style}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {showLineNumbers && (
                <span className='inline-block w-8 select-none opacity-50 text-right mr-4'>
                  {i + 1}
                </span>
              )}
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}

// Live Preview Component with Sandpack
interface FileOutput {
  path: string
  content: string
  language?: string
}

interface LivePreviewProps {
  files: FileOutput[]
  framework?: string
}

export function LivePreview({ files, framework = 'react' }: LivePreviewProps) {
  const sandpackFiles = useMemo(() => {
    const filesObj: Record<string, string> = {}

    files.forEach((file) => {
      // Convert file paths to Sandpack format
      let sandpackPath = file.path

      // Ensure paths start with /
      if (!sandpackPath.startsWith('/')) {
        sandpackPath = '/' + sandpackPath
      }

      filesObj[sandpackPath] = file.content
    })

    return filesObj
  }, [files])

  const template = framework === 'react' ? 'react-ts' : 'react'

  return (
    <div className='w-full h-full' style={{ minHeight: '600px', height: '100%' }}>
      <Sandpack
        template={template}
        files={sandpackFiles}
        theme='dark'
        options={{
          showNavigator: true,
          showTabs: true,
          showLineNumbers: true,
          editorHeight: '100%',
          editorWidthPercentage: 0,
          showInlineErrors: true,
          wrapContent: true,
        }}
        style={{ height: '100%', minHeight: '600px' }}
      />
    </div>
  )
}

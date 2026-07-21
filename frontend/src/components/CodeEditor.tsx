"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  readOnly?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [monaco, setMonaco] = useState<any>(null);

  useEffect(() => {
    let monacoInstance: any;

    const loadMonaco = async () => {
      try {
        // Import Monaco Editor dynamically
        const monacoEditor = await import("monaco-editor");
        monacoInstance = monacoEditor;
        setMonaco(monacoEditor);

        if (editorRef.current) {
          // Create editor instance
          const editor = monacoEditor.editor.create(editorRef.current, {
            value: value,
            language: language,
            theme: "vs-dark",
            automaticLayout: true,
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: "on",
            readOnly: readOnly,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
          });

          // Listen for changes
          editor.onDidChangeModelContent(() => {
            onChange(editor.getValue());
          });

          setIsLoading(false);

          // Cleanup
          return () => {
            editor.dispose();
          };
        }
      } catch (error) {
        console.error("Failed to load Monaco Editor:", error);
        setIsLoading(false);
      }
    };

    loadMonaco();
  }, []);

  // Fallback: Textarea if Monaco fails to load
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-lg">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading Code Editor...</p>
        </div>
      </div>
    );
  }

  if (!monaco) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className="w-full h-full p-4 bg-slate-900 text-white font-mono text-sm rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-600"
        spellCheck={false}
      />
    );
  }

  return (
    <div
      ref={editorRef}
      className="w-full h-full rounded-lg overflow-hidden border-2 border-slate-700"
    />
  );
}

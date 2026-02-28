"use client";

import { useCallback, useState } from "react";
import { Upload, CheckCircle2, FileText } from "lucide-react";

interface FileUploadProps {
  onFileParsed: (text: string) => void;
}

export default function FileUpload({ onFileParsed }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        onFileParsed(e.target?.result as string);
      };
      reader.readAsText(file);
    },
    [onFileParsed]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`w-full max-w-2xl mx-auto border-2 border-dashed rounded-2xl p-14 text-center transition-all duration-300 cursor-pointer ${
        fileName
          ? "border-[#25D366] bg-green-50/50"
          : dragging
            ? "border-[#25D366] bg-green-50 scale-[1.01]"
            : "border-gray-300 hover:border-[#25D366]/50 hover:bg-green-50/30 bg-white"
      }`}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept=".txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {fileName ? (
        <div className="animate-[fadeInScale_0.3s_ease-out]">
          <div className="w-14 h-14 rounded-full bg-[#25D366]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#25D366]" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-gray-400" />
            <p className="text-lg font-semibold text-gray-900">{fileName}</p>
          </div>
          <p className="text-sm text-[#25D366] font-medium">
            File loaded successfully · Click to change
          </p>
        </div>
      ) : (
        <>
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-7 h-7 text-[#25D366]" />
          </div>
          <p className="text-xl font-semibold text-gray-900 mb-1">
            Drag &amp; drop your WhatsApp .txt export here
          </p>
          <p className="text-gray-500 text-sm">
            or <span className="text-[#25D366] font-medium underline underline-offset-2">click to browse</span>
          </p>
        </>
      )}
    </div>
  );
}

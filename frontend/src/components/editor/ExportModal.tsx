import React, { useState } from 'react';
import { X, FileText, Download, Check, Sparkles, Code, FileDown } from 'lucide-react';
import type { Editor } from '@tiptap/react';
import type { DocumentItem } from '../../types/document';
import { documentService } from '../../services/documentService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem;
  editor: Editor | null;
}

export type ExportFormat = 'pdf' | 'markdown' | 'docx' | 'html';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  editor
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const getHTMLContent = () => {
    if (editor) return editor.getHTML();
    return `<h1>${doc.title}</h1><p>Document content generated from CollabSpace.</p>`;
  };

  const getMarkdownContent = () => {
    if (editor) {
      // Basic HTML to Markdown conversion
      let text = editor.getHTML();
      text = text.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n');
      text = text.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n');
      text = text.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n');
      text = text.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
      text = text.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
      text = text.replace(/<em>(.*?)<\/em>/gi, '*$1*');
      text = text.replace(/<code>(.*?)<\/code>/gi, '`$1`');
      text = text.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
      text = text.replace(/<[^>]+>/g, '');
      return `# ${doc.title}\n\n${text.trim()}`;
    }
    return `# ${doc.title}\n\nDocument exported from CollabSpace.`;
  };

  const triggerDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = filename;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    const sanitizedTitle = doc.title.toLowerCase().replace(/[^a-z0-9]/g, '_');

    try {
      if (selectedFormat === 'pdf') {
        window.print();
      } else if (selectedFormat === 'html' || selectedFormat === 'markdown') {
        const blob = await documentService.exportDocument(doc.id, selectedFormat);
        if (blob) {
          const url = URL.createObjectURL(blob as Blob);
          const a = window.document.createElement('a');
          a.href = url;
          a.download = `${sanitizedTitle}.${selectedFormat === 'markdown' ? 'md' : selectedFormat}`;
          window.document.body.appendChild(a);
          a.click();
          window.document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } else {
        const content = getMarkdownContent();
        triggerDownload(`${sanitizedTitle}.docx`, content, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      }

      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        onClose();
      }, 1200);
    } catch {
      // fallback to local export
      const content = selectedFormat === 'markdown' ? getMarkdownContent() : getHTMLContent();
      const ext = selectedFormat === 'markdown' ? 'md' : selectedFormat;
      triggerDownload(`${sanitizedTitle}.${ext}`, content, 'text/plain');
    }
    setIsExporting(false);
  };

  const formats = [
    {
      id: 'pdf',
      name: 'PDF Document (.pdf)',
      desc: 'High-quality printable document with publication typography',
      icon: FileText,
      color: '#EF4444'
    },
    {
      id: 'markdown',
      name: 'Markdown File (.md)',
      desc: 'Raw structured plain text for developers and note apps',
      icon: Code,
      color: '#3B82F6'
    },
    {
      id: 'docx',
      name: 'Microsoft Word (.docx)',
      desc: 'Editable office document formatted for Word & Pages',
      icon: FileDown,
      color: '#2563EB'
    },
    {
      id: 'html',
      name: 'Web Page (.html)',
      desc: 'Standalone HTML document with embedded styles',
      icon: Sparkles,
      color: '#D97706'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F5F5F4] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D97706]/10 text-[#D97706] flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-editorial text-lg font-bold text-[#1C1917]">Export Document</h3>
              <p className="text-xs text-[#78716C]">Choose your preferred file format</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#78716C] hover:bg-[#F4F0EA] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="space-y-2.5 mb-6">
          {formats.map(fmt => {
            const Icon = fmt.icon;
            const isSelected = selectedFormat === fmt.id;

            return (
              <div
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id as ExportFormat)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  isSelected
                    ? 'bg-[#FAF8F5] border-[#1C1917] shadow-xs'
                    : 'bg-white border-[#E7E5E4] hover:bg-[#FAF8F5]/50'
                }`}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${fmt.color}15`, color: fmt.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold ${isSelected ? 'text-[#1C1917]' : 'text-[#44403C]'}`}>{fmt.name}</p>
                    {isSelected && <Check className="w-4 h-4 text-[#1C1917]" />}
                  </div>
                  <p className="text-[11px] text-[#78716C] mt-0.5">{fmt.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#F5F5F4]">
          <span className="text-[11px] text-[#78716C]">Target file: <span className="font-mono font-semibold text-[#1C1917]">{doc.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.{selectedFormat}</span></span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#57534E] bg-[#F4F0EA] hover:bg-[#E7E5E4] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#1C1917] hover:bg-[#292524] disabled:opacity-50 rounded-xl shadow-xs transition-colors"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  Exported!
                </>
              ) : isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download File
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useCallback } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Loader2, File, FileText, FileCode } from 'lucide-react';
import { apiClient } from '../../api/client';

interface UploadDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (filename: string) => void;
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

const ACCEPTED_FORMATS = ['.docx', '.md', '.pdf'];

export const UploadDocModal: React.FC<UploadDocModalProps> = ({ isOpen, onClose, onUploadComplete }) => {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const resetState = () => {
    setUploadState('idle');
    setUploadProgress(0);
    setFileName('');
    setErrorMsg('');
  };

  const uploadFile = async (file: File) => {
    setFileName(file.name);
    setUploadState('uploading');
    setUploadProgress(30);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress(60);
      await apiClient.upload<any>('/upload/document', formData);

      setUploadProgress(100);
      setUploadState('processing');

      setTimeout(() => {
        setUploadState('completed');
        setTimeout(() => {
          onUploadComplete(file.name);
          onClose();
          resetState();
        }, 1200);
      }, 800);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Upload failed');
      setUploadState('error');
    }
  };

  const handleFile = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_FORMATS.includes(ext)) {
      setErrorMsg(`Unsupported format "${ext}". Accepted: .docx, .md, .pdf`);
      setUploadState('error');
      return;
    }
    setErrorMsg('');
    uploadFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) handleFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return <File className="w-8 h-8 text-[#DC2626]" />;
    if (name.endsWith('.md')) return <FileCode className="w-8 h-8 text-[#3B82F6]" />;
    return <FileText className="w-8 h-8 text-[#2563EB]" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5F5F4]">
          <div>
            <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">Upload Document</h3>
            <p className="text-xs text-[#78716C] mt-0.5">Supported: .docx, .md, .pdf</p>
          </div>
          <button onClick={() => { onClose(); resetState(); }} className="p-2 rounded-lg text-[#78716C] hover:bg-[#F4F0EA] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {uploadState === 'idle' || uploadState === 'error' ? (
            <>
              <label
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                  isDragging ? 'border-[#D97706] bg-[#FEF3C7]/30' : 'border-[#D6D3D1] hover:border-[#A8A29E] bg-[#FAF8F5]'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#F4F0EA] border border-[#E7E5E4] flex items-center justify-center">
                  <Upload className="w-7 h-7 text-[#78716C]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#1C1917]">
                    {isDragging ? 'Release to upload' : 'Drag & drop your file here'}
                  </p>
                  <p className="text-xs text-[#78716C] mt-1">
                    or <span className="text-[#D97706] font-semibold">browse files</span>
                  </p>
                </div>
                <input type="file" accept=".docx,.md,.pdf" onChange={handleInputChange} className="hidden" />
              </label>
              {uploadState === 'error' && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#991B1B]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="flex items-center gap-3 bg-[#FAF8F5] p-4 rounded-xl border border-[#E7E5E4] w-full">
                {getFileIcon(fileName)}
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-semibold text-[#1C1917] truncate">{fileName}</p>
                  <p className="text-[11px] text-[#78716C] font-mono mt-0.5">
                    {uploadState === 'uploading' && `Uploading... ${uploadProgress}%`}
                    {uploadState === 'processing' && 'Processing document...'}
                    {uploadState === 'completed' && 'Upload complete!'}
                  </p>
                </div>
                {uploadState === 'completed' && <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />}
                {uploadState === 'processing' && <Loader2 className="w-5 h-5 text-[#D97706] animate-spin shrink-0" />}
              </div>
              {uploadState === 'uploading' && (
                <div className="w-full space-y-2">
                  <div className="h-2 bg-[#F4F0EA] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#1C1917] to-[#D97706] rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
              {uploadState === 'processing' && (
                <div className="flex items-center gap-2 text-xs text-[#57534E]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#D97706]" />
                  <span>Processing document...</span>
                </div>
              )}
              {uploadState === 'completed' && (
                <div className="flex items-center gap-2 text-xs text-[#047857] font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>Document uploaded successfully!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

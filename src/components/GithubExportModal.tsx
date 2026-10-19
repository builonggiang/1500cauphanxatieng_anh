import React, { useState } from 'react';
import {
  X,
  Github,
  Download,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Terminal,
  FolderGit2,
} from 'lucide-react';
import { ALL_UNITS } from '../data';

interface GithubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GithubExportModal: React.FC<GithubExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownloadDatasetJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(ALL_UNITS, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'english_1500_sentences_full.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const gitCommands = `# 1. Khởi tạo Git repo và commit mã nguồn:
git init
git add .
git commit -m "feat: Ứng dụng Luyện Phản Xạ 1500 Câu Tiếng Anh 4 phần"

# 2. Tạo repository mới trên GitHub (github.com/new) rồi liên kết:
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main

# 3. Để deploy tự động lên GitHub Pages:
npm run build
# Sử dụng GitHub Actions hoặc deploy thư mục 'dist/'
`;

  const ghPagesAction = `name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Hướng Dẫn Đưa Lên GitHub & GitHub Pages
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lưu trữ mã nguồn và chia sẻ web cho bạn bè miễn phí
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick dataset export */}
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-indigo-600" />
                Tải Bộ Dữ Liệu 1500 Câu Chuẩn (.JSON)
              </h3>
              <p className="text-xs text-indigo-800/80 dark:text-indigo-300">
                Toàn bộ 50 Units, 1500 câu, gợi ý từ khóa và đáp án chuẩn để đưa vào repo.
              </p>
            </div>
            <button
              onClick={handleDownloadDatasetJson}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Tải file JSON
            </button>
          </div>

          {/* Step 1: Git Push */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-600" />
                Bước 1: Đẩy mã nguồn lên GitHub Repo
              </h3>
              <button
                onClick={() => handleCopy(gitCommands, 'git')}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 font-medium"
              >
                {copiedSection === 'git' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Sao chép lệnh
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
              {gitCommands}
            </pre>
          </div>

          {/* Step 2: GitHub Actions for Pages */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                Bước 2: Tự động chạy web với GitHub Pages (.github/workflows/deploy.yml)
              </h3>
              <button
                onClick={() => handleCopy(ghPagesAction, 'pages')}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 font-medium"
              >
                {copiedSection === 'pages' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Sao chép file yaml
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tạo file <code className="text-rose-500">.github/workflows/deploy.yml</code> trong repo của bạn, sau đó vào repo <strong>Settings → Pages → Source: GitHub Actions</strong>.
            </p>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800 max-h-48">
              {ghPagesAction}
            </pre>
          </div>

          {/* Web Speech & Offline capability notice */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              Tương thích 100% với GitHub Pages Static Hosting:
            </p>
            <p>
              Tất cả 4 phần (Viết hoàn thiện, Nghe đáp án bản xứ, Nghe chép chính tả, và Luyện phát âm) đều có chế độ chạy offline / client-side mượt mà trên GitHub Pages thông qua Web Speech API &amp; thuật toán chấm điểm Levenshtein tích hợp sẵn, không phụ thuộc bắt buộc vào server ngoài!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-white transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

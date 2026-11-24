import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Trash2,
  Copy,
  Check,
  Download,
  FileText,
  Sparkles,
  ArrowUpRight,
  Building2,
  Calendar,
  SlidersHorizontal,
  ShieldCheck,
} from 'lucide-react';
import {
  User,
  PlanRecord,
  ActualRecord,
  DashboardItem,
  PendingApproval,
  AuditLog,
  CloudSyncState,
  CompanyFilter,
} from '../types';
import { DEPARTMENTS } from '../data/initialData';
import { usePreferences } from '../contexts/AppPreferencesContext';
import { FISCAL_MONTH_LABELS_I18N } from '../i18n/translations';
import {
  AssistantReply,
  HRAssistantContext,
  QuickCategoryKey,
  buildWelcomeMessage,
  processHRAssistantQuery,
  computeMetrics,
  getQuickPromptCategories,
  getDocumentDraftPrompts,
} from '../utils/hrAssistantEngine';

interface HRAssistantViewProps {
  user: User;
  plans: PlanRecord[];
  actuals: ActualRecord[];
  dashboardItems: DashboardItem[];
  approvals: PendingApproval[];
  auditLogs: AuditLog[];
  users: User[];
  selectedFiscalMonth: number | 'ALL';
  selectedYear: number;
  selectedCompany: CompanyFilter;
  onChangeFiscalMonth: (month: number | 'ALL') => void;
  onChangeYear: (year: number) => void;
  onChangeCompany: (company: CompanyFilter) => void;
  onNavigate: (page: string) => void;
  onFocusDepartment: (deptId: string) => void;
  syncState: CloudSyncState;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  reply?: AssistantReply;
  timestamp: string;
}

const renderInlineRichText = (line: string): React.ReactNode[] => {
  // Parse **bold**, *italic*, and `code` tokens cleanly without raw HTML injection
  const tokens = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return tokens.map((tok, idx) => {
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-slate-900 dark:text-white">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    if (tok.startsWith('*') && tok.endsWith('*') && tok.length > 2) {
      return (
        <em key={idx} className="italic text-slate-600 dark:text-slate-300">
          {tok.slice(1, -1)}
        </em>
      );
    }
    if (tok.startsWith('`') && tok.endsWith('`') && tok.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{tok}</React.Fragment>;
  });
};

const RichSummaryBlock: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full mpcs-accent-bg shrink-0" />
              <span className="flex-1">{renderInlineRichText(trimmed.slice(2))}</span>
            </div>
          );
        }
        return <p key={i}>{renderInlineRichText(line)}</p>;
      })}
    </div>
  );
};

export const HRAssistantView: React.FC<HRAssistantViewProps> = ({
  user,
  plans,
  actuals,
  dashboardItems,
  approvals,
  auditLogs,
  users,
  selectedFiscalMonth,
  selectedYear,
  selectedCompany,
  onChangeFiscalMonth,
  onChangeYear,
  onChangeCompany,
  onNavigate,
  onFocusDepartment,
  syncState,
}) => {
  const { language } = usePreferences();
  const isEn = language === 'en';
  const isUserRole = user.role === 'USER';

  const deptDisplayName = useMemo(() => {
    if (!isUserRole) return isEn ? 'All Departments' : 'Seluruh Departemen';
    if (user.deptName && user.deptName !== 'All Departments') return user.deptName;
    return DEPARTMENTS.find((d) => d.id === user.deptId)?.name || user.deptId;
  }, [isUserRole, user.deptName, user.deptId, isEn]);

  const engineContext = useMemo<HRAssistantContext>(
    () => ({
      user,
      plans,
      actuals,
      dashboardItems,
      approvals,
      auditLogs,
      users,
      selectedFiscalMonth,
      selectedYear,
      selectedCompany,
      syncState,
      language,
    }),
    [
      user,
      plans,
      actuals,
      dashboardItems,
      approvals,
      auditLogs,
      users,
      selectedFiscalMonth,
      selectedYear,
      selectedCompany,
      syncState,
      language,
    ]
  );

  const liveMetrics = useMemo(() => computeMetrics(dashboardItems), [dashboardItems]);
  const pendingApprovalCount = useMemo(
    () =>
      approvals.filter((a) => a.status === 'PENDING' && (!isUserRole || a.deptId === user.deptId))
        .length,
    [approvals, isUserRole, user.deptId]
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const welcome = buildWelcomeMessage(engineContext);
    return [
      {
        id: welcome.id,
        role: 'assistant',
        reply: welcome,
        timestamp: welcome.timestamp,
      },
    ];
  });

  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<QuickCategoryKey>('budget');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScopeFilters, setShowScopeFilters] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Refresh the welcome message cleanly if language/period changes and user hasn't asked anything yet
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome-msg') {
        const refreshed = buildWelcomeMessage(engineContext);
        return [
          {
            id: refreshed.id,
            role: 'assistant',
            reply: refreshed,
            timestamp: refreshed.timestamp,
          },
        ];
      }
      return prev;
    });
  }, [engineContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const quickCategories = useMemo(
    () => getQuickPromptCategories(isUserRole, deptDisplayName, language),
    [isUserRole, deptDisplayName, language]
  );

  const draftPrompts = useMemo(
    () => getDocumentDraftPrompts(isUserRole, deptDisplayName, language),
    [isUserRole, deptDisplayName, language]
  );

  const handleSendQuery = (customPrompt?: string) => {
    const text = (customPrompt ?? input).trim();
    if (!text) return;

    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      role: 'user',
      text,
      timestamp: nowTime,
    };

    const reply = processHRAssistantQuery(text, engineContext);
    const assistantMsg: ChatMessage = {
      id: reply.id,
      role: 'assistant',
      reply,
      timestamp: reply.timestamp,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    if (!customPrompt) setInput('');
    inputRef.current?.focus();
  };

  const handleClearChat = () => {
    const welcome = buildWelcomeMessage(engineContext);
    setMessages([
      {
        id: welcome.id,
        role: 'assistant',
        reply: welcome,
        timestamp: welcome.timestamp,
      },
    ]);
  };

  const handleCopyText = async (key: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(key);
      setTimeout(() => setCopiedId((prev) => (prev === key ? null : prev)), 2000);
    } catch {
      // Fallback copy
      const ta = document.createElement('textarea');
      ta.value = content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(key);
      setTimeout(() => setCopiedId((prev) => (prev === key ? null : prev)), 2000);
    }
  };

  const handleDownloadTxt = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportTranscript = () => {
    const lines: string[] = [
      `HR ASSISTANT MPCS — CONVERSATION TRANSCRIPT`,
      `PT Ajinomoto Indonesia – PT Ajinex International (Mojokerto Factory)`,
      `User: ${user.nama} (${user.role} · ${user.deptId})`,
      `Exported: ${new Date().toLocaleString('id-ID')}`,
      `============================================================`,
      '',
    ];

    messages.forEach((m) => {
      if (m.role === 'user') {
        lines.push(`[${m.timestamp}] USER: ${m.text}`);
        lines.push('');
      } else if (m.reply) {
        lines.push(`[${m.timestamp}] HR ASSISTANT — ${m.reply.title}`);
        lines.push(m.reply.summary.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, ''));
        if (m.reply.draftText) {
          lines.push('');
          lines.push(m.reply.draftText);
        }
        if (m.reply.table) {
          lines.push('');
          lines.push(m.reply.table.headers.join(' | '));
          lines.push('-'.repeat(60));
          m.reply.table.rows.forEach((r) => lines.push(r.join(' | ')));
        }
        lines.push('');
        lines.push('------------------------------------------------------------');
        lines.push('');
      }
    });

    handleDownloadTxt(`HR_Assistant_MPCS_Log_${selectedYear}.txt`, lines.join('\n'));
  };

  const getKpiToneClass = (tone?: 'default' | 'success' | 'warning' | 'danger' | 'accent') => {
    switch (tone) {
      case 'success':
        return 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-300';
      case 'warning':
        return 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/70 text-amber-700 dark:text-amber-300';
      case 'danger':
        return 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-300';
      case 'accent':
        return 'mpcs-accent-soft border';
      default:
        return 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100';
    }
  };

  const availableYears = useMemo(() => {
    const yearSet = new Set<number>([selectedYear, new Date().getFullYear(), 2025, 2026]);
    plans.forEach((p) => yearSet.add(Number(p.tahun)));
    actuals.forEach((a) => yearSet.add(Number(a.tahun)));
    return Array.from(yearSet)
      .filter((y) => y >= 2023 && y <= 2032)
      .sort((a, b) => b - a);
  }, [plans, actuals, selectedYear]);

  const tabOrder: QuickCategoryKey[] = ['budget', 'dept', 'trend', 'analytics'];

  return (
    <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* LEFT COLUMN (~68%): Interactive HR Assistant Chat Console */}
      <section className="xl:col-span-8 mpcs-surface border rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[600px] h-[calc(100vh-11.2rem)] max-h-[880px]">
        {/* Chat Console Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-white/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl mpcs-accent-gradient text-white flex items-center justify-center shrink-0 shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                  HR Assistant MPCS
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold mpcs-accent-soft border">
                  <Sparkles className="w-3 h-3" />
                  {isEn ? 'LIVE ENGINE' : 'MESIN LIVE'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                {isEn
                  ? 'Live Data Analysis Engine (12 active MPP modules · zero external AI key required)'
                  : 'Mesin Analisis Data Langsung (12 modul MPP aktif · tanpa kunci server AI)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleExportTranscript}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
              title={isEn ? 'Export Conversation (.txt)' : 'Ekspor Percakapan (.txt)'}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isEn ? 'Export' : 'Ekspor'}</span>
            </button>
            <button
              type="button"
              onClick={handleClearChat}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
              title={isEn ? 'Clear Conversation' : 'Bersihkan Percakapan'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isEn ? 'Clear' : 'Bersihkan'}</span>
            </button>
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-5 scroll-smooth">
          {messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[78%] mpcs-accent-gradient text-white rounded-2xl rounded-tr-xs px-4 py-3 shadow-sm">
                    <p className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </p>
                    <div className="mt-1 text-[10px] text-white/75 text-right font-mono">
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            }

            const reply = msg.reply;
            if (!reply) return null;

            const plainSummaryForCopy = [
              reply.title,
              '',
              reply.summary.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, ''),
              reply.draftText ? `\n${reply.draftText}` : '',
            ].join('\n');

            return (
              <div key={msg.id} className="flex justify-start">
                <div className="w-full max-w-[96%] bg-slate-50/90 dark:bg-slate-900/75 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl rounded-tl-xs p-4 sm:p-5 space-y-4 shadow-2xs">
                  {/* Assistant Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mpcs-accent-soft border">
                          {reply.badge}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400">
                          {reply.timestamp}
                        </span>
                      </div>
                      <h2 className="text-sm sm:text-[15px] font-extrabold text-slate-900 dark:text-white leading-snug">
                        {reply.title}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyText(reply.id, reply.draftText || plainSummaryForCopy)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[var(--mpcs-accent)] hover:text-[var(--mpcs-accent)] transition-all shrink-0 cursor-pointer"
                      title={isEn ? 'Copy response' : 'Salin jawaban'}
                    >
                      {copiedId === reply.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {isEn ? 'Copied' : 'Tersalin'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{isEn ? 'Copy' : 'Salin'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Rich Summary Body */}
                  <RichSummaryBlock text={reply.summary} />

                  {/* Optional KPI Strip */}
                  {reply.kpis && reply.kpis.length > 0 && (
                    <div
                      className={`grid gap-2.5 ${
                        reply.kpis.length === 2
                          ? 'grid-cols-1 sm:grid-cols-2'
                          : reply.kpis.length === 3
                          ? 'grid-cols-1 sm:grid-cols-3'
                          : 'grid-cols-2 sm:grid-cols-4'
                      }`}
                    >
                      {reply.kpis.map((kpi, idx) => (
                        <div
                          key={idx}
                          className={`rounded-xl border px-3 py-2.5 ${getKpiToneClass(kpi.tone)}`}
                        >
                          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 truncate">
                            {kpi.label}
                          </div>
                          <div className="text-sm sm:text-base font-extrabold mt-0.5 tabular-nums">
                            {kpi.value}
                          </div>
                          {kpi.sub && (
                            <div className="text-[10.5px] opacity-80 mt-0.5 truncate">{kpi.sub}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Optional Structured Data Table */}
                  {reply.table && reply.table.rows.length > 0 && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700/90 overflow-hidden bg-white dark:bg-slate-950/60">
                      {reply.table.caption && (
                        <div className="px-3.5 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                          {reply.table.caption}
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="mpcs-table-head">
                              {reply.table.headers.map((h, i) => (
                                <th
                                  key={i}
                                  className="px-3 py-2 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/90">
                            {reply.table.rows.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                              >
                                {row.map((cell, cIdx) => {
                                  const isOver = cell === 'OVER';
                                  const isOptimal = cell === 'OPTIMAL';
                                  const isUnder = cell === 'UNDER';
                                  return (
                                    <td
                                      key={cIdx}
                                      className={`px-3 py-2 whitespace-nowrap ${
                                        cIdx === 0
                                          ? 'font-semibold text-slate-900 dark:text-slate-100'
                                          : 'text-slate-700 dark:text-slate-300 font-mono text-[11.5px]'
                                      }`}
                                    >
                                      {isOver || isOptimal || isUnder ? (
                                        <span
                                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                            isOver
                                              ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                                              : isOptimal
                                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                                              : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                                          }`}
                                        >
                                          {cell}
                                        </span>
                                      ) : (
                                        cell
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Optional Official HR Document Draft Block */}
                  {reply.draftText && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/80 overflow-hidden shadow-2xs">
                      <div className="px-3.5 py-2.5 bg-slate-100/80 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                          <FileText className="w-3.5 h-3.5 mpcs-accent-text" />
                          <span>{isEn ? 'Ready-to-Use HR Document Draft' : 'Draf Dokumen Resmi Siap Pakai'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyText(`${reply.id}-draft`, reply.draftText!)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold mpcs-accent-gradient text-white shadow-2xs cursor-pointer"
                          >
                            {copiedId === `${reply.id}-draft` ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>{isEn ? 'Copied!' : 'Tersalin!'}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>{isEn ? 'Copy Draft' : 'Salin Draf'}</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadTxt(
                                reply.draftFilename || `Draft_HR_MPCS_${selectedYear}.txt`,
                                reply.draftText!
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[var(--mpcs-accent)] transition-all cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>.TXT</span>
                          </button>
                        </div>
                      </div>
                      <pre className="p-4 text-[12.5px] leading-relaxed font-sans text-slate-800 dark:text-slate-200 whitespace-pre-wrap overflow-x-auto">
                        {reply.draftText}
                      </pre>
                    </div>
                  )}

                  {/* Footer Row: Action Shortcut + Follow-up Prompts */}
                  {(reply.actionLink || (reply.followUps && reply.followUps.length > 0)) && (
                    <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center gap-2">
                      {reply.actionLink && (
                        <button
                          type="button"
                          onClick={() => {
                            if (reply.actionLink?.deptId) {
                              onFocusDepartment(reply.actionLink.deptId);
                            }
                            onNavigate(reply.actionLink!.page);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11.5px] font-bold mpcs-accent-gradient text-white shadow-xs transition-all cursor-pointer"
                        >
                          <span>{reply.actionLink.label}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {reply.followUps?.map((fq, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendQuery(fq)}
                          className="px-2.5 py-1.5 rounded-xl text-[11.5px] font-semibold bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[var(--mpcs-accent)] hover:text-[var(--mpcs-accent)] transition-all cursor-pointer"
                        >
                          {fq}
                        </button>
                      ))}
                    </div>
                  )}

                  {reply.id === 'welcome-msg' && (
                    <div className="pt-1 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        {isUserRole
                          ? isEn
                            ? `Ready to help · Strictly isolated to ${deptDisplayName}`
                            : `Siap membantu · Terisolasi khusus ${deptDisplayName}`
                          : isEn
                          ? 'Ready to help · Real-time factory dataset active'
                          : 'Siap membantu · Data real-time pabrik aktif'}
                      </span>
                      <span className="font-mono text-[10px]">MPCS v2 Engine</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Prompt Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery();
          }}
          className="px-4 sm:px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 flex items-center gap-2.5 shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isEn
                ? 'Ask about budget, Over/Under depts, RW vs OS, FY trend, PIC contacts, OS reallocation, or draft an HR memo...'
                : 'Tanya budget, dept Over/Under, rasio RW/OS, tren FY, kontak PIC, simulasi realokasi, atau buat draf memo HR...'
            }
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 text-[13px] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[var(--mpcs-accent)] transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold text-white mpcs-accent-gradient disabled:opacity-45 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>{isEn ? 'Send' : 'Kirim'}</span>
          </button>
        </form>
      </section>

      {/* RIGHT COLUMN (~32%): Live Summary Strip + Quick Prompts + HR Document Draft Generator */}
      <aside className="xl:col-span-4 space-y-4">
        {/* 1. Live Database Context Strip & Optional Scope Selector */}
        <div className="mpcs-surface border rounded-2xl p-3.5 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 leading-snug">
                <strong className="font-bold text-slate-900 dark:text-white">
                  {liveMetrics.totalDepts} {isEn ? 'depts' : 'dept'}
                </strong>{' '}
                · Plan {liveMetrics.totalPlan.toLocaleString('id-ID')} · Actual{' '}
                {liveMetrics.totalActual.toLocaleString('id-ID')} ·{' '}
                <strong className="font-bold mpcs-accent-text">
                  {liveMetrics.complianceRate.toFixed(1)}%
                </strong>{' '}
                · {pendingApprovalCount} approval · {auditLogs.length} log real-time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowScopeFilters((v) => !v)}
              className={`p-1.5 rounded-lg border text-slate-500 dark:text-slate-300 transition-colors cursor-pointer shrink-0 ${
                showScopeFilters
                  ? 'mpcs-accent-soft'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isEn ? 'Change active analysis period / entity' : 'Ubah periode / entitas analisis aktif'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {showScopeFilters && (
            <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" /> {isEn ? 'Month' : 'Bulan'}
                </label>
                <select
                  value={selectedFiscalMonth}
                  onChange={(e) =>
                    onChangeFiscalMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                >
                  <option value="ALL">{isEn ? 'All Months (FY)' : 'Semua Bulan (FY)'}</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((fm) => (
                    <option key={fm} value={fm}>
                      {isEn ? `Month ${fm}` : `Bulan ${fm}`} ({FISCAL_MONTH_LABELS_I18N[language][fm]})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  {isEn ? 'Year' : 'Tahun'}
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => onChangeYear(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              {!isUserRole && (
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                    <Building2 className="w-3 h-3" /> {isEn ? 'Entity Scope' : 'Lingkup Entitas'}
                  </label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => onChangeCompany(e.target.value as CompanyFilter)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    <option value="ALL">
                      {isEn ? 'All Entities (23 Depts)' : 'Semua Perusahaan (23 Dept)'}
                    </option>
                    <option value="PT Ajinomoto Indonesia">PT Ajinomoto Indonesia (18 Dept)</option>
                    <option value="PT Ajinex International">PT Ajinex International (5 Dept)</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Saran Pertanyaan Cepat (2x2 Tabbed Quick Prompts) */}
        <div className="mpcs-surface border rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {isEn ? 'Quick Prompt Suggestions' : 'Saran Pertanyaan Cepat'}
          </h2>

          {/* 2x2 Category Tabs */}
          <div className="grid grid-cols-2 gap-1.5">
            {tabOrder.map((catKey) => {
              const isActive = activeTab === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setActiveTab(catKey)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
                    isActive
                      ? 'mpcs-accent-gradient text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {quickCategories[catKey].label}
                </button>
              );
            })}
          </div>

          {/* Clickable Prompt Cards */}
          <div className="space-y-2 pt-0.5">
            {quickCategories[activeTab].prompts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSendQuery(item.prompt)}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-[var(--mpcs-accent-border)] text-[12.5px] font-medium text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white leading-snug transition-all cursor-pointer shadow-2xs"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Pembuat Draf Dokumen HR (Official Document Draft Generator) */}
        <div className="mpcs-surface border rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 mpcs-accent-text shrink-0" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {isEn ? 'HR Document Draft Generator' : 'Pembuat Draf Dokumen HR'}
            </h2>
          </div>

          <div className="space-y-2">
            {draftPrompts.map((draft) => (
              <button
                key={draft.id}
                type="button"
                onClick={() => handleSendQuery(draft.prompt)}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-[var(--mpcs-accent-border)] transition-all cursor-pointer group shadow-2xs flex items-start justify-between gap-2.5"
              >
                <span className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white leading-snug">
                  {draft.label}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide mpcs-accent-soft border shrink-0 mt-0.5">
                  {draft.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

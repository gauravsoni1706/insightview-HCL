import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Plus,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Database,
  BarChart2,
  Table as TableIcon,
  Clock,
  Download,
  Info,
  Maximize2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Layers,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  getConversations,
  createConversation,
  getMessages,
  sendChatMessage,
} from '../services/api';

const CHART_COLORS = ['#465CF5', '#42B994', '#F4B65E', '#F07882', '#8B5CF6', '#06B6D4', '#EC4899'];

export default function AnalyzeData({ dataset, onOpenUpload }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [activeCanvasTab, setActiveCanvasTab] = useState('chart'); // 'chart', 'table', 'execution'

  const messagesEndRef = useRef(null);

  // Load conversations when dataset changes
  useEffect(() => {
    if (dataset?.id) {
      loadConversations();
    }
  }, [dataset?.id]);

  const loadConversations = async () => {
    try {
      const res = await getConversations(dataset.id);
      setConversations(res.data);
      if (res.data.length > 0) {
        selectConversation(res.data[0].id);
      } else {
        // Start fresh
        handleNewConversation();
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  const selectConversation = async (convoId) => {
    setActiveConvoId(convoId);
    try {
      const res = await getMessages(convoId);
      setMessages(res.data);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const handleNewConversation = async () => {
    if (!dataset?.id) return;
    try {
      const res = await createConversation(dataset.id, 'New Analysis Session');
      setConversations((prev) => [res.data, ...prev]);
      setActiveConvoId(res.data.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create new conversation', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (queryToSend) => {
    const q = (queryToSend || inputQuery).trim();
    if (!q || !dataset?.id) return;

    setInputQuery('');
    setLoading(true);
    setError(null);

    // Optimistically add user message
    const tempUserMsg = {
      id: Date.now(),
      sender: 'user',
      content: q,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await sendChatMessage(dataset.id, activeConvoId, q);
      // Replace with actual messages
      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), res.data.user_message, res.data.ai_message]);
      // Update active convo title if needed
      if (res.data.conversation_id && res.data.conversation_id !== activeConvoId) {
        setActiveConvoId(res.data.conversation_id);
      }
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Find the most recent AI message to display on the primary analysis canvas
  const latestAiMessage = [...messages].reverse().find((m) => m.sender === 'ai');

  // Suggested questions based on active dataset schema
  const getSuggestedQuestions = () => {
    if (!dataset) return [];
    const cols = dataset.column_details || [];
    const numCols = cols.filter((c) => c.type === 'numeric').map((c) => c.name);
    const catCols = cols.filter((c) => c.type === 'categorical').map((c) => c.name);

    const questions = [
      'Generate a complete dataset summary.',
      'Identify missing values across all columns.',
    ];

    if (numCols.length > 0) {
      questions.push(`What is the average ${numCols[0]}?`);
    }
    if (catCols.length > 0 && numCols.length > 0) {
      questions.push(`Which ${catCols[0]} has the highest ${numCols[0]}?`);
      questions.push(`Compare ${numCols[0]} by ${catCols[0]}.`);
    }
    if (numCols.length >= 2) {
      questions.push('Find correlations between numeric columns.');
    }
    if (numCols.length > 0) {
      questions.push(`Detect outliers in ${numCols[0]}.`);
    }

    return questions.slice(0, 5);
  };

  // Render chart based on config
  const renderChart = (chartConfig) => {
    if (!chartConfig || !chartConfig.data || chartConfig.data.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-secondaryText text-[13px]">
          <BarChart2 className="w-10 h-10 mb-2 text-gray-300" />
          <span>No visual chart generated for this operation.</span>
        </div>
      );
    }

    const { type, xAxisKey, yAxisKey, data, title } = chartConfig;

    if (type === 'donut' || type === 'pie') {
      return (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey={yAxisKey}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                innerRadius={type === 'donut' ? 60 : 0}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #EAECF0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  fontSize: '12px',
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (type === 'line') {
      return (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F5" />
              <XAxis dataKey={xAxisKey} stroke="#858B98" fontSize={11} tickLine={false} />
              <YAxis stroke="#858B98" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #EAECF0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey={yAxisKey}
                stroke="#465CF5"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#465CF5' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (type === 'area') {
      return (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F5" />
              <XAxis dataKey={xAxisKey} stroke="#858B98" fontSize={11} tickLine={false} />
              <YAxis stroke="#858B98" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #EAECF0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey={yAxisKey}
                stroke="#465CF5"
                fill="#E9EDFF"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // Default to BarChart
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F5" />
            <XAxis dataKey={xAxisKey} stroke="#858B98" fontSize={11} tickLine={false} />
            <YAxis stroke="#858B98" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #EAECF0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                fontSize: '12px',
              }}
            />
            <Bar dataKey={yAxisKey} fill="#465CF5" radius={[6, 6, 0, 0]} maxBarSize={45} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-105px)] flex flex-col text-left">
      {/* Top Banner / Dataset bar */}
      <div className="bg-white border border-borderGrey rounded-xl p-3 px-4 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-lightBlue text-primaryBlue flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-primaryText flex items-center gap-2">
              <span>{dataset?.original_name || 'No Dataset Selected'}</span>
              <span className="text-[10px] bg-[#ECFDF5] text-successGreen px-2 py-0.5 rounded-full font-semibold">
                Active BI Workspace
              </span>
            </div>
            <div className="text-[11px] text-secondaryText">
              {dataset?.row_count?.toLocaleString()} records • {dataset?.col_count} columns • Quality: {dataset?.data_quality_score}%
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsInspectorOpen(!isInspectorOpen)}
          className="flex items-center gap-1.5 text-[12px] font-medium text-secondaryText hover:text-primaryText px-3 py-1.5 rounded-lg border border-borderGrey hover:bg-background transition-colors"
        >
          <Layers className="w-3.5 h-3.5 text-primaryBlue" />
          <span>{isInspectorOpen ? 'Hide Schema Inspector' : 'Show Schema Inspector'}</span>
        </button>
      </div>

      {/* 3-Section BI Workspace Grid */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        {/* SECTION 1: Conversational Analysis Panel (Left 4 cols) */}
        <div className="col-span-12 md:col-span-4 lg:col-span-4 bg-white border border-borderGrey rounded-card flex flex-col overflow-hidden shadow-subtle">
          {/* Header */}
          <div className="p-3.5 border-b border-borderGrey flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primaryBlue" />
              <span className="text-[13px] font-bold text-primaryText">Conversational Analysis</span>
            </div>
            <button
              onClick={handleNewConversation}
              className="p-1.5 rounded-lg border border-borderGrey hover:bg-background text-secondaryText hover:text-primaryText transition-colors text-[11px] flex items-center gap-1"
              title="New Session"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-full bg-lightBlue text-primaryBlue mx-auto flex items-center justify-center mb-2">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-[13px] font-semibold text-primaryText">Ask InsightFlow Anything</h4>
                <p className="text-[11px] text-secondaryText max-w-xs mx-auto mt-1">
                  Type questions in natural English to query, calculate metrics, and generate dynamic visualizations.
                </p>

                {/* Suggested queries */}
                <div className="mt-4 space-y-1.5 text-left">
                  <div className="text-[10px] font-semibold text-secondaryText uppercase tracking-wider px-1">
                    Suggested Questions:
                  </div>
                  {getSuggestedQuestions().map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      className="w-full text-left p-2 rounded-xl text-[12px] bg-[#F8FAFC] hover:bg-lightBlue/50 border border-borderGrey hover:border-primaryBlue text-primaryText transition-all block"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={msg.id || i}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] p-3 rounded-2xl text-[12px] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-primaryBlue text-white rounded-br-xs'
                        : 'bg-[#F8FAFC] border border-borderGrey text-primaryText rounded-bl-xs'
                    }`}
                  >
                    {msg.content}

                    {msg.sender === 'ai' && msg.execution_time_ms > 0 && (
                      <div className="mt-2 pt-1 border-t border-borderGrey/50 flex items-center gap-1 text-[10px] text-secondaryText">
                        <Clock className="w-3 h-3" />
                        <span>Execution: {msg.execution_time_ms} ms</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-[#F8FAFC] border border-borderGrey rounded-2xl w-fit text-[12px] text-secondaryText">
                <Sparkles className="w-4 h-4 text-primaryBlue animate-spin" />
                <span>InsightFlow is computing exact numbers...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Query Input */}
          <div className="p-3 border-t border-borderGrey bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask e.g. What is the average sales?"
                disabled={loading || !dataset}
                className="flex-1 bg-[#F8FAFC] border border-borderGrey rounded-xl px-3.5 py-2 text-[12px] text-primaryText placeholder-secondaryText focus:outline-none focus:border-primaryBlue"
              />
              <button
                type="submit"
                disabled={loading || !inputQuery.trim() || !dataset}
                className="p-2 rounded-xl bg-primaryBlue hover:bg-blue-600 disabled:opacity-50 text-white transition-all shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* SECTION 2: Center Section: Analysis Canvas */}
        <div
          className={`${
            isInspectorOpen
              ? 'col-span-12 md:col-span-5 lg:col-span-5'
              : 'col-span-12 md:col-span-8 lg:col-span-8'
          } bg-white border border-borderGrey rounded-card p-5 flex flex-col justify-between overflow-y-auto shadow-subtle transition-all`}
        >
          {latestAiMessage ? (
            <div className="space-y-4">
              {/* Canvas header & Navigation tabs */}
              <div className="flex items-center justify-between border-b border-borderGrey pb-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primaryBlue bg-lightBlue px-2 py-0.5 rounded">
                    Analysis Canvas
                  </span>
                  <h3 className="text-[15px] font-bold text-primaryText mt-1">
                    {latestAiMessage.chart_config?.title || 'Execution Findings'}
                  </h3>
                </div>

                <div className="flex items-center gap-1 bg-[#F8FAFC] border border-borderGrey p-0.5 rounded-lg text-[11px]">
                  <button
                    onClick={() => setActiveCanvasTab('chart')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      activeCanvasTab === 'chart'
                        ? 'bg-white shadow-sm text-primaryBlue font-semibold'
                        : 'text-secondaryText hover:text-primaryText'
                    }`}
                  >
                    Visual Chart
                  </button>
                  <button
                    onClick={() => setActiveCanvasTab('table')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      activeCanvasTab === 'table'
                        ? 'bg-white shadow-sm text-primaryBlue font-semibold'
                        : 'text-secondaryText hover:text-primaryText'
                    }`}
                  >
                    Data Table
                  </button>
                  <button
                    onClick={() => setActiveCanvasTab('execution')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      activeCanvasTab === 'execution'
                        ? 'bg-white shadow-sm text-primaryBlue font-semibold'
                        : 'text-secondaryText hover:text-primaryText'
                    }`}
                  >
                    Execution Plan
                  </button>
                </div>
              </div>

              {/* AI Explanation Banner */}
              <div className="p-3.5 bg-[#F8FAFC] border border-borderGrey rounded-xl flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-primaryBlue flex-shrink-0 mt-0.5" />
                <div className="text-[12px] text-primaryText leading-relaxed">
                  {latestAiMessage.content}
                </div>
              </div>

              {/* Key numerical metric pills */}
              {latestAiMessage.numerical_results && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(latestAiMessage.numerical_results).map(([key, val]) => (
                    <div key={key} className="bg-[#F8FAFC] border border-borderGrey p-2.5 rounded-xl text-left">
                      <div className="text-[10px] text-secondaryText uppercase tracking-wider truncate">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[14px] font-bold text-primaryText truncate mt-0.5">
                        {typeof val === 'number' ? val.toLocaleString() : String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* View 1: Chart */}
              {activeCanvasTab === 'chart' && (
                <div className="bg-white border border-borderGrey rounded-xl p-3 pt-4">
                  {renderChart(latestAiMessage.chart_config)}
                </div>
              )}

              {/* View 2: Data Table */}
              {activeCanvasTab === 'table' && (
                <div className="border border-borderGrey rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  {latestAiMessage.table_data?.rows?.length > 0 ? (
                    <table className="w-full text-[12px] text-left">
                      <thead className="bg-[#F8FAFC] border-b border-borderGrey text-secondaryText sticky top-0">
                        <tr>
                          {latestAiMessage.table_data.columns.map((c) => (
                            <th key={c} className="p-2.5 font-semibold">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-borderGrey">
                        {latestAiMessage.table_data.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-background">
                            {latestAiMessage.table_data.columns.map((colName) => (
                              <td key={colName} className="p-2.5 text-primaryText">
                                {String(row[colName] ?? '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6 text-center text-secondaryText text-[12px]">
                      No tabular rows for this query.
                    </div>
                  )}
                </div>
              )}

              {/* View 3: Execution Plan details */}
              {activeCanvasTab === 'execution' && (
                <div className="bg-[#F8FAFC] border border-borderGrey rounded-xl p-3.5 space-y-2 text-[12px]">
                  <div className="flex items-center justify-between text-secondaryText text-[11px]">
                    <span>Execution Engine: Deterministic Pandas Pipeline</span>
                    <span>Time: {latestAiMessage.execution_time_ms} ms</span>
                  </div>
                  <pre className="p-3 bg-white border border-borderGrey rounded-lg text-[11px] font-mono text-primaryText overflow-x-auto">
                    {JSON.stringify(latestAiMessage.execution_plan, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] border border-borderGrey flex items-center justify-center text-primaryBlue mb-3">
                <BarChart2 className="w-7 h-7" />
              </div>
              <h3 className="text-[16px] font-bold text-primaryText">Interactive Analysis Canvas</h3>
              <p className="text-[12px] text-secondaryText max-w-sm mt-1">
                Your calculated charts, metric aggregates, and data tables will dynamically materialize here.
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-borderGrey flex items-center justify-between text-[11px] text-secondaryText">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-successGreen" />
              100% Zero-Hallucination Execution Guarantee
            </span>
            <span>InsightFlow BI v1.0</span>
          </div>
        </div>

        {/* SECTION 3: Right Section: Dataset Inspector (3 cols, collapsible) */}
        {isInspectorOpen && (
          <div className="col-span-12 md:col-span-3 lg:col-span-3 bg-white border border-borderGrey rounded-card p-4 flex flex-col overflow-hidden shadow-subtle text-left">
            <div className="flex items-center justify-between pb-3 border-b border-borderGrey mb-3">
              <div>
                <h4 className="text-[13px] font-bold text-primaryText">Dataset Inspector</h4>
                <div className="text-[11px] text-secondaryText">Schema & Types</div>
              </div>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="p-1 rounded hover:bg-background text-secondaryText"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {dataset ? (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {dataset.column_details?.map((col) => (
                  <div
                    key={col.name}
                    className="p-2.5 bg-[#F8FAFC] border border-borderGrey rounded-xl text-left"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[12px] font-semibold text-primaryText truncate">
                        {col.name}
                      </span>
                      <span
                        className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${
                          col.type === 'numeric'
                            ? 'bg-lightBlue text-primaryBlue'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {col.type}
                      </span>
                    </div>

                    <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px] text-secondaryText">
                      <div>Unique: <span className="text-primaryText font-medium">{col.unique_count}</span></div>
                      <div>Missing: <span className={col.missing_count > 0 ? "text-warningOrange font-bold" : "text-primaryText"}>{col.missing_count}</span></div>
                    </div>

                    {col.type === 'numeric' && col.mean !== undefined && (
                      <div className="mt-1 text-[10px] text-secondaryText border-t border-borderGrey/60 pt-1 flex justify-between">
                        <span>Avg: <b className="text-primaryText">{col.mean}</b></span>
                        <span>Max: <b className="text-primaryText">{col.max}</b></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-secondaryText text-[12px] py-10">
                No active dataset loaded
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

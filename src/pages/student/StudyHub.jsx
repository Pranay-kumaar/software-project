// Student — AI Study Hub (with PDF Upload & Enhanced Features)
import { useState, useRef } from 'react';
import { useToast } from '../../contexts/ToastContext';
import geminiService from '../../services/gemini';
import { extractTextFromPDF, validatePDFFile } from '../../services/pdfExtractor';
import {
  Brain, Sparkles, BookOpen, FileText, Download, RotateCw,
  ChevronLeft, ChevronRight, Upload, X, FileUp, ClipboardList, AlignLeft
} from 'lucide-react';
import jsPDF from 'jspdf';

export default function StudyHub() {
  const { success, error, info } = useToast();
  const fileInputRef = useRef(null);

  const [content, setContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('flashcards');
  const [inputMode, setInputMode] = useState('upload'); // 'upload' or 'paste'

  // PDF state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Results state
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const [quiz, setQuiz] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const [summary, setSummary] = useState('');

  // PDF Upload handlers
  async function handleFileSelect(file) {
    if (!file) return;

    const validation = validatePDFFile(file, 10);
    if (!validation.valid) {
      return error(validation.error);
    }

    setUploadedFile(file);
    setExtracting(true);
    info('Extracting text from PDF...');

    try {
      const text = await extractTextFromPDF(file);
      if (!text || text.trim().length < 20) {
        error('Could not extract enough text from this PDF. It may be scanned or image-based.');
        setUploadedFile(null);
        return;
      }
      setContent(text);
      success(`Extracted ${text.length.toLocaleString()} characters from "${file.name}"`);
    } catch (err) {
      error(err.message || 'Failed to extract text from PDF.');
      setUploadedFile(null);
    } finally {
      setExtracting(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleFileInputChange(e) {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  }

  function clearFile() {
    setUploadedFile(null);
    setContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleGenerate() {
    if (!content.trim()) {
      return error('Please upload a PDF or paste study content first.');
    }
    if (content.trim().length < 30) {
      return error('Content is too short. Please provide more study material.');
    }

    setGenerating(true);
    info(`Generating ${activeTab}...`);
    try {
      if (activeTab === 'flashcards') {
        const cards = await geminiService.generateFlashcards(content, 15);
        setFlashcards(cards);
        setCurrentCard(0);
        setFlipped(false);
        success(`Generated ${cards.length} flashcards!`);
      } else if (activeTab === 'quiz') {
        const questions = await geminiService.generateQuestions(content, 'mcq', 10);
        setQuiz(questions);
        setQuizAnswers({});
        setShowQuizResults(false);
        success(`Generated ${questions.length} quiz questions!`);
      } else if (activeTab === 'summary') {
        const summaryText = await geminiService.generateSummary(content);
        setSummary(summaryText);
        success('Summary generated!');
      }
    } catch (err) {
      console.error('[StudyHub] Generation error:', err);
      error(err.message || 'Generation failed. Please check your API keys.');
    } finally {
      setGenerating(false);
    }
  }

  function exportPDF() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    doc.setFontSize(18);
    doc.setTextColor(99, 102, 241);
    doc.text('ExamineAI — Study Materials', margin, 22);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, 30);

    let y = 40;

    function addPageCheck(needed = 20) {
      if (y + needed > 275) {
        doc.addPage();
        y = 20;
      }
    }

    if (activeTab === 'flashcards' && flashcards.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241);
      doc.text('Flashcards', margin, y);
      doc.setTextColor(0, 0, 0);
      y += 10;

      flashcards.forEach((card, i) => {
        addPageCheck(25);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        const qLines = doc.splitTextToSize(`${i + 1}. ${card.front}`, maxWidth);
        doc.text(qLines, margin, y);
        y += qLines.length * 5 + 2;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(80, 80, 80);
        const aLines = doc.splitTextToSize(`   → ${card.back}`, maxWidth - 5);
        doc.text(aLines, margin, y);
        doc.setTextColor(0, 0, 0);
        y += aLines.length * 5 + 8;
      });
    } else if (activeTab === 'quiz' && quiz.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241);
      doc.text('Practice Quiz', margin, y);
      doc.setTextColor(0, 0, 0);
      y += 10;

      quiz.forEach((q, i) => {
        addPageCheck(35);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        const qLines = doc.splitTextToSize(`${i + 1}. ${q.question}`, maxWidth);
        doc.text(qLines, margin, y);
        y += qLines.length * 5 + 3;

        doc.setFont(undefined, 'normal');
        q.options?.forEach((opt, oi) => {
          addPageCheck(8);
          const prefix = showQuizResults && oi === q.correct ? '✓ ' : '  ';
          doc.text(`${prefix}${String.fromCharCode(65 + oi)}. ${opt}`, margin + 5, y);
          y += 6;
        });

        if (showQuizResults && q.explanation) {
          addPageCheck(10);
          doc.setTextColor(80, 80, 80);
          const expLines = doc.splitTextToSize(`Explanation: ${q.explanation}`, maxWidth - 10);
          doc.text(expLines, margin + 5, y);
          doc.setTextColor(0, 0, 0);
          y += expLines.length * 5 + 4;
        }
        y += 6;
      });

      if (showQuizResults) {
        addPageCheck(20);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Score: ${quizScore}/${quiz.length}`, margin, y);
        y += 10;
      }
    } else if (activeTab === 'summary' && summary) {
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241);
      doc.text('Study Summary', margin, y);
      doc.setTextColor(0, 0, 0);
      y += 10;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      // Parse summary with basic markdown support
      const lines = summary.split('\n');
      lines.forEach(line => {
        addPageCheck(8);
        if (line.startsWith('## ')) {
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(99, 102, 241);
          doc.text(line.replace('## ', ''), margin, y);
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          y += 8;
        } else if (line.startsWith('- ') || line.startsWith('• ')) {
          const textLines = doc.splitTextToSize(`• ${line.replace(/^[-•]\s*/, '')}`, maxWidth - 10);
          doc.text(textLines, margin + 5, y);
          y += textLines.length * 5 + 2;
        } else if (line.trim()) {
          // Handle **bold** markers
          const cleanLine = line.replace(/\*\*/g, '');
          const textLines = doc.splitTextToSize(cleanLine, maxWidth);
          doc.text(textLines, margin, y);
          y += textLines.length * 5 + 2;
        } else {
          y += 4;
        }
      });
    }

    doc.save('study-materials.pdf');
    success('PDF downloaded!');
  }

  const quizScore = showQuizResults
    ? quiz.filter((q, i) => quizAnswers[i] === q.correct).length
    : 0;

  const hasResults = flashcards.length > 0 || quiz.length > 0 || summary;
  const currentTabHasResults =
    (activeTab === 'flashcards' && flashcards.length > 0) ||
    (activeTab === 'quiz' && quiz.length > 0) ||
    (activeTab === 'summary' && summary);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>AI Study Hub</h1>
        <p>Upload a PDF or paste content — let AI create study materials for you</p>
      </div>

      {/* Content Input */}
      <div className="glass-card" style={{ marginBottom: '1.25rem', borderColor: 'var(--border-accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Brain size={18} style={{ color: 'var(--accent-violet)' }} />
          <h3 style={{ fontSize: '1rem' }}>Study Content</h3>
          <span className="badge badge-indigo">Gemini AI</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              className={`btn btn-sm ${inputMode === 'upload' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setInputMode('upload')}
            >
              <Upload size={14} /> Upload PDF
            </button>
            <button
              className={`btn btn-sm ${inputMode === 'paste' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setInputMode('paste')}
            >
              <ClipboardList size={14} /> Paste Text
            </button>
          </div>
        </div>

        {inputMode === 'upload' ? (
          <div>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />

            {uploadedFile ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '1rem 1.25rem', background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-md)'
              }}>
                <FileText size={20} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {uploadedFile.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {(uploadedFile.size / 1024).toFixed(1)} KB · {content.length.toLocaleString()} characters extracted
                  </div>
                </div>
                {extracting ? (
                  <RotateCw size={16} className="spin" style={{ color: 'var(--accent-indigo)' }} />
                ) : (
                  <button className="btn btn-icon btn-ghost" onClick={clearFile} title="Remove file">
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '2.5rem 2rem',
                  border: `2px dashed ${dragOver ? 'var(--accent-indigo)' : 'var(--border-secondary)'}`,
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: dragOver ? 'rgba(99,102,241,0.05)' : 'transparent',
                }}
              >
                <FileUp size={36} style={{ color: dragOver ? 'var(--accent-indigo)' : 'var(--text-muted)', marginBottom: '0.75rem', opacity: dragOver ? 1 : 0.5 }} />
                <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                  {dragOver ? 'Drop your PDF here' : 'Click to upload or drag & drop'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  PDF files up to 10MB supported
                </div>
              </div>
            )}

            {/* Show extracted text preview */}
            {content && uploadedFile && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Extracted text preview:</div>
                <textarea
                  className="input"
                  rows={3}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  style={{ fontSize: '0.8125rem', opacity: 0.8 }}
                />
              </div>
            )}
          </div>
        ) : (
          <textarea
            className="input"
            rows={6}
            placeholder="Paste your lecture notes, textbook content, or any study material here..."
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        )}
      </div>

      {/* Tabs & Generate */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          className={`btn ${activeTab === 'flashcards' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('flashcards')}
        >
          <BookOpen size={16} /> Flashcards
        </button>
        <button
          className={`btn ${activeTab === 'quiz' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('quiz')}
        >
          <Sparkles size={16} /> Practice Quiz
        </button>
        <button
          className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('summary')}
        >
          <AlignLeft size={16} /> Summary
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating || extracting}>
          {generating ? <><RotateCw size={16} className="spin" /> Generating...</> : <><Brain size={16} /> Generate</>}
        </button>
        {currentTabHasResults && (
          <button className="btn btn-secondary" onClick={exportPDF}>
            <Download size={16} /> Export PDF
          </button>
        )}
      </div>

      {/* Flashcards View */}
      {activeTab === 'flashcards' && flashcards.length > 0 && (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div
            className="glass-card"
            onClick={() => setFlipped(!flipped)}
            style={{
              minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s', padding: '2rem',
              borderColor: flipped ? 'var(--border-accent)' : 'var(--border-primary)'
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {flipped ? 'Answer' : 'Question'} — Card {currentCard + 1}/{flashcards.length}
            </div>
            <div style={{ fontSize: flipped ? '1rem' : '1.125rem', fontWeight: flipped ? 400 : 500, color: flipped ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: 1.6 }}>
              {flipped ? flashcards[currentCard].back : flashcards[currentCard].front}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>Click to flip</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn btn-secondary" disabled={currentCard === 0} onClick={() => { setCurrentCard(prev => prev - 1); setFlipped(false); }}>
              <ChevronLeft size={16} /> Prev
            </button>
            <button className="btn btn-secondary" disabled={currentCard === flashcards.length - 1} onClick={() => { setCurrentCard(prev => prev + 1); setFlipped(false); }}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Quiz View */}
      {activeTab === 'quiz' && quiz.length > 0 && (
        <div style={{ maxWidth: 700 }}>
          {showQuizResults && (
            <div className="glass-card" style={{ marginBottom: '1.25rem', textAlign: 'center', borderColor: 'var(--border-accent)', padding: '1.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-indigo-light)' }}>{quizScore}/{quiz.length}</div>
              <p style={{ color: 'var(--text-muted)' }}>Correct Answers</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {quiz.map((q, qi) => (
              <div key={qi} className="glass-card">
                <div style={{ fontWeight: 500, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                  {qi + 1}. {q.question}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {q.options?.map((opt, oi) => {
                    let optStyle = {};
                    if (showQuizResults) {
                      if (oi === q.correct) optStyle = { background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' };
                      else if (quizAnswers[qi] === oi && oi !== q.correct) optStyle = { background: 'rgba(244,63,94,0.1)', borderColor: 'rgba(244,63,94,0.3)' };
                    }
                    return (
                      <label key={oi} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${quizAnswers[qi] === oi && !showQuizResults ? 'var(--accent-indigo)' : 'var(--border-primary)'}`,
                        cursor: showQuizResults ? 'default' : 'pointer',
                        transition: 'all 0.15s', fontSize: '0.875rem',
                        ...optStyle
                      }}>
                        <input type="radio" name={`quiz-${qi}`} checked={quizAnswers[qi] === oi} onChange={() => !showQuizResults && setQuizAnswers(prev => ({ ...prev, [qi]: oi }))} disabled={showQuizResults} style={{ accentColor: 'var(--accent-indigo)' }} />
                        {opt}
                      </label>
                    );
                  })}
                </div>
                {showQuizResults && q.explanation && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    💡 {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
          {!showQuizResults && (
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowQuizResults(true)}>
              Check Answers
            </button>
          )}
        </div>
      )}

      {/* Summary View */}
      {activeTab === 'summary' && summary && (
        <div className="glass-card" style={{ maxWidth: 800 }}>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9375rem', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
            {summary.split('\n').map((line, i) => {
              if (line.startsWith('## ')) {
                return <h3 key={i} style={{ fontSize: '1.1rem', color: 'var(--accent-indigo-light)', margin: '1.25rem 0 0.5rem' }}>{line.replace('## ', '')}</h3>;
              }
              if (line.startsWith('- ') || line.startsWith('• ')) {
                return <div key={i} style={{ paddingLeft: '1rem', marginBottom: '0.25rem' }}>• {line.replace(/^[-•]\s*/, '')}</div>;
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return <div key={i} style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0.5rem 0' }}>{line.replace(/\*\*/g, '')}</div>;
              }
              if (!line.trim()) return <br key={i} />;
              // Handle inline **bold**
              const parts = line.split(/(\*\*[^*]+\*\*)/g);
              return (
                <div key={i} style={{ marginBottom: '0.25rem' }}>
                  {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={j} style={{ color: 'var(--text-primary)' }}>{part.replace(/\*\*/g, '')}</strong>;
                    }
                    return part;
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!currentTabHasResults && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Sparkles size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            {inputMode === 'upload'
              ? `Upload a PDF above and click Generate to create ${activeTab}.`
              : `Paste content above and click Generate to create ${activeTab}.`
            }
          </p>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

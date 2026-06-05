
import React, { useState } from 'react';
import { generateBookStory, generateIllustration } from '../services/geminiService';
import { Book, StoryGenre, AgeGroup, Language, LanguageTone, BookFont, PaperStyle, BookPage, ImagePosition, PaperSize } from '../types';
import LoadingSpinner from './LoadingSpinner';
import BookViewer from './BookViewer';

const WimpyDiaryModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState<StoryGenre>(StoryGenre.JOURNAL);
  const [pageCount, setPageCount] = useState(10);
  const [level, setLevel] = useState(4);
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [tone, setTone] = useState<LanguageTone>(LanguageTone.SPOKEN);
  const [paperSize, setPaperSize] = useState<PaperSize>(PaperSize.A4);
  const [selectedFont, setSelectedFont] = useState<BookFont>(BookFont.HANDWRITTEN);
  const [selectedPaperStyle, setSelectedPaperStyle] = useState<PaperStyle>(PaperStyle.LINED);
  const [fontSize, setFontSize] = useState(20);
  const [layoutMode, setLayoutMode] = useState<ImagePosition>(ImagePosition.TOP);
  const [hasTOC, setHasTOC] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState('');
  const [book, setBook] = useState<Book | null>(null);

  const slowProgressUpdate = async (start: number, end: number, message: string) => {
    setMsg(message);
    for (let i = start; i <= end; i++) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };

  const generateDiary = async () => {
    if (!topic || !title) return alert("Please provide a title and a topic!");
    setLoading(true);
    await slowProgressUpdate(0, 15, 'Meditating on Diary Storylines...');

    try {
      const story = await generateBookStory(
        `Diary: ${title}. Topic: ${topic}`, 
        genre, 
        AgeGroup.MIDDLE_GRADE, 
        level,
        "A character-driven personal diary", 
        "Dynamic settings", 
        pageCount, 
        80,
        language, 
        tone
      );

      await slowProgressUpdate(15, 30, 'Formatting Pages for Continuous Scroll...');

      // Fix: Added missing 'pageSpacingMode' property required by 'Book' type
      const newBook: Book = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        title: title, 
        author: 'Diary Chronicler',
        genre: genre, ageGroup: AgeGroup.MIDDLE_GRADE, level: level,
        language: language, languageTone: tone,
        pages: [], font: selectedFont, paperStyle: selectedPaperStyle,
        paperSize: paperSize, lineSpacing: 2, fontSize: fontSize,
        hasVoiceover: false, highlightText: false, hasTableOfContents: hasTOC,
        tocStyle: 'playful',
        pageSpacingMode: 'fit'
      };

      const pages: BookPage[] = [];
      const layouts: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];
      const startProg = 30;
      const endProg = 99;

      for (let i = 0; i < story.pages.length; i++) {
        const pageMsg = `Sketching page ${i + 1} of ${story.pages.length}...`;
        const stepSize = (endProg - startProg) / story.pages.length;
        const currentEnd = startProg + (stepSize * (i + 1));
        
        await slowProgressUpdate(Math.floor(startProg + stepSize * i), Math.floor(currentEnd), pageMsg);
        
        let imageUrl = "";
        if (i < 20) { // Sketch only significant pages for performance
          try {
             imageUrl = await generateIllustration(`Charcoal sketch: ${story.pages[i].imagePrompt}`);
          } catch (e) { console.warn("Sketch failed"); }
        }
        
        pages.push({
          ...story.pages[i],
          imageUrl: imageUrl || undefined,
          layout: layoutMode === ImagePosition.RANDOM ? layouts[Math.floor(Math.random() * layouts.length)] : layoutMode as any
        });
      }

      setBook({ ...newBook, pages });
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner progress={Math.round(progress)} message={msg} />;

  return (
    <div className="min-h-screen bg-slate-50">
      {book ? (
        <BookViewer book={book} onUpdate={setBook} onReset={() => setBook(null)} />
      ) : (
        <div className="max-w-6xl mx-auto p-6 lg:p-12 space-y-8">
          <button onClick={onBack} className="text-slate-400 hover:text-orange-600 font-bold transition-all flex items-center gap-2 no-print">
            <i className="fa-solid fa-arrow-left"></i> BACK TO HUB
          </button>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-6 no-print">
              <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-200">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Diary Config</h3>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Language</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm">
                      {Object.values(Language).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Paper Style</label>
                    <select value={selectedPaperStyle} onChange={(e) => setSelectedPaperStyle(e.target.value as PaperStyle)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm">
                      {Object.values(PaperStyle).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Image Layout</label>
                    <select value={layoutMode} onChange={(e) => setLayoutMode(e.target.value as ImagePosition)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm">
                      {Object.values(ImagePosition).map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 flex justify-between">
                      <span>Story Length</span>
                      <span className="text-orange-600 font-black">{pageCount} Pages</span>
                    </label>
                    <input type="range" min="10" max="300" step="5" value={pageCount} onChange={(e) => setPageCount(parseInt(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg accent-orange-600" />
                  </div>
                  
                  <div className="flex items-center gap-3 py-3 border-y border-slate-50">
                    <input type="checkbox" checked={hasTOC} onChange={(e) => setHasTOC(e.target.checked)} className="w-5 h-5 accent-orange-500" id="diary_toc" />
                    <label htmlFor="diary_toc" className="text-[10px] font-black uppercase text-slate-700 cursor-pointer">Include Index (TOC)</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border-2 border-slate-200 relative overflow-hidden">
                <div className="mb-10">
                  <h1 className="text-4xl font-playfair font-black text-slate-800 mb-2 italic tracking-tight uppercase">Diary Studio</h1>
                  <p className="text-slate-500 font-medium">Continuous scroll, charcoal sketches, and high-capacity journaling.</p>
                </div>
                
                <div className="space-y-6">
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Diary Title..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-xl outline-none focus:border-orange-500 transition-all" />
                  <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Describe character journey..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 min-h-[220px] outline-none text-lg font-medium" />
                  <button onClick={generateDiary} className="w-full py-6 bg-orange-500 text-white rounded-2xl font-black text-2xl hover:bg-orange-600 transition-all shadow-xl italic uppercase tracking-tighter">PUBLISH TO CONTINUOUS SCROLL</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WimpyDiaryModule;

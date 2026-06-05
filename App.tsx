
import React, { useState } from 'react';
import { AppMode, StoryGenre, Language, Book, BookPage, BookFont, PaperStyle, PaperSize, ImagePosition, AgeGroup, LanguageTone } from './types';
import { generateBookStory, generateIllustration } from './services/geminiService';
import LoadingSpinner from './components/LoadingSpinner';
import BookViewer from './components/BookViewer';
import ColoringModule from './components/ColoringModule';
import WimpyDiaryModule from './components/WimpyDiaryModule';
import HiddenObjectModule from './components/HiddenObjectModule';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  
  const [formData, setFormData] = useState({
    titleHint: '',
    genre: StoryGenre.KIDS_STORY,
    ageGroup: AgeGroup.PICTURE_BOOK,
    level: 1, 
    characters: '',
    setting: '',
    pageCount: 10,
    wordsPerPage: 150,
    language: Language.ENGLISH,
    languageTone: LanguageTone.WRITTEN,
    font: BookFont.SERIF,
    paperStyle: PaperStyle.PLAIN,
    paperSize: PaperSize.A4,
    lineSpacing: 1.8,
    fontSize: 18,
    imagePos: ImagePosition.NONE,
    hasVoiceover: false,
    highlightText: false,
    hasTableOfContents: true,
    vocabularyEnabled: true,
    pageSpacingMode: 'fit' as 'fixed' | 'fit'
  });

  const [avatarImages, setAvatarImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generatedBook, setGeneratedBook] = useState<Book | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               (name === 'level' || name === 'pageCount' || name === 'wordsPerPage' || name === 'lineSpacing' || name === 'fontSize') ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const smoothProgress = async (target: number, duration: number = 800) => {
    const start = loadingProgress;
    const startTime = Date.now();
    
    return new Promise<void>((resolve) => {
      const step = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (target - start) * progress);
        setLoadingProgress(current);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  };

  const generateBook = async (options: { isLow?: boolean, isTextOnly?: boolean } = {}) => {
    if (!formData.titleHint) return alert("Please describe your book vision!");
    setLoading(true);
    setLoadingProgress(0);
    setLoadingMessage('Initializing DPSS Engine...');

    const creep = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev < 98) return prev + 0.1;
        return prev;
      });
    }, 200);

    try {
      await smoothProgress(15, 1000);
      setLoadingMessage(`Generating Narrative (Level ${formData.level})...`);

      const CHUNK_SIZE = 10;
      let allPages: any[] = [];
      let finalTitle = formData.titleHint;
      const totalPagesToGen = formData.pageCount;
      const totalChunks = Math.ceil(totalPagesToGen / CHUNK_SIZE);

      for (let i = 0; i < totalChunks; i++) {
        const pagesInThisChunk = Math.min(CHUNK_SIZE, totalPagesToGen - allPages.length);
        const startPage = allPages.length + 1;
        
        setLoadingMessage(`Drafting Manuscript Chunk ${i + 1}/${totalChunks}...`);
        await smoothProgress(15 + ((i + 1) / totalChunks) * 25, 1500);

        const chunkResponse = await generateBookStory(
          formData.titleHint, formData.genre, formData.ageGroup, formData.level,
          formData.characters, formData.setting, pagesInThisChunk, formData.wordsPerPage,
          formData.language, formData.languageTone, [], avatarImages, formData.vocabularyEnabled,
          startPage
        );
        
        if (i === 0) finalTitle = chunkResponse.title;
        allPages = [...allPages, ...chunkResponse.pages];
        if (chunkResponse.pages.length === 0) break;
      }

      await smoothProgress(45, 1000);

      const initialPages: BookPage[] = allPages.map((p) => ({
        ...p,
        layout: options.isTextOnly ? 'none' : (formData.imagePos === ImagePosition.RANDOM ? ['left', 'right', 'top', 'bottom'][Math.floor(Math.random() * 4)] as any : formData.imagePos as any)
      }));

      const newBook: Book = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        title: finalTitle, 
        author: 'DPSS AI Studio',
        genre: formData.genre, ageGroup: formData.ageGroup, level: formData.level,
        language: formData.language, languageTone: formData.languageTone,
        pages: initialPages, font: formData.font, paperStyle: formData.paperStyle,
        paperSize: formData.paperSize,
        lineSpacing: formData.lineSpacing, fontSize: formData.fontSize, hasVoiceover: false,
        highlightText: formData.highlightText, heroAvatars: avatarImages,
        hasTableOfContents: formData.hasTableOfContents,
        tocStyle: 'classic',
        isLowIllustration: options.isLow,
        isTextOnly: options.isTextOnly,
        vocabularyEnabled: formData.vocabularyEnabled,
        pageSpacingMode: formData.pageSpacingMode
      };

      if (!options.isTextOnly) {
        setLoadingMessage('Illustrating Master Cover...');
        await smoothProgress(60, 1500);
        const coverUrl = await generateIllustration(`Professional book cover: ${finalTitle}. Cinematic style.`, avatarImages);
        newBook.coverImageUrl = coverUrl;

        const updatedPages = [...initialPages];
        const startProg = 60;
        const endProg = 99;
        
        for (let i = 0; i < updatedPages.length; i++) {
          const stepSize = (endProg - startProg) / updatedPages.length;
          setLoadingMessage(`Rendering Illustration ${i + 1} of ${updatedPages.length}...`);
          
          if (!options.isLow || i === 0) {
            try {
              if (i < 50) {
                const imageUrl = await generateIllustration(updatedPages[i].imagePrompt, avatarImages);
                updatedPages[i].imageUrl = imageUrl;
              }
            } catch (e) { console.warn("Illustration failed", i); }
          }
          setLoadingProgress(Math.floor(startProg + stepSize * (i + 1)));
        }
        newBook.pages = updatedPages;
      } else {
        setLoadingMessage('Finalizing Academic Format...');
        await smoothProgress(99, 2000);
      }

      clearInterval(creep);
      setGeneratedBook(newBook);
      setLoading(false);
    } catch (error: any) {
      clearInterval(creep);
      console.error(error);
      alert("DPSS Engine Error: " + error.message);
      setLoading(false);
    }
  };

  const renderDashboard = () => (
    <div className="min-h-screen bg-[#f8fafc] p-12 lg:p-24 overflow-x-hidden relative">
      <div className="max-w-7xl mx-auto space-y-20">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-1 bg-orange-600 rounded-full"></div>
             <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">Premium AI Multi-Lab Hub</p>
          </div>
          <h1 className="text-7xl font-playfair font-black text-slate-900 tracking-tighter uppercase italic leading-[0.9]">DPSS STUDIO</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <button onClick={() => setMode(AppMode.BOOK_CREATOR)} className="bg-white rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all p-10 text-left space-y-6 group border border-slate-100">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg"><i className="fa-solid fa-book-open"></i></div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Book Studio</h3>
              <p className="text-slate-500 text-sm font-medium">Cinematic illustrations and high page support.</p>
            </div>
          </button>

          <button onClick={() => setMode(AppMode.PROFESSIONAL_STUDIO)} className="bg-white rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all p-10 text-left space-y-6 group border border-slate-100">
            <div className="w-16 h-16 bg-emerald-700 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg"><i className="fa-solid fa-feather-pointed"></i></div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Professional</h3>
              <p className="text-slate-500 text-sm font-medium">Text-only. Buddhism, Dharma, Personal Dev.</p>
            </div>
          </button>

          <button onClick={() => setMode(AppMode.WIMPY_DIARY)} className="bg-white rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all p-10 text-left space-y-6 group border border-slate-100">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg"><i className="fa-solid fa-pencil"></i></div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Diary Studio</h3>
              <p className="text-slate-500 text-sm font-medium">Sketch-art diaries with Winnie style.</p>
            </div>
          </button>

          <button onClick={() => setMode(AppMode.COLORING_LAB)} className="bg-white rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all p-10 text-left space-y-6 group border border-slate-100">
            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg"><i className="fa-solid fa-palette"></i></div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Coloring Lab</h3>
              <p className="text-slate-500 text-sm font-medium">Tracing sheets and custom B&W art.</p>
            </div>
          </button>

          <button onClick={() => setMode(AppMode.HIDDEN_OBJECTS)} className="bg-white rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all p-10 text-left space-y-6 group border border-slate-100">
            <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg"><i className="fa-solid fa-magnifying-glass"></i></div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Hidden Objects</h3>
              <p className="text-slate-500 text-sm font-medium">Spot the item games in B&W or Color.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderStudioSidebar = (opts: { isLow?: boolean, isTextOnly?: boolean } = {}) => (
    <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-200 space-y-5 no-print overflow-visible">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Studio Config</h3>
      
      <div className="space-y-1">
        <label className="text-[11px] font-black text-slate-500 uppercase block">Language</label>
        <select name="language" value={formData.language} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-orange-500">
          {Object.values(Language).map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-black text-slate-500 uppercase block">Book Genre</label>
        <select name="genre" value={formData.genre} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-orange-500">
          {Object.values(StoryGenre).map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-black text-slate-500 uppercase block flex justify-between">
          <span>Level Calibration</span>
          <span className="text-orange-600 font-black">Lvl {formData.level}</span>
        </label>
        <select name="level" value={formData.level} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-orange-500">
          {[1,2,3,4,5,6,7,8,9,10].map(lv => (
            <option key={lv} value={lv}>
              Level {lv} {lv === 1 ? '(Strictly Easy)' : lv === 10 ? '(Strictly Master)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-black text-slate-500 uppercase block">Paper Style</label>
        <select name="paperStyle" value={formData.paperStyle} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-orange-500">
          {Object.values(PaperStyle).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-black text-slate-500 uppercase block">Page Height Mode</label>
        <select name="pageSpacingMode" value={formData.pageSpacingMode} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-orange-500">
          <option value="fit">Fit Content (No Space Below)</option>
          <option value="fixed">Fixed A4 (Lot of Space Below)</option>
        </select>
      </div>

      <div className="flex items-center gap-3 py-3 border-y border-slate-50">
        <input type="checkbox" name="vocabularyEnabled" checked={formData.vocabularyEnabled} onChange={handleInputChange} className="w-5 h-5 accent-orange-500 cursor-pointer" id="vocab_check" />
        <label htmlFor="vocab_check" className="text-[10px] font-black uppercase text-slate-700 cursor-pointer select-none">Explain Difficult Words</label>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-black text-slate-500 uppercase block">Book Font</label>
        <select name="font" value={formData.font} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-orange-500">
          {Object.values(BookFont).map(f => <option key={f} value={f}>{f.replace('font-', '').toUpperCase()}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-3 py-3 border-y border-slate-50">
        <input type="checkbox" name="hasTableOfContents" checked={formData.hasTableOfContents} onChange={handleInputChange} className="w-5 h-5 accent-orange-500 cursor-pointer" id="toc_check" />
        <label htmlFor="toc_check" className="text-[10px] font-black uppercase text-slate-700 cursor-pointer select-none">Include Index (TOC)</label>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-black text-slate-500 uppercase block flex justify-between">
          <span>Book Length</span>
          <span className="text-orange-600 font-black">{formData.pageCount} Pages</span>
        </label>
        <input type="range" name="pageCount" min="1" max="300" step="10" value={formData.pageCount} onChange={handleInputChange} className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none" />
      </div>

      <button onClick={() => generateBook(opts)} className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black text-xl hover:bg-orange-600 transition-all uppercase tracking-tighter italic shadow-lg active:scale-95">CREATE BOOK</button>
    </div>
  );

  if (loading) return <LoadingSpinner progress={Math.floor(loadingProgress)} message={loadingMessage} />;

  if (generatedBook) return <BookViewer book={generatedBook} onUpdate={setGeneratedBook} onReset={() => setGeneratedBook(null)} />;

  switch (mode) {
    case AppMode.BOOK_CREATOR:
    case AppMode.LOW_PICTURE_BOOK:
    case AppMode.PROFESSIONAL_STUDIO:
      const isTextOnly = mode === AppMode.PROFESSIONAL_STUDIO;
      return (
        <div className="min-h-screen bg-slate-100/50 p-6 lg:p-12">
          <button onClick={() => setMode(AppMode.DASHBOARD)} className="text-slate-400 hover:text-orange-600 font-bold mb-8 block transition-all group">
            <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Hub
          </button>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">{renderStudioSidebar({ isLow: mode === AppMode.LOW_PICTURE_BOOK, isTextOnly })}</div>
            <div className="lg:col-span-8">
              <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-6 border border-slate-100">
                <h1 className="text-4xl font-playfair font-black text-slate-800 italic uppercase tracking-tighter">
                  {isTextOnly ? 'Professional Studio' : 'Studio Creator'}
                </h1>
                <input name="titleHint" value={formData.titleHint} onChange={handleInputChange} placeholder="Enter your book title..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-xl outline-none focus:border-orange-400 transition-all placeholder:text-slate-300" />
                <textarea name="characters" value={formData.characters} onChange={handleInputChange} placeholder={isTextOnly ? "Explain the philosophical message or spiritual teachings..." : "Describe the adventure, characters, and the level-specific complexity you want..."} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 min-h-[400px] outline-none focus:border-orange-400 transition-all font-medium text-lg leading-relaxed custom-scrollbar" />
              </div>
            </div>
          </div>
        </div>
      );
    case AppMode.COLORING_LAB: return <ColoringModule onBack={() => setMode(AppMode.DASHBOARD)} />;
    case AppMode.HIDDEN_OBJECTS: return <HiddenObjectModule onBack={() => setMode(AppMode.DASHBOARD)} />;
    case AppMode.WIMPY_DIARY: return <WimpyDiaryModule onBack={() => setMode(AppMode.DASHBOARD)} />;
    default: return renderDashboard();
  }
};

export default App;

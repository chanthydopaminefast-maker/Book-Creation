
import React, { useState, useRef } from 'react';
import { Book, BookPage, PaperStyle, PaperSize, BookFont } from '../types';

interface BookViewerProps {
  book: Book;
  onUpdate: (updatedBook: Book) => void;
  onReset: () => void;
}

const BookViewer: React.FC<BookViewerProps> = ({ book, onUpdate, onReset }) => {
  const [isEditing, setIsEditing] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const scrollToPage = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const updateBookConfig = (key: keyof Book, val: any) => {
    onUpdate({ ...book, [key]: val });
  };

  const handleTextChange = (pageIdx: number, newText: string) => {
    const updatedPages = [...book.pages];
    updatedPages[pageIdx].text = newText;
    onUpdate({ ...book, pages: updatedPages });
  };

  const exportToWord = () => {
    const content = `
      <html>
        <head><meta charset='utf-8'></head>
        <body>
          <h1>${book.title}</h1>
          <h3>By ${book.author}</h3>
          ${book.pages.map(p => `<div><h2>${p.title || ''}</h2><p>${p.text}</p></div>`).join('')}
        </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${book.title}.doc`;
    link.click();
  };

  const getPageClasses = (layout: string) => {
    switch (layout) {
      case 'top': return 'flex-col';
      case 'bottom': return 'flex-col-reverse';
      case 'left': return 'lg:flex-row';
      case 'right': return 'lg:flex-row-reverse';
      case 'none': return 'flex-col';
      default: return 'lg:flex-row';
    }
  };

  const renderCover = (isPrint = false) => (
    <div id="page-cover" className={`mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-white ${book.pageSpacingMode === 'fixed' ? `size-${book.paperSize}` : 'w-full max-w-4xl min-h-[400px]'} ${isPrint ? 'print-page' : 'mb-20'}`}>
      <div className="relative w-full h-full flex flex-col">
        {book.coverImageUrl ? <img src={book.coverImageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white p-12 text-center flex-col min-h-[600px]">
          <i className="fa-solid fa-feather text-6xl mb-8 opacity-20"></i>
          <h1 className={`text-4xl lg:text-6xl font-bold uppercase tracking-tighter leading-tight ${book.font}`}>{book.title}</h1>
          <div className="w-24 h-1 bg-white/20 my-8"></div>
          <p className="text-xl font-medium tracking-widest opacity-60 uppercase">DPSS PROFESSIONAL SERIES</p>
        </div>}
        {book.coverImageUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-10 text-white">
          <h1 className={`text-4xl lg:text-5xl font-bold mb-4 uppercase tracking-tighter leading-tight ${book.font}`}>{book.title}</h1>
          <p className="text-xl opacity-90 font-medium italic">By {book.author}</p>
        </div>}
      </div>
    </div>
  );

  const renderTOC = (isPrint = false) => {
    const tocStyles = {
      classic: { container: 'border-double border-8 border-slate-900', title: 'font-playfair border-b-2 border-slate-900 pb-4 mb-10' },
      modern: { container: 'bg-slate-50', title: 'font-inter font-black uppercase tracking-[0.5em] text-blue-600 mb-12' },
      minimal: { container: 'bg-white', title: 'font-inter font-light text-slate-400 uppercase tracking-widest mb-16' },
      playful: { container: 'bg-amber-50 rounded-[3rem] border-4 border-dashed border-amber-200', title: 'font-handwritten text-4xl text-amber-600 mb-8' }
    }[book.tocStyle || 'classic'];

    return (
      <div id="page-toc" className={`mx-auto bg-white ${book.pageSpacingMode === 'fixed' ? `size-${book.paperSize}` : 'w-full max-w-4xl min-h-[600px]'} p-16 flex flex-col items-center overflow-hidden ${isPrint ? 'print-page' : 'mb-20'}`}>
        <div className={`w-full h-full p-12 flex flex-col ${tocStyles.container}`}>
          <h2 className={`text-4xl text-center font-bold ${tocStyles.title}`}>Table of Contents</h2>
          <ul className="toc-list space-y-4 w-full flex-1 overflow-y-auto custom-scrollbar pr-4">
            {book.pages.map((p, i) => (
              <li key={i} className={`text-lg ${book.font} cursor-pointer hover:text-blue-600 transition-colors`} onClick={() => !isPrint && scrollToPage(`page-${i+1}`)}>
                <span className="toc-name">{p.title || `Chapter ${i + 1}`}</span>
                <span className="toc-dots"></span>
                <span className="toc-page">{book.hasTableOfContents ? i + 3 : i + 2}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 text-center text-[10px] font-black uppercase text-slate-300 tracking-widest">DPSS AI Publishing</div>
        </div>
      </div>
    );
  };

  const renderPage = (page: BookPage, idx: number, isPrint = false) => (
    <div id={`page-${idx+1}`} className={`flex ${getPageClasses(page.layout)} mx-auto bg-white shadow-2xl overflow-hidden border border-slate-200 ${book.pageSpacingMode === 'fixed' ? `size-${book.paperSize}` : 'w-full max-w-4xl h-auto'} ${isPrint ? 'print-page' : 'mb-20'}`}>
      {!book.isTextOnly && page.layout !== 'none' && (
        <div className={`${['top', 'bottom'].includes(page.layout) ? 'w-full h-auto min-h-[400px]' : 'lg:w-1/2 h-full min-h-[600px]'} relative bg-slate-50`}>
          {page.imageUrl ? <img src={page.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-slate-100"><div className="custom-loader"></div></div>}
        </div>
      )}

      <div className={`${(book.isTextOnly || page.layout === 'none') ? 'w-full h-full' : (['top', 'bottom'].includes(page.layout) ? 'w-full h-auto' : 'lg:w-1/2 h-full')} flex flex-col`}>
        <div 
          className={`flex-1 p-10 lg:p-16 paper-${book.paperStyle} relative overflow-y-auto custom-scrollbar`}
          style={{ 
            '--line-height': `${book.lineSpacing}rem`,
            lineHeight: `${book.lineSpacing}rem`,
            fontSize: `${book.fontSize}px` 
          } as React.CSSProperties}
        >
          <div className="absolute top-4 right-4 no-print flex gap-2">
            <button onClick={() => setIsEditing(!isEditing)} className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm transition-all">
              <i className={`fa-solid ${isEditing ? 'fa-check' : 'fa-pencil'}`}></i>
            </button>
          </div>

          <div 
            className={`${book.highlightText ? 'px-4 py-2 rounded-lg' : ''} ${book.font} outline-none text-justify`} 
            style={{ backgroundColor: book.highlightText ? '#fef08a' : 'transparent' }}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={(e) => handleTextChange(idx, e.currentTarget.innerText)}
          >
             {page.title && <h3 className="font-bold mb-10 text-2xl opacity-80 uppercase tracking-tighter border-b-2 border-slate-900 inline-block">{page.title}</h3>}
             <p className="text-slate-900 whitespace-pre-wrap mb-12">{page.text}</p>
             
             {book.vocabularyEnabled && page.vocabulary && page.vocabulary.length > 0 && (
               <div className="mt-16 pt-8 border-t-2 border-slate-100 no-print-section">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600 mb-6 italic">Vocabulary Lab</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                   {page.vocabulary.map((v, i) => (
                     <div key={i} className="space-y-1">
                       <span className="font-black text-sm uppercase text-slate-800">{v.word}</span>
                       <p className="text-xs text-slate-500 font-medium italic leading-relaxed">{v.definition}</p>
                     </div>
                   ))}
                 </div>
               </div>
             )}
          </div>
        </div>
        <div className="p-4 text-center text-[10px] font-black text-slate-300 border-t border-slate-100 italic tracking-[0.3em]">PAGE {book.hasTableOfContents ? idx + 3 : idx + 2}</div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-full mx-auto pb-48 px-0">
      <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white p-4 flex flex-wrap items-center justify-between gap-6 no-print z-[100] w-[95%] max-w-7xl">
        <div className="flex items-center gap-8 flex-wrap">
          <button onClick={onReset} className="text-slate-600 hover:text-blue-600 font-black text-sm flex items-center gap-2 uppercase italic tracking-tighter">
            <i className="fa-solid fa-arrow-left"></i> BACK TO HUB
          </button>
          
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Font Size</label>
            <input type="range" min="12" max="60" value={book.fontSize} onChange={(e) => updateBookConfig('fontSize', parseInt(e.target.value))} className="accent-orange-600 h-1 bg-slate-100 rounded-full w-24 appearance-none" />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spaced Mode</label>
            <button onClick={() => updateBookConfig('pageSpacingMode', book.pageSpacingMode === 'fixed' ? 'fit' : 'fixed')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${book.pageSpacingMode === 'fit' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {book.pageSpacingMode === 'fit' ? 'NO SPACE BELOW' : 'FIXED SPACE'}
            </button>
          </div>

          <button onClick={() => updateBookConfig('highlightText', !book.highlightText)} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border-none shadow-sm ${book.highlightText ? 'bg-[#facc15] text-slate-900' : 'bg-slate-100 text-slate-400'}`}>HIGHLIGHT MODE</button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-black transition-all"><i className="fa-solid fa-file-pdf"></i> PRINT PDF</button>
          <button onClick={exportToWord} className="bg-orange-50 text-orange-600 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm hover:bg-white transition-all"><i className="fa-solid fa-file-word"></i> WORD</button>
        </div>
      </div>

      <div className="pt-32 pb-12 flex flex-col items-center bg-slate-100/30 no-print" ref={scrollContainerRef}>
        {renderCover()}
        {book.hasTableOfContents && renderTOC()}
        {book.pages.map((p, idx) => renderPage(p, idx))}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm border-t border-slate-200 p-4 no-print z-[100] flex items-center gap-4 overflow-x-auto custom-scrollbar shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button onClick={() => scrollToPage('page-cover')} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase whitespace-nowrap">COVER</button>
        {book.hasTableOfContents && <button onClick={() => scrollToPage('page-toc')} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase whitespace-nowrap">TOC</button>}
        {book.pages.map((_, idx) => (
          <button key={idx} onClick={() => scrollToPage(`page-${idx+1}`)} className={`min-w-[40px] h-10 border rounded-xl text-[10px] font-black transition-all ${idx + 1 === 8 ? 'bg-orange-600 text-white border-orange-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>{idx + 1}</button>
        ))}
      </div>
      
      <div className="hidden print:block">
        {renderCover(true)}
        {book.hasTableOfContents && renderTOC(true)}
        {book.pages.map((p, idx) => renderPage(p, idx, true))}
      </div>
    </div>
  );
};

export default BookViewer;

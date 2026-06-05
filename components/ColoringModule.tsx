
import React, { useState, useRef } from 'react';
import { generateIllustration, generateTracingWords } from '../services/geminiService';
import { ColoringCard, TracingItem, PaperSize, WorksheetLayout, BookFont } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface ColoringModuleProps {
  onBack: () => void;
}

const ColoringModule: React.FC<ColoringModuleProps> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('Supergirl');
  const [teacherName, setTeacherName] = useState('');
  const [worksheetDate, setWorksheetDate] = useState(new Date().toLocaleDateString());
  const [parentSignature, setParentSignature] = useState(true);
  const [rewardStyle, setRewardStyle] = useState<'stars' | 'flowers' | 'leaf' | 'none'>('stars');
  const [paperSize, setPaperSize] = useState<PaperSize>(PaperSize.A4);
  const [layout, setLayout] = useState<WorksheetLayout>(WorksheetLayout.FULL_PAGE);
  const [lineThickness, setLineThickness] = useState(3);
  const [elementSpacing, setElementSpacing] = useState(6);
  const [tracingSpacing, setTracingSpacing] = useState(24);
  const [frameStyle, setFrameStyle] = useState<ColoringCard['frameStyle']>('random');
  const [randomizeFonts, setRandomizeFonts] = useState(false);
  const [pageCount, setPageCount] = useState(4);
  
  // Positioning and background states
  const [enableBackground, setEnableBackground] = useState(true);
  const [superstarPosition, setSuperstarPosition] = useState<'center' | 'top' | 'left' | 'right'>('center');
  const [heroCount, setHeroCount] = useState<1 | 2 | 3>(1);

  const [tracingItems, setTracingItems] = useState<TracingItem[]>([
    { id: '1', text: 'S', repeatCount: 5, fontStyle: BookFont.TRACING },
    { id: '2', text: 'Super', repeatCount: 5, fontStyle: BookFont.TRACING },
    { id: '3', text: 'Hero', repeatCount: 5, fontStyle: BookFont.TRACING }
  ]);
  const [cards, setCards] = useState<ColoringCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [uploadImages, setUploadImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRandomize = () => {
    const positions: ('center' | 'top' | 'left' | 'right')[] = ['center', 'top', 'left', 'right'];
    const counts: (1 | 2 | 3)[] = [1, 2, 3];
    setSuperstarPosition(positions[Math.floor(Math.random() * positions.length)]);
    setHeroCount(counts[Math.floor(Math.random() * counts.length)]);
    setEnableBackground(Math.random() > 0.5);
    setLineThickness(Math.floor(Math.random() * 5) + 2);
  };

  const addTracingItem = () => {
    setTracingItems([...tracingItems, { id: Math.random().toString(), text: '', repeatCount: 5, fontStyle: BookFont.TRACING }]);
  };

  const updateTracingItem = (id: string, updates: Partial<TracingItem>) => {
    setTracingItems(tracingItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleAITextMagic = async () => {
    if (!prompt) return alert("Please enter a topic first!");
    setLoading(true);
    setLoadingMsg(`AI Laboratory is brainstorming matching vocabulary...`);
    try {
      const words = await generateTracingWords(prompt, 3);
      setTracingItems(words.map(w => ({ id: Math.random().toString(), text: w, repeatCount: 5, fontStyle: BookFont.TRACING })));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const generateWorksheets = async () => {
    if (uploadImages.length === 0 && !prompt) return alert("Please provide a prompt or upload reference images.");
    setLoading(true);
    setLoadingMsg(`Executing multi-node rendering for ${pageCount} workbook pages...`);
    
    try {
      const generatedCards: ColoringCard[] = [];
      const totalToGen = Math.max(pageCount, uploadImages.length);
      const frames: ColoringCard['frameStyle'][] = ['bubbles', 'stars', 'leaves', 'classic'];

      for (let i = 0; i < totalToGen; i++) {
        setLoadingMsg(`[Node Switch Active] Rendering Sheet ${i + 1} of ${totalToGen}...`);
        try {
          let imageUrl = uploadImages[i] || '';
          if (!imageUrl && prompt) {
            const backgroundPart = enableBackground 
              ? `with a detailed immersive background scenery filling the entire frame` 
              : `STRICTLY NO BACKGROUND, pure white background, isolated characters only`;
            
            const positionPart = superstarPosition === 'center' 
              ? `centered focus` 
              : `aligned to the ${superstarPosition} to leave space elsewhere`;

            const countPart = heroCount === 1 
              ? `featuring one single main character` 
              : `featuring exactly ${heroCount} different characters interacting together`;

            const masterPrompt = `STRICT BLACK AND WHITE ONLY, bold line art (weight: ${lineThickness}pt), coloring book style, no shading. Subject: ${prompt}. ${countPart}, ${positionPart}, ${backgroundPart}. High contrast, clean outlines for kids. Fill the page.`;
            
            imageUrl = await generateIllustration(masterPrompt);
          }
          
          if (imageUrl) {
            generatedCards.push({
              id: Math.random().toString(36).substr(2, 9),
              imageUrl: imageUrl,
              tracingItems: JSON.parse(JSON.stringify(tracingItems)), 
              paperSize, layout, teacherName, date: worksheetDate,
              parentSignature, hasStars: rewardStyle === 'stars', lineThickness, elementSpacing, tracingSpacing,
              frameStyle: frameStyle === 'random' ? frames[Math.floor(Math.random() * frames.length)] : frameStyle
            });
          }
        } catch (err) {
          console.error(`Render failed for page ${i + 1}.`, err);
        }
      }
      setCards(generatedCards);
    } catch (e: any) {
      alert("Workbook generation failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const HeaderBlock = ({ card, sectionIdx }: { card: ColoringCard, sectionIdx?: number }) => (
    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2 mb-4">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase text-slate-400">Teacher: <span className="text-slate-900 font-bold">{card.teacherName || '________________'}</span></p>
        <p className="text-[10px] font-black uppercase text-slate-400">Date: <span className="text-slate-900 font-bold">{card.date || '________________'}</span></p>
      </div>
      <div className="text-center">
        <h2 className="text-xs font-black uppercase italic tracking-tighter">Coloring Lab {sectionIdx !== undefined ? `Section ${sectionIdx + 1}` : ''}</h2>
        {rewardStyle !== 'none' && (
          <div className="flex gap-1 justify-center mt-1">
            {[1,2,3,4,5].map(s => (
              <i key={s} className={`text-[10px] text-slate-300 ${
                rewardStyle === 'stars' ? 'fa-regular fa-star' : 
                rewardStyle === 'flowers' ? 'fa-solid fa-seedling' : 'fa-solid fa-leaf'
              }`}></i>
            ))}
          </div>
        )}
      </div>
      {parentSignature && (
        <div className="border border-dashed border-slate-200 p-1 px-3 rounded-lg text-center bg-slate-50/30">
          <p className="text-[7px] font-black uppercase text-slate-300">Parents' Signature</p>
          <div className="h-4 w-20"></div>
        </div>
      )}
    </div>
  );

  const ContentBlock = ({ card }: { card: ColoringCard }) => {
    const isTriple = card.layout === WorksheetLayout.TRI_FOLD;
    const fontsPool = [BookFont.TRACING, BookFont.SCHOOL, BookFont.COMING_SOON, BookFont.GOCHI, BookFont.HANDWRITTEN];

    return (
      <div className={`flex-1 flex flex-col items-center justify-center relative ${isTriple ? 'p-2 gap-4' : 'p-8 gap-8'}`} style={{ gap: isTriple ? '0.5rem' : `${card.elementSpacing * 0.4}rem` }}>
        <div className="relative z-10 w-full flex justify-center">
          <img src={card.imageUrl} className={`${isTriple ? 'max-h-40' : 'max-h-80'} max-w-[95%] object-contain mix-blend-multiply`} />
        </div>
        <div className="w-full space-y-4 z-10">
          {card.tracingItems.map((item, idx) => (
            <div key={idx} className="flex flex-wrap border-b border-slate-100 pb-3 justify-center" style={{ gap: `${card.tracingSpacing}px` }}>
              {Array.from({ length: item.repeatCount }).map((_, i) => {
                const style = randomizeFonts ? fontsPool[Math.floor(Math.random() * fontsPool.length)] : (item.fontStyle || BookFont.TRACING);
                return (
                  <span key={i} className={`${isTriple ? 'text-2xl' : 'text-4xl'} ${style} text-slate-900`} style={{ opacity: Math.max(0.15, (card.lineThickness / 10)) }}>
                    {item.text || '?'}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center"><LoadingSpinner progress={50} message={loadingMsg} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 py-4 px-12 flex items-center justify-between sticky top-0 z-40 no-print shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-500 hover:text-orange-600 font-black flex items-center gap-2 uppercase text-xs italic"><i className="fa-solid fa-chevron-left"></i> Hub</button>
          <div className="h-6 w-px bg-slate-200"></div>
          <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Coloring Workbook Lab</h2>
        </div>
        {cards.length > 0 && (
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all"><i className="fa-solid fa-print mr-2"></i> Print All Sheets</button>
        )}
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <aside className="w-full lg:w-[400px] bg-white border-r border-slate-200 p-8 overflow-y-auto no-print space-y-6 custom-scrollbar shrink-0">
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lab Context</h3>
            <div className="grid grid-cols-2 gap-4">
              <input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500" placeholder="Teacher" />
              <input value={worksheetDate} onChange={(e) => setWorksheetDate(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <label className="text-[10px] font-black text-slate-600 uppercase">Parents' Signature</label>
                <input type="checkbox" checked={parentSignature} onChange={(e) => setParentSignature(e.target.checked)} className="w-5 h-5 accent-orange-500 cursor-pointer" />
              </div>
            </div>
          </section>

          <section className="bg-slate-50 p-6 rounded-[2rem] space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Composition</h3>
              <button onClick={handleRandomize} className="text-[9px] font-black text-orange-600 uppercase bg-white px-3 py-1 rounded-full border border-orange-100 shadow-sm hover:bg-orange-50 transition-colors">
                <i className="fa-solid fa-shuffle mr-1"></i> Randomize
              </button>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase">Superstar Topic (Hero 1, Hero 2...)</label>
              <input 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                placeholder="E.g. Supergirl and Superman" 
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-orange-500 shadow-sm" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase">Number of Heroes</label>
              <select value={heroCount} onChange={(e) => setHeroCount(parseInt(e.target.value) as any)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold shadow-sm">
                <option value={1}>1 Hero</option>
                <option value={2}>2 Heroes</option>
                <option value={3}>3 Heroes</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase">Placement</label>
              <select value={superstarPosition} onChange={(e) => setSuperstarPosition(e.target.value as any)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold shadow-sm cursor-pointer">
                <option value="center">Center Focus</option>
                <option value="top">At the Top</option>
                <option value="left">On the Left</option>
                <option value="right">On the Right</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase">Enable Background</label>
              <input type="checkbox" checked={enableBackground} onChange={(e) => setEnableBackground(e.target.checked)} className="w-5 h-5 accent-orange-500 cursor-pointer" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase flex justify-between"><span>Outline Weight</span><span className="text-orange-600 font-bold">{lineThickness}px</span></label>
              <input type="range" min="1" max="10" value={lineThickness} onChange={(e) => setLineThickness(parseInt(e.target.value))} className="w-full accent-orange-500 cursor-pointer" />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Blueprint Layout</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 uppercase">Pages</label>
                 <input type="number" min="1" max="24" value={pageCount} onChange={(e) => setPageCount(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border rounded-xl px-4 py-2 text-sm font-bold outline-none" />
               </div>
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 uppercase">Format</label>
                 <select value={layout} onChange={(e) => setLayout(e.target.value as WorksheetLayout)} className="w-full bg-slate-50 border rounded-xl px-2 py-2 text-[10px] font-bold outline-none">
                    <option value={WorksheetLayout.FULL_PAGE}>A4 Full</option>
                    <option value={WorksheetLayout.HALF_SHEET_CUT}>x2 Split</option>
                    <option value={WorksheetLayout.TRI_FOLD}>x3 Split</option>
                 </select>
               </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracing Rows</label>
               <button onClick={handleAITextMagic} className="text-[9px] font-black text-orange-600 uppercase hover:underline italic">AI Assist</button>
            </div>
            <div className="space-y-3">
              {tracingItems.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl group relative">
                  <div className="flex gap-2">
                    <input value={item.text} onChange={(e) => updateTracingItem(item.id, { text: e.target.value })} className="flex-1 bg-white border border-slate-100 rounded-lg p-2 text-xs font-black outline-none focus:border-orange-500" placeholder="Trace Text..." />
                    <input type="number" min="1" max="15" value={item.repeatCount} onChange={(e) => updateTracingItem(item.id, { repeatCount: parseInt(e.target.value) || 1 })} className="w-10 bg-white border border-slate-100 rounded-lg p-2 text-xs font-black text-center" />
                    <button onClick={() => setTracingItems(tracingItems.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500 transition-colors"><i className="fa-solid fa-times text-[10px]"></i></button>
                  </div>
                </div>
              ))}
              <button onClick={addTracingItem} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-[9px] font-black text-slate-400 uppercase hover:border-orange-400 transition-all">+ Add Row</button>
            </div>
          </section>

          <button onClick={generateWorksheets} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-orange-600 shadow-2xl transition-all uppercase italic tracking-tighter active:scale-95">Generate Workbook</button>
        </aside>

        <main className="flex-1 overflow-y-auto p-16 bg-slate-100/30 custom-scrollbar">
          <div className="mx-auto flex flex-col items-center gap-16">
            {cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[500px] text-slate-300 opacity-20">
                <i className="fa-solid fa-palette text-[120px] mb-8"></i>
                <h4 className="text-2xl font-black uppercase tracking-[0.5em] italic">Workbook Architect Ready</h4>
              </div>
            ) : (
              cards.map((card) => (
                <div key={card.id} className="bg-white shadow-2xl flex flex-col print-page size-A4 relative rounded-[3rem] overflow-hidden mb-12">
                  {card.layout === WorksheetLayout.FULL_PAGE && (
                    <div className="p-12 flex-1 flex flex-col">
                      <HeaderBlock card={card} />
                      <ContentBlock card={card} />
                    </div>
                  )}

                  {card.layout === WorksheetLayout.HALF_SHEET_CUT && (
                    <div className="flex-1 flex flex-col divide-y-4 divide-dashed divide-slate-100">
                      {[0, 1].map((i) => (
                        <div key={i} className="p-12 h-1/2 flex flex-col">
                          <HeaderBlock card={card} sectionIdx={i} />
                          <ContentBlock card={card} />
                        </div>
                      ))}
                    </div>
                  )}

                  {card.layout === WorksheetLayout.TRI_FOLD && (
                    <div className="flex-1 flex flex-col divide-y-4 divide-dashed divide-slate-100">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="p-8 h-1/3 min-h-[400px] flex flex-col">
                          <HeaderBlock card={card} sectionIdx={i} />
                          <ContentBlock card={card} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ColoringModule;

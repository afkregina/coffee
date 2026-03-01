import React, { useState, useEffect, useRef } from 'react';
import { Coffee, Droplets, Check, Heart, Sparkles, MapPin, Calendar, Receipt, Volume2 } from 'lucide-react';

export default function App() {
  const [step, setStep] = useState(0); 
  // 0: Start, 1: Grind, 2: Brew, 3: Barista Call, 4: Receipt/Cup, 5: Accepted
  
  // Grinder State
  const [grindProgress, setGrindProgress] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [beans, setBeans] = useState([]);
  const grinderRef = useRef(null);
  const lastAngleRef = useRef(null);

  // Brewer State
  const [brewProgress, setBrewProgress] = useState(0);
  const [isPouring, setIsPouring] = useState(false);
  const pourIntervalRef = useRef(null);

  // Barista State
  const [audioPlayed, setAudioPlayed] = useState(false);

  // Receipt & Cup State
  const [receiptPrinting, setReceiptPrinting] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [isTorn, setIsTorn] = useState(false);
  const [tearAnim, setTearAnim] = useState(false);

  // --- AUDIO UNLOCK (Fixes browser autoplay blocking) ---
  const unlockAudio = () => {
    if ('speechSynthesis' in window) {
      const silentMsg = new SpeechSynthesisUtterance('');
      silentMsg.volume = 0; // Silent
      window.speechSynthesis.speak(silentMsg);
    }
    setStep(1);
  };

  // --- GRINDER LOGIC ---
  const handleGrindStart = (e) => {
    if (grindProgress >= 100) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    updateAngle(clientX, clientY, true);
  };

  const handleGrindMove = (e) => {
    if (grindProgress >= 100 || lastAngleRef.current === null) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    updateAngle(clientX, clientY, false);
  };

  const handleGrindEnd = () => {
    lastAngleRef.current = null;
  };

  const updateAngle = (x, y, isStart) => {
    if (!grinderRef.current) return;
    const rect = grinderRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    if (!isStart && lastAngleRef.current !== null) {
      let diff = angle - lastAngleRef.current;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      
      setRotation(prev => prev + diff);
      
      const absDiff = Math.abs(diff);
      // Spawn falling beans
      if (absDiff > 2 && Math.random() > 0.3) {
        const newBean = {
          id: Date.now() + Math.random(),
          offsetX: (Math.random() - 0.5) * 40
        };
        setBeans(prev => [...prev.slice(-15), newBean]); // keep last 15 beans
      }

      setGrindProgress(prev => {
        const newProgress = prev + absDiff / 15;
        if (newProgress >= 100) {
          setTimeout(() => setStep(2), 1000);
          return 100;
        }
        return newProgress;
      });
    }
    lastAngleRef.current = angle;
  };

  // --- BREWER LOGIC ---
  const startPouring = () => {
    if (brewProgress >= 100) return;
    setIsPouring(true);
    pourIntervalRef.current = setInterval(() => {
      setBrewProgress(prev => {
        const newProgress = prev + 1.5;
        if (newProgress >= 100) {
          stopPouring();
          setTimeout(() => setStep(3), 1500); // Move to Barista Call
          return 100;
        }
        return newProgress;
      });
    }, 50);
  };

  const stopPouring = () => {
    setIsPouring(false);
    if (pourIntervalRef.current) clearInterval(pourIntervalRef.current);
  };

  // --- BARISTA CALL LOGIC ---
  const playBaristaAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Clear any pending speech
      // Phonetic spelling for correct pronunciation "Ah-een"
      const msg = new SpeechSynthesisUtterance("Order for... Ah een?");
      msg.pitch = 1.1;
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    }
    setAudioPlayed(true);
  };

  useEffect(() => {
    if (step === 3 && !audioPlayed) {
      playBaristaAudio();
    }
  }, [step]);

  // --- RECEIPT TEAR LOGIC ---
  useEffect(() => {
    if (step === 4) {
      setTimeout(() => setReceiptPrinting(true), 500);
    }
  }, [step]);

  const handleDragStart = (e) => {
    if (isTorn || !receiptPrinting) return;
    setIsDragging(true);
    setStartY(e.touches ? e.touches[0].clientY : e.clientY);
  };

  const handleDragMove = (e) => {
    if (!isDragging || isTorn) return;
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - startY;
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging || isTorn) return;
    setIsDragging(false);
    if (dragY > 120) {
      // Trigger tear
      setTearAnim(true);
      setTimeout(() => {
        setIsTorn(true);
        setDragY(0);
      }, 500); // wait for fall animation to finish
    } else {
      // Snap back
      setDragY(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFE9E1] flex flex-col items-center justify-center p-4 font-sans text-[#4A3C31] overflow-hidden selection:bg-[#D9C8B4]">
      
      {/* INJECTED CSS FOR ANIMATIONS */}
      <style>{`
        @keyframes bean-fall {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translateY(80px) scale(0.6) rotate(90deg); opacity: 0; }
        }
        .animate-bean {
          animation: bean-fall 0.8s ease-in forwards;
        }
        @keyframes tear-away {
          0% { transform: translateY(${dragY}px) rotate(${dragY * 0.05}deg); opacity: 1; }
          100% { transform: translateY(${dragY + 300}px) rotate(15deg); opacity: 0; }
        }
        .animate-tear {
          animation: tear-away 0.5s ease-in forwards;
        }
      `}</style>

      {/* STEP 0: WELCOME */}
      {step === 0 && (
        <div className="max-w-sm w-full text-center space-y-6 animate-in fade-in zoom-in duration-700">
          <div className="w-20 h-20 bg-[#D9C8B4] rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Coffee className="text-[#5C4D42]" size={40} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#3E2723]">Hey there.</h1>
          <p className="text-lg text-[#6D4C41]">I think we're overdue for a good work session. But first, we need to make some coffee...</p>
          <button 
            onClick={unlockAudio}
            className="mt-8 bg-[#5C4D42] hover:bg-[#3E2723] text-white px-8 py-3 rounded-full text-lg font-medium transition-all shadow-md transform hover:-translate-y-1"
          >
            Let's brew ☕️
          </button>
        </div>
      )}

      {/* STEP 1: GRINDING */}
      {step === 1 && (
        <div className="max-w-sm w-full flex flex-col items-center space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-serif font-bold">Step 1: Grind the beans</h2>
            <p className="text-[#6D4C41] text-sm">Spin the crank with your finger!</p>
          </div>

          <div className="relative flex flex-col items-center pb-8">
            {/* Grinder UI */}
            <div 
              className="relative z-10 w-64 h-64 bg-[#D9C8B4] rounded-full shadow-inner flex items-center justify-center cursor-pointer border-8 border-[#C3B099]"
              style={{ touchAction: 'none' }}
              ref={grinderRef}
              onMouseDown={handleGrindStart}
              onMouseMove={handleGrindMove}
              onMouseUp={handleGrindEnd}
              onMouseLeave={handleGrindEnd}
              onTouchStart={handleGrindStart}
              onTouchMove={handleGrindMove}
              onTouchEnd={handleGrindEnd}
            >
              <div className="absolute w-24 h-24 bg-[#8B7355] rounded-full shadow-md flex items-center justify-center">
                <div className="w-8 h-8 bg-[#5C4D42] rounded-full" />
              </div>
              
              <div 
                className="absolute w-full h-full pointer-events-none transition-transform duration-75 ease-out"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <div className="absolute top-1/2 left-1/2 w-28 h-4 bg-[#5C4D42] origin-left -translate-y-1/2 rounded-r-full shadow-md" />
                <div className="absolute top-1/2 left-[calc(50%+6.5rem)] w-10 h-10 bg-[#3E2723] rounded-full -translate-y-1/2 -translate-x-1/2 shadow-lg border-2 border-[#5C4D42]" />
              </div>
            </div>

            {/* Falling Beans */}
            <div className="absolute bottom-0 w-16 h-16 flex justify-center z-0">
              {beans.map(bean => (
                <div 
                  key={bean.id}
                  className="absolute w-2 h-3 bg-[#3E2723] rounded-full animate-bean shadow-sm"
                  style={{ left: `calc(50% + ${bean.offsetX}px)` }}
                />
              ))}
            </div>
          </div>

          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm font-medium text-[#6D4C41]">
              <span>Grinding...</span>
              <span>{Math.floor(grindProgress)}%</span>
            </div>
            <div className="w-full h-3 bg-[#D9C8B4] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#5C4D42] transition-all duration-100 ease-out"
                style={{ width: `${grindProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: BREWING */}
      {step === 2 && (
        <div className="max-w-sm w-full flex flex-col items-center space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-serif font-bold">Step 2: The Pour Over</h2>
            <p className="text-[#6D4C41] text-sm">Press and hold to pour hot water.</p>
          </div>

          <div className="relative w-48 h-64 flex flex-col items-center justify-end pb-4">
            <div className={`absolute top-0 w-2 bg-blue-300/60 transition-all duration-300 ${isPouring ? 'h-32 opacity-100' : 'h-0 opacity-0'} rounded-b-full`} />
            
            <div className="relative z-10 w-32 h-24 bg-white/50 backdrop-blur-sm border-2 border-white rounded-b-[3rem] rounded-t-lg shadow-sm flex flex-col items-center justify-end overflow-hidden mb-2">
              <div 
                className="w-full bg-[#5C4D42] transition-all duration-300"
                style={{ height: `${20 + (brewProgress * 0.4)}%` }}
              />
            </div>

            <div className="relative w-full h-8 flex justify-center mb-2">
               {(isPouring || brewProgress > 0) && brewProgress < 100 && (
                 <Droplets className="text-[#3E2723] animate-bounce absolute" size={24} />
               )}
            </div>

            <div className="relative w-28 h-24 bg-white rounded-b-3xl rounded-t-md shadow-md border-b-4 border-gray-200 overflow-hidden flex items-end">
              <div className="absolute -right-6 top-4 w-8 h-12 border-4 border-white rounded-r-xl" />
              <div 
                className="w-full bg-[#3E2723] transition-all duration-300"
                style={{ height: `${brewProgress}%` }}
              />
            </div>
          </div>

          <button
            className={`px-8 py-4 rounded-full font-medium text-white shadow-lg transition-all transform active:scale-95 touch-manipulation flex items-center gap-2 ${brewProgress >= 100 ? 'bg-green-600' : isPouring ? 'bg-blue-500' : 'bg-[#5C4D42] hover:bg-[#3E2723]'}`}
            style={{ touchAction: 'manipulation', WebkitUserSelect: 'none' }}
            onMouseDown={startPouring}
            onMouseUp={stopPouring}
            onMouseLeave={stopPouring}
            onTouchStart={(e) => { e.preventDefault(); startPouring(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopPouring(); }}
          >
            {brewProgress >= 100 ? <><Check size={20} /> Brewed!</> : <><Droplets size={20} /> Hold to Pour</>}
          </button>
        </div>
      )}

      {/* STEP 3: BARISTA CALL */}
      {step === 3 && (
        <div className="max-w-md w-full flex flex-col items-center animate-in zoom-in duration-500">
          <div className="bg-white rounded-[2rem] p-8 shadow-xl mb-6 relative border-2 border-[#D9C8B4] max-w-[280px]">
            <p className="text-3xl font-serif font-bold text-[#3E2723] text-center leading-tight">
              "Order for... <br/><span className="italic text-[#8B7355]">Ainne?</span>"
            </p>
            {/* Speech bubble tail */}
            <div className="absolute -bottom-4 left-1/2 w-8 h-8 bg-white border-b-2 border-r-2 border-[#D9C8B4] transform -translate-x-1/2 rotate-45"></div>
          </div>

          <button 
            onClick={playBaristaAudio}
            className="mb-8 text-[#8B7355] flex items-center gap-2 hover:text-[#5C4D42] transition-colors bg-white/50 px-4 py-2 rounded-full text-sm font-medium"
          >
            <Volume2 size={16} /> Replay Audio
          </button>

          <button 
            onClick={() => setStep(4)}
            className="bg-[#5C4D42] hover:bg-[#3E2723] text-white px-8 py-4 rounded-full text-xl font-bold transition-all shadow-lg transform hover:-translate-y-1"
          >
            That's me! 🙋‍♀️
          </button>
        </div>
      )}

      {/* STEP 4: RECEIPT TEAR & CUP REVEAL */}
      {step === 4 && (
        <div className="max-w-md w-full h-[500px] flex flex-col items-center relative select-none" style={{ touchAction: 'none' }}>
          
          <div className="text-center mb-4 z-20">
             <h2 className="font-serif font-bold text-xl text-[#3E2723] animate-pulse">Drag receipt down to tear</h2>
          </div>

          {/* BACKGROUND: THE COFFEE CUP */}
          <div className="absolute top-24 z-0 animate-in fade-in zoom-in duration-1000 delay-500">
            <div className="relative w-48 h-64 bg-[#f8f5f0] rounded-b-[2.5rem] rounded-t-lg shadow-xl border-2 border-gray-200 flex flex-col items-center">
              {/* Cup Lid */}
              <div className="absolute -top-3 w-[105%] h-8 bg-gray-100 rounded-t-2xl shadow-sm border border-gray-300" />
              
              {/* Cardboard Sleeve */}
              <div className="absolute top-1/4 w-[102%] h-24 bg-[#C89B7B] shadow-sm transform -rotate-3 flex items-center justify-center border-y border-[#a67b5c]">
                 {/* Name correctly spelled but messy */}
                 <span 
                   className="text-4xl text-gray-800 font-bold opacity-80" 
                   style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive', transform: 'rotate(-5deg)' }}
                 >
                   Ainne
                 </span>
              </div>
            </div>
          </div>
          
          {/* FOREGROUND: PRINTER & RECEIPT */}
          <div className="absolute top-12 w-full flex flex-col items-center z-10">
            {/* Printer Slot */}
            <div className="w-72 h-4 bg-gray-800 rounded-full shadow-inner relative z-20 mb-[-2px]" />
            
            {/* Tearable Receipt Wrapper */}
            {!isTorn && (
              <div 
                className={`relative w-64 pt-2 z-10 cursor-grab active:cursor-grabbing ${tearAnim ? 'animate-tear pointer-events-none' : ''}`}
                style={{ 
                  transform: tearAnim ? undefined : `translateY(${dragY}px) rotate(${dragY * 0.05}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
              >
                <div 
                  className={`bg-white text-gray-800 font-mono p-6 shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-gray-200 transform transition-transform duration-3000 ease-out origin-top ${receiptPrinting ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}`}
                >
                  <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4 pointer-events-none">
                    <h2 className="font-bold text-xl tracking-widest">COWORKING</h2>
                    <p className="text-xs text-gray-500 mt-1">EST. TODAY</p>
                  </div>

                  <div className="space-y-3 text-sm pointer-events-none">
                    <div className="flex justify-between">
                      <span>ORDER #</span>
                      <span>001</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DATE</span>
                      <span className="font-bold bg-yellow-200 px-1">MARCH 23</span>
                    </div>
                    
                    <div className="border-t border-dashed border-gray-300 pt-3 mt-3">
                      <p className="font-bold mb-2">ITEMS:</p>
                      <div className="flex justify-between">
                        <span>1x Perfect Day</span>
                        <span>$0.00</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 pl-4">
                        <span>↳ Deep focus</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 pl-4">
                        <span>↳ Good chats</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 pl-4">
                        <span>↳ Endless coffee</span>
                      </div>
                    </div>

                    <div className="border-t border-b border-dashed border-gray-300 py-3 my-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>TOTAL</span>
                        <span>MY TREAT</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mt-6 space-y-2 pointer-events-none">
                    <p className="text-sm font-bold">SEE YOU THERE?</p>
                    <p className="text-xs text-gray-500">Tear to accept!</p>
                  </div>

                  <div className="absolute bottom-0 left-0 w-full h-2 bg-repeat-x flex" style={{ backgroundSize: '10px 10px', backgroundImage: 'radial-gradient(circle at 5px 10px, transparent 5px, white 5.5px)' }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Action Button (appears after tearing) */}
          <div className={`absolute bottom-0 w-full flex justify-center transition-all duration-700 ${isTorn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
             <button 
                onClick={() => setStep(5)}
                className="bg-[#3E2723] hover:bg-black text-white px-10 py-4 rounded-full text-xl font-bold shadow-2xl transform hover:scale-105 transition-all flex items-center gap-2"
             >
                Hell Yes! <Sparkles size={20} />
             </button>
          </div>
        </div>
      )}

      {/* STEP 5: CELEBRATION */}
      {step === 5 && (
        <div className="max-w-sm w-full text-center space-y-6 animate-in zoom-in duration-500">
          <div className="relative inline-block">
            <Heart className="text-red-500 animate-bounce" size={72} fill="currentColor" />
            <Sparkles className="text-yellow-500 absolute -top-4 -right-4 animate-pulse" size={32} />
          </div>
          <h2 className="text-4xl font-serif font-bold text-[#3E2723]">Yay! 🎉</h2>
          <p className="text-xl text-[#6D4C41]">It's officially on the calendar.</p>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#D9C8B4] inline-block mt-4 text-left">
            <div className="flex items-center gap-3 text-[#5C4D42]">
              <Calendar size={20} />
              <span className="font-medium text-lg">March 23</span>
            </div>
          </div>
          <p className="text-[#8B7355] mt-8">Screenshot this and send it to me!<br/> Let me know what time works best.</p>
        </div>
      )}

    </div>
  );
}



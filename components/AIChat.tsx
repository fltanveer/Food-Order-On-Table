import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, User, Bot, Loader2, Mic, MicOff } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { askConcierge } from '../services/gemini';
import { MENU_ITEMS, TABLE_ID } from '../constants';

// Audio Helpers
function decode(base64: string) {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Base64 decode error", e);
    return new Uint8Array(0);
  }
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

interface AIChatProps {
  onClose: () => void;
  actions: {
    openMenuItem: (name: string) => string;
    navigateTo: (screen: any) => string;
    setCategory: (id: string) => string;
    searchFor: (query: string) => string;
    viewCart: () => string;
    placeOrder: () => string;
    getCartItems: () => string;
  };
}

export const AIChat: React.FC<AIChatProps> = ({ onClose, actions }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hi! I'm your AI Concierge. I can help you choose dishes, review your basket, and place your order. How can I help today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTranscription, setActiveTranscription] = useState<{ role: 'user' | 'assistant', content: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef(actions);
  
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  // Transcription Accumulators
  const currentInputText = useRef('');
  const currentOutputText = useRef('');

  // Live Session Refs
  const sessionRef = useRef<any>(null);
  const audioContextsRef = useRef<{ input?: AudioContext, output?: AudioContext }>({});
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, activeTranscription]);

  useEffect(() => {
    return () => {
      stopVoice();
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    setErrorMessage(null);

    const response = await askConcierge(userMsg);
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  const startVoice = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setErrorMessage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Resume contexts to handle autoplay policies
      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      audioContextsRef.current = { input: inputCtx, output: outputCtx };
      
      const openMenuItemTool: FunctionDeclaration = {
        name: 'openMenuItem',
        parameters: {
          type: Type.OBJECT,
          description: 'Opens the detail modal for a specific menu item.',
          properties: { itemName: { type: Type.STRING, description: 'The name of the food item' } },
          required: ['itemName'],
        },
      };

      const navigateToTool: FunctionDeclaration = {
        name: 'navigateTo',
        parameters: {
          type: Type.OBJECT,
          description: 'Navigates to a specific screen in the app.',
          properties: { screen: { type: Type.STRING, enum: ['welcome', 'menu', 'cart'] } },
          required: ['screen'],
        },
      };

      const viewCartTool: FunctionDeclaration = {
        name: 'viewCart',
        parameters: { type: Type.OBJECT, properties: {}, description: 'Navigates the user to the cart/basket screen for review.' },
      };

      const placeOrderTool: FunctionDeclaration = {
        name: 'placeOrder',
        parameters: { type: Type.OBJECT, properties: {}, description: 'Finalizes the order and triggers the success confirmation screen.' },
      };

      const getCartItemsTool: FunctionDeclaration = {
        name: 'getCartItems',
        parameters: { type: Type.OBJECT, properties: {}, description: 'Gets the current list of items and total price from the user basket.' },
      };

      const knowledgeBase = MENU_ITEMS.map(i => `${i.name}: ${i.description} ($${i.price})`).join('\n');
      const sysInstruction = `You are the Boston Kebab AI Concierge. Table: ${TABLE_ID}.
Knowledge Base:
${knowledgeBase}

Order Flow Protocol:
1. If the user wants to order or is ready to finish:
   - ALWAYS call "viewCart" first to show them their items.
   - Verbally confirm with them (e.g., "I've pulled up your basket for Table ${TABLE_ID}. Does everything look correct?").
2. Only after they explicitly confirm (e.g., "Yes", "Place it"), call "placeOrder".
3. Use "getCartItems" to intelligently discuss what they've already selected if they ask.

General Guidelines:
- Warm hospitality. Be descriptive about food. Concise voice responses. Use tools to show items or change screens.`;

      const sessionPromise = ai.live.connect({
        model: LIVE_MODEL,
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsVoiceActive(true);
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };

              sessionPromise.then(session => {
                if (sessionRef.current) {
                  session.sendRealtimeInput({ media: pcmBlob });
                }
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Audio Output Processing
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputCtx && outputCtx.state !== 'closed') {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            // Transcriptions
            if (message.serverContent?.inputTranscription) {
              currentInputText.current += message.serverContent.inputTranscription.text;
              setActiveTranscription({ role: 'user', content: currentInputText.current });
            }
            if (message.serverContent?.outputTranscription) {
              currentOutputText.current += message.serverContent.outputTranscription.text;
              setActiveTranscription({ role: 'assistant', content: currentOutputText.current });
            }

            // Finalize Messages on Turn Completion
            if (message.serverContent?.turnComplete) {
              const finalInput = currentInputText.current;
              const finalOutput = currentOutputText.current;
              setMessages(prev => {
                const next = [...prev];
                if (finalInput) next.push({ role: 'user', content: finalInput });
                if (finalOutput) next.push({ role: 'assistant', content: finalOutput });
                return next;
              });
              currentInputText.current = '';
              currentOutputText.current = '';
              setActiveTranscription(null);
            }

            // Handling Interruptions
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              currentOutputText.current = '';
              setActiveTranscription(null);
            }

            // Tool Call Handling with Array-wrapped functionResponses
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                let result = "Done.";
                if (fc.name === 'openMenuItem') {
                   result = actionsRef.current.openMenuItem((fc.args as any).itemName);
                } else if (fc.name === 'navigateTo') {
                   result = actionsRef.current.navigateTo((fc.args as any).screen);
                } else if (fc.name === 'viewCart') {
                   result = actionsRef.current.viewCart();
                } else if (fc.name === 'placeOrder') {
                   result = actionsRef.current.placeOrder();
                } else if (fc.name === 'getCartItems') {
                   result = actionsRef.current.getCartItems();
                }
                
                sessionPromise.then(session => {
                  if (session) {
                    session.sendToolResponse({
                      functionResponses: [{ id: fc.id, name: fc.name, response: { result } }]
                    });
                  }
                });
              }
            }
          },
          onerror: (e) => {
            console.error("Live Session Error", e);
            setErrorMessage("Connection unstable. Please verify mic access or try again.");
            stopVoice();
          },
          onclose: (e) => {
            console.debug("Live Session Closed", e);
            setIsVoiceActive(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          tools: [{ functionDeclarations: [openMenuItemTool, navigateToTool, viewCartTool, placeOrderTool, getCartItemsTool] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: sysInstruction,
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Voice start failed", err);
      setErrorMessage("Microphone access denied or service unavailable.");
      setIsConnecting(false);
    }
  };

  const stopVoice = () => {
    // Clear Session
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null;
    }
    
    // Disconnect Processing Nodes
    if (scriptProcessorRef.current) {
      try { scriptProcessorRef.current.disconnect(); } catch(e) {}
      scriptProcessorRef.current = null;
    }
    
    // Stop Media Tracks
    if (streamRef.current) {
      try { streamRef.current.getTracks().forEach(track => track.stop()); } catch(e) {}
      streamRef.current = null;
    }
    
    // Close Audio Contexts Safely
    const contexts = audioContextsRef.current;
    if (contexts.input && contexts.input.state !== 'closed') {
      contexts.input.close().catch(() => {});
    }
    if (contexts.output && contexts.output.state !== 'closed') {
      contexts.output.close().catch(() => {});
    }
    audioContextsRef.current = {};
    
    setIsVoiceActive(false);
    setActiveTranscription(null);
  };

  const toggleVoice = () => {
    if (isVoiceActive) stopVoice();
    else startVoice();
  };

  return (
    <div className="fixed bottom-24 right-6 z-[200] w-[380px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[calc(100vh-10rem)] flex flex-col rounded-[2.5rem] shadow-[0_30px_90px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-200 bg-white animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out origin-bottom-right">
      {/* Header */}
      <div className="p-4 border-b bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-xl">
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm">AI Concierge</h3>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isVoiceActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-400">
                {isVoiceActive ? 'Voice Mode' : isConnecting ? 'Connecting...' : 'Text Mode'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 no-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] p-3.5 rounded-2xl shadow-sm text-sm ${
              m.role === 'user' 
              ? 'bg-slate-900 text-white rounded-br-none' 
              : 'bg-white border text-slate-700 rounded-bl-none'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">
                  {m.role === 'user' ? 'You' : 'Concierge'}
                </span>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        
        {/* Active Live Transcription Bubble */}
        {activeTranscription && (
          <div className={`flex ${activeTranscription.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[90%] p-3.5 rounded-2xl shadow-sm text-sm border-2 ${
              activeTranscription.role === 'user' 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 rounded-br-none' 
              : 'bg-white border-emerald-200 text-slate-700 rounded-bl-none italic'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex gap-1 h-2 items-end">
                   <div className="w-0.5 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_0s]" style={{ height: '60%' }}></div>
                   <div className="w-0.5 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_0.2s]" style={{ height: '100%' }}></div>
                   <div className="w-0.5 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_0.4s]" style={{ height: '80%' }}></div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
                  {activeTranscription.role === 'user' ? 'Listening...' : 'Speaking...'}
                </span>
              </div>
              <p className="leading-relaxed">{activeTranscription.content || '...'}</p>
            </div>
          </div>
        )}

        {errorMessage && (
           <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-[11px] text-red-600 font-bold uppercase tracking-widest text-center">
             {errorMessage}
           </div>
        )}

        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white border p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Consulting Chef...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white shrink-0">
        <div className="flex items-center gap-2">
           <button 
             onClick={toggleVoice}
             disabled={isConnecting}
             className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all shrink-0 ${
               isVoiceActive 
               ? 'bg-red-500 text-white shadow-lg shadow-red-200' 
               : isConnecting 
               ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
               : 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:scale-105 active:scale-95'
             }`}
           >
             {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : isVoiceActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
           </button>

           <div className="flex-1 flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isVoiceActive ? "Listening for voice..." : "How can I help?"}
                disabled={isConnecting}
                className="flex-1 bg-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all border-none disabled:opacity-50"
              />
              <button 
                onClick={handleSend} 
                disabled={loading || !input.trim() || isVoiceActive}
                className="h-11 w-11 bg-slate-900 text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-slate-800 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
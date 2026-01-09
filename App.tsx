import React, { useState, useMemo, useCallback } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  CheckCircle2, 
  ChefHat, 
  Bell, 
  Trash2,
  ArrowRight,
  ChevronLeft,
  Search,
  Sparkles,
  Info,
  MessageSquareQuote,
  Eye,
  EyeOff,
  Settings2,
  MapPin,
  PlayCircle,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { TABLE_ID, CATEGORIES, MENU_ITEMS } from './constants';
import { MenuItem, Category, CartItem, Screen, Choice } from './types';
import { Button } from './components/ui/Button';
import { AIChat } from './components/AIChat';

const App: React.FC = () => {
  // UI State
  const [screen, setScreen] = useState<Screen>('welcome');
  const [activeCategory, setActiveCategory] = useState<string>('popular');
  const [showAI, setShowAI] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  
  // Selection State
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [tempOptions, setTempOptions] = useState<Record<string, Choice[]>>({});
  const [tempQuantity, setTempQuantity] = useState(1);
  const [tempNotes, setTempNotes] = useState('');
  const [editingCartId, setEditingCartId] = useState<string | null>(null);

  // Dynamic Menu State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);

  // Data State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Derived State
  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.totalPrice * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (searchQuery) {
      items = items.filter(i => 
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        i.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      if (activeCategory === 'popular') {
        items = items.filter(i => i.popular);
      } else {
        items = items.filter(i => i.categoryId === activeCategory);
      }
    }
    return items;
  }, [activeCategory, searchQuery, menuItems]);

  // Handlers
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://placehold.co/800x600/1e293b/white?text=Boston+Kebab';
  };

  const openDetails = useCallback((item: MenuItem, editId: string | null = null) => {
    // Detail modal disabled in staff mode
    if (isStaffMode) return;
    if (!item.isAvailable) return;
    
    setShowVideo(false);
    setVideoLoading(false);
    if (editId) {
      const existing = cart.find(c => c.cartId === editId);
      if (existing) {
        setSelectedItem(item);
        setTempOptions(existing.selectedOptions);
        setTempQuantity(existing.quantity);
        setTempNotes(existing.notes || '');
        setEditingCartId(editId);
      }
    } else {
      setSelectedItem(item);
      setTempOptions({});
      setTempQuantity(1);
      setTempNotes('');
      setEditingCartId(null);
    }
  }, [cart, isStaffMode]);

  const toggleAvailability = (itemId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
    ));
  };

  const closeDetails = useCallback(() => {
    setSelectedItem(null);
    setEditingCartId(null);
    setTempOptions({});
    setTempQuantity(1);
    setTempNotes('');
    setShowVideo(false);
  }, []);

  const calculateUnitTotal = (item: MenuItem, opts: Record<string, Choice[]>) => {
    let total = item.price;
    Object.values(opts).flat().forEach(o => total += o.price);
    return total;
  };

  const handleOptionToggle = (groupId: string, choice: Choice, type: 'single' | 'multi') => {
    setTempOptions(prev => {
      const current = prev[groupId] || [];
      if (type === 'single') return { ...prev, [groupId]: [choice] };
      
      const exists = current.find(c => c.id === choice.id);
      if (exists) return { ...prev, [groupId]: current.filter(c => c.id !== choice.id) };
      return { ...prev, [groupId]: [...current, choice] };
    });
  };

  const confirmAddToCart = () => {
    if (!selectedItem) return;

    const unitPrice = calculateUnitTotal(selectedItem, tempOptions);
    const newCartItem: CartItem = {
      cartId: editingCartId || Math.random().toString(36).substr(2, 9),
      itemId: selectedItem.id,
      name: selectedItem.name,
      image: selectedItem.image,
      quantity: tempQuantity,
      selectedOptions: { ...tempOptions },
      notes: tempNotes.trim() || undefined,
      basePrice: selectedItem.price,
      totalPrice: unitPrice
    };

    setCart(prev => {
      if (editingCartId) {
        return prev.map(c => c.cartId === editingCartId ? newCartItem : c);
      } else {
        return [...prev, newCartItem];
      }
    });
    
    closeDetails();
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.cartId === cartId) {
        return { ...c, quantity: Math.max(1, c.quantity + delta) };
      }
      return c;
    }));
  };

  const removeItem = (cartId: string) => {
    setCart(prev => prev.filter(c => c.cartId !== cartId));
  };

  const isAddButtonDisabled = useMemo(() => {
    if (!selectedItem) return true;
    return selectedItem.options.some(g => 
      g.required && (!tempOptions[g.id] || tempOptions[g.id].length === 0)
    );
  }, [selectedItem, tempOptions]);

  const toggleVideo = () => {
    if (!showVideo) setVideoLoading(true);
    setShowVideo(!showVideo);
  };

  // Views
  const Header = () => (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setScreen('welcome')} className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-slate-200 hover:scale-105 transition-transform">B</button>
          <div>
            <h1 className="font-extrabold text-slate-900 tracking-tight leading-none text-sm sm:text-base">Boston Kebab</h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              {isStaffMode ? (
                <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-orange-200">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" /> Staff Mode
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                  <MapPin className="w-2.5 h-2.5" /> {TABLE_ID}
                </div>
              )}
            </div>
          </div>
        </div>

        {screen !== 'welcome' && (
          <div className="flex items-center gap-1 sm:gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`${isStaffMode ? 'text-orange-500 bg-orange-50 ring-2 ring-orange-200' : 'text-slate-400'}`} 
              onClick={() => setIsStaffMode(!isStaffMode)}
              title="Staff Management Mode"
            >
              <Settings2 className="h-5 w-5" />
            </Button>
            
            {!isStaffMode && (
              <>
                <Button variant="ghost" size="icon" onClick={() => setShowAI(true)}>
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                </Button>
                
                <Button variant="outline" size="icon" className="hidden sm:flex" onClick={() => alert("Waiter notified!")}>
                  <Bell className="h-5 w-5 text-slate-400" />
                </Button>
                <Button 
                  variant={cartCount > 0 ? "primary" : "outline"} 
                  size="default" 
                  className="relative px-3 sm:pr-8"
                  onClick={() => setScreen('cart')}
                >
                  <ShoppingCart className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 sm:top-auto sm:right-2 bg-emerald-500 text-white rounded-lg h-5 w-5 flex items-center justify-center text-[10px] font-black border-2 border-white">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 overflow-hidden flex flex-col">
        {screen === 'welcome' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-6 bg-slate-900 text-white px-6 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
               <div className="bg-emerald-500 p-1.5 rounded-lg">
                  <MapPin className="w-4 h-4 text-white" />
               </div>
               <span className="font-black text-sm uppercase tracking-[0.2em]">Serving {TABLE_ID}</span>
            </div>

            <div className="mb-8 relative">
              <div className="w-32 h-32 bg-white rounded-full shadow-2xl flex items-center justify-center animate-float">
                <ChefHat className="h-16 w-16 text-slate-800" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-3 rounded-2xl shadow-lg border-4 border-slate-50">
                <Sparkles className="h-6 w-6" />
              </div>
            </div>
            
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Experience Authentic<br/>Mediterranean Flavors</h2>
            <p className="text-slate-500 max-w-xs mb-10 text-lg">Delicious kebabs, fresh wraps, and traditional mezes delivered directly to <span className="text-slate-900 font-bold underline decoration-emerald-400 underline-offset-4">{TABLE_ID.toLowerCase()}</span>.</p>
            
            <Button variant="primary" size="lg" className="w-full max-w-xs group" onClick={() => setScreen('menu')}>
              Start My Order <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <div className="mt-8 flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              <Info className="h-3 w-3" /> Digital Ordering System
            </div>
          </div>
        )}

        {screen === 'menu' && (
          <div className="flex-1 flex flex-col min-h-0">
            {isStaffMode && (
              <div className="bg-orange-500 text-white px-4 py-3 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-300">
                <Settings2 className="w-5 h-5 animate-spin-slow" />
                <span className="text-xs font-black uppercase tracking-widest text-center">Staff Mode — Tap Toggle button to update availability</span>
              </div>
            )}

            <div className="bg-white border-b border-slate-200 shadow-sm overflow-x-auto no-scrollbar py-6 px-4 shrink-0">
              <div className="max-w-7xl mx-auto flex gap-6 px-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }}
                    className={`flex flex-col items-center gap-3 p-2 min-w-[100px] sm:min-w-[140px] rounded-[2rem] transition-all duration-300 border-2 shrink-0 ${
                      activeCategory === cat.id 
                      ? (isStaffMode ? 'bg-orange-600 border-orange-600' : 'bg-slate-900 border-slate-900') + ' text-white shadow-2xl scale-110 -translate-y-1' 
                      : 'bg-white border-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] overflow-hidden border-2 border-white/20 shadow-md">
                      <img src={cat.image} alt={cat.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wider px-2 pb-1">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 py-4 shrink-0">
               <div className="max-w-7xl mx-auto relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search for shish, falafel, coffee..." 
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-20">
              <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className={`bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col relative ${(!item.isAvailable && !isStaffMode) ? 'cursor-default' : (isStaffMode ? 'cursor-default' : 'cursor-pointer')}`}
                    onClick={() => openDetails(item)}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className={`relative h-56 overflow-hidden transition-all duration-500 ${!item.isAvailable ? 'grayscale opacity-60' : ''}`}>
                      <img src={item.image} alt={item.name} referrerPolicy="no-referrer" onError={handleImageError} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                      
                      {!item.isAvailable && (
                        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center">
                           <div className="bg-white/90 px-6 py-2 rounded-2xl shadow-xl transform rotate-[-5deg] border-2 border-slate-900">
                              <span className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Currently Unavailable</span>
                           </div>
                        </div>
                      )}

                      {item.popular && item.isAvailable && (
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 shadow-sm border border-slate-100">
                          <Sparkles className="h-3 w-3 text-emerald-500" /> Popular
                        </div>
                      )}
                      
                      {!isStaffMode && item.isAvailable && (
                        <div className="absolute bottom-3 right-3 bg-slate-900 text-white px-3 py-1.5 rounded-xl font-bold shadow-lg">
                          ${item.price.toFixed(2)}
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`text-xl font-bold transition-colors ${!item.isAvailable ? 'text-slate-400' : 'text-slate-900 group-hover:text-emerald-600'}`}>
                          {item.name}
                        </h3>
                        {isStaffMode && (
                          <button 
                            onClick={(e) => toggleAvailability(item.id, e)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${item.isAvailable ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-600 ring-1 ring-red-200 hover:bg-red-100'}`}
                          >
                            {item.isAvailable ? <><Eye className="h-3.5 w-3.5" /> Mark Unavailable</> : <><EyeOff className="h-3.5 w-3.5" /> Mark Available</>}
                          </button>
                        )}
                      </div>
                      
                      <p className={`text-sm leading-relaxed mb-6 flex-1 line-clamp-2 ${!item.isAvailable ? 'text-slate-300' : 'text-slate-500'}`}>
                        {item.description}
                      </p>
                      
                      {!isStaffMode ? (
                        <Button 
                          variant={item.isAvailable ? "outline" : "ghost"} 
                          className={`w-full transition-all ${item.isAvailable ? 'group-hover:bg-slate-900 group-hover:text-white' : 'pointer-events-none opacity-40'}`}
                        >
                          {item.isAvailable ? (
                            <>Add to Order <Plus className="ml-2 h-4 w-4" /></>
                          ) : (
                            "Check back soon"
                          )}
                        </Button>
                      ) : (
                        <div className="w-full bg-slate-50 rounded-2xl py-3 flex items-center justify-center gap-2 border border-dashed border-slate-200">
                          <Settings2 className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Management Only</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {screen === 'cart' && (
          <div className="flex-1 flex flex-col min-h-0 bg-white sm:bg-slate-50">
            <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col p-4 sm:p-8">
              <div className="flex items-center justify-between mb-8">
                <button onClick={() => setScreen('menu')} className="flex items-center text-slate-400 hover:text-slate-900 font-bold text-sm uppercase tracking-widest transition-colors">
                  <ChevronLeft className="h-5 w-5 mr-1" /> Back
                </button>
                <h2 className="text-2xl font-black text-slate-900">Your Basket</h2>
                <div className="w-10"></div>
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="bg-slate-100 p-8 rounded-full mb-6">
                    <ShoppingCart className="h-12 w-12 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Basket Empty</h3>
                  <p className="text-slate-500 mb-8">Add something delicious to get started.</p>
                  <Button variant="primary" onClick={() => setScreen('menu')}>Browse Menu</Button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {cart.map((item) => (
                      <div key={item.cartId} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex gap-4 animate-in slide-in-from-right-4">
                        <img src={item.image} referrerPolicy="no-referrer" onError={handleImageError} className="w-24 h-24 rounded-2xl object-cover shrink-0" />
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-slate-900">{item.name}</h4>
                              <span className="font-bold">${(item.totalPrice * item.quantity).toFixed(2)}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(Object.values(item.selectedOptions).flat() as Choice[]).map((o, idx) => (
                                <span key={idx} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">{o.name}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-3">
                              <button onClick={() => openDetails(menuItems.find(mi => mi.id === item.itemId)!, item.cartId)} className="text-xs font-bold text-slate-400 hover:text-slate-900">Edit</button>
                              <button onClick={() => removeItem(item.cartId)} className="text-xs font-bold text-red-400 hover:text-red-600">Remove</button>
                            </div>
                            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-4">
                              <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 hover:bg-white rounded-lg transition-all"><Minus className="h-3 w-3" /></button>
                              <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 hover:bg-white rounded-lg transition-all"><Plus className="h-3 w-3" /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 pt-4 pb-8 border-t border-slate-200">
                    <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                          <ChefHat className="w-32 h-32" />
                       </div>
                       <div className="space-y-4 mb-8">
                          <div className="flex justify-between text-slate-400 font-bold uppercase tracking-widest text-xs">
                             <span>Subtotal</span>
                             <span>${cartTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-end pt-2">
                             <span className="text-xl font-bold">Total Payable</span>
                             <span className="text-4xl font-black tracking-tight">${cartTotal.toFixed(2)}</span>
                          </div>
                       </div>
                       <Button variant="secondary" size="lg" className="w-full h-16 rounded-2xl text-xl font-black group" onClick={() => setScreen('success')}>
                          Place Order <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
                       </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {screen === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-500">
            <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center mb-8 shadow-inner animate-bounce">
              <CheckCircle2 className="h-16 w-16 text-emerald-600" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Order Received!</h2>
            
            <div className="bg-slate-100 px-4 py-1.5 rounded-xl border border-slate-200 mb-6 flex items-center gap-2">
               <MapPin className="w-4 h-4 text-emerald-600" />
               <span className="font-black text-xs uppercase tracking-widest text-slate-600">{TABLE_ID} Order Confirmed</span>
            </div>

            <p className="text-slate-500 mb-10 max-w-xs text-lg">Your items are being prepared. Sit back and relax, your meal will be brought to <span className="font-black text-slate-900">{TABLE_ID}</span> shortly.</p>
            
            <div className="space-y-3 w-full max-w-xs">
               <Button variant="primary" size="lg" className="w-full" onClick={() => setScreen('menu')}>Order More Items</Button>
               <Button variant="outline" size="lg" className="w-full" onClick={() => { setCart([]); setScreen('welcome'); }}>Finished Meal</Button>
            </div>
          </div>
        )}
      </main>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col rounded-t-[40px] sm:rounded-[40px] shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
            {/* Modal Header */}
            <div className={`relative shrink-0 transition-all duration-500 ease-out ${showVideo ? 'h-[45vh] sm:h-[400px]' : 'h-52 sm:h-72'}`}>
               {!showVideo ? (
                 <>
                   <img src={selectedItem.image} referrerPolicy="no-referrer" onError={handleImageError} className={`w-full h-full object-cover transition-opacity duration-500 ${!selectedItem.isAvailable ? 'grayscale opacity-60' : ''}`} />
                   <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                 </>
               ) : (
                 <div className="w-full h-full bg-slate-900 relative flex items-center justify-center overflow-hidden">
                    {videoLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                      </div>
                    )}
                    <video 
                      src={selectedItem.videoUrl} 
                      className="w-full h-full object-cover" 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      onLoadedData={() => setVideoLoading(false)}
                    />
                 </div>
               )}
               
               <button onClick={closeDetails} className="absolute top-4 right-4 bg-black/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/40 transition-colors z-20">
                  <X className="h-6 w-6" />
               </button>

               {/* Video Toggle Button */}
               {selectedItem.videoUrl && (
                  <button 
                    onClick={toggleVideo}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.15)] px-6 py-3 rounded-full flex items-center gap-3 border border-slate-100 hover:scale-105 active:scale-95 transition-all z-20 group"
                  >
                    {showVideo ? (
                      <>
                        <ImageIcon className="h-4 w-4 text-slate-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">Show Photo</span>
                      </>
                    ) : (
                      <>
                        <div className="relative">
                          <PlayCircle className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">Watch Cooking</span>
                      </>
                    )}
                  </button>
               )}
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-24 sm:pb-32 -mt-10 relative z-10 no-scrollbar">
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedItem.name}</h2>
                    <span className="text-emerald-600 font-black text-xl">${selectedItem.price.toFixed(2)}</span>
                  </div>
                  {!selectedItem.isAvailable && (
                    <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-200">Currently Unavailable</span>
                  )}
                </div>
                <p className="text-slate-500 leading-relaxed text-sm sm:text-base">{selectedItem.description}</p>
              </div>

              {/* Options */}
              {selectedItem.options.map(group => (
                <div key={group.id} className="mt-8">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">{group.name}</h4>
                    {group.required ? (
                      <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Required</span>
                    ) : (
                      <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-widest">Optional</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {group.choices.map(choice => {
                      const isSelected = tempOptions[group.id]?.some(c => c.id === choice.id);
                      return (
                        <button
                          key={choice.id}
                          disabled={!selectedItem.isAvailable}
                          onClick={() => handleOptionToggle(group.id, choice, group.type)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                            isSelected 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                          } ${!selectedItem.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="font-bold text-sm sm:text-base">{choice.name}</span>
                          {choice.price > 0 && (
                            <span className={`text-sm font-bold ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>+${choice.price.toFixed(2)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Special Instructions */}
              <div className="mt-8 mb-4">
                 <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px] mb-4 px-2">Special Instructions</h4>
                 <div className="relative">
                    <MessageSquareQuote className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                    <textarea 
                      placeholder="E.g. No onions, extra napkins, allergy notes..."
                      value={tempNotes}
                      disabled={!selectedItem.isAvailable}
                      onChange={(e) => setTempNotes(e.target.value)}
                      className={`w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 min-h-[120px] text-sm focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all resize-none font-medium ${!selectedItem.isAvailable ? 'opacity-50' : ''}`}
                    />
                 </div>
              </div>
              
              <div className="h-10"></div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 bg-white border-t border-slate-100 flex items-center gap-3 sm:gap-4 sticky bottom-0 left-0 right-0 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-20">
              <div className="flex items-center bg-slate-100 rounded-2xl p-1 gap-4 sm:gap-6 px-3 sm:px-4 shrink-0">
                <button 
                  disabled={!selectedItem.isAvailable}
                  onClick={() => setTempQuantity(Math.max(1, tempQuantity - 1))} 
                  className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white transition-all text-slate-600 active:scale-90 disabled:opacity-30"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <span className={`font-black text-lg sm:text-xl w-6 text-center ${!selectedItem.isAvailable ? 'text-slate-400' : 'text-slate-900'}`}>{tempQuantity}</span>
                <button 
                  disabled={!selectedItem.isAvailable}
                  onClick={() => setTempQuantity(tempQuantity + 1)} 
                  className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white transition-all text-slate-600 active:scale-90 disabled:opacity-30"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <Button 
                variant={selectedItem.isAvailable ? "primary" : "ghost"} 
                size="lg" 
                className="flex-1 h-12 sm:h-14 rounded-2xl text-base sm:text-lg font-black shadow-lg shadow-slate-200"
                onClick={confirmAddToCart}
                disabled={isAddButtonDisabled || !selectedItem.isAvailable}
              >
                {!selectedItem.isAvailable ? (
                  "Check back soon"
                ) : (
                  `${editingCartId ? 'Update' : 'Add'} • $${(calculateUnitTotal(selectedItem, tempOptions) * tempQuantity).toFixed(2)}`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant FAB */}
      {screen !== 'welcome' && !isStaffMode && (
        <button 
          onClick={() => setShowAI(true)}
          className="fixed bottom-6 right-6 bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 group border-4 border-white"
        >
          <Sparkles className="h-6 w-6 text-emerald-400 group-hover:rotate-12" />
        </button>
      )}

      {/* AI Chat Drawer */}
      {showAI && <AIChat onClose={() => setShowAI(false)} />}
    </div>
  );
};

export default App;
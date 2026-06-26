import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store/index.js";
import { updateUserLocal } from "../../store/slices/authSlice.js";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBag, 
  Sparkles, 
  MapPin, 
  Mail, 
  Phone, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Lock, 
  Gift, 
  ChevronRight,
  Truck
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance.js";

interface RedeemItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: "apparel" | "gear" | "collectible";
  // Custom renderer for inline SVGs
  renderSvg: (className?: string) => React.JSX.Element;
}

export default function RedeemStore() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [selectedItem, setSelectedItem] = useState<RedeemItem | null>(null);
  const [viewingItem, setViewingItem] = useState<RedeemItem | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Shipping Form State
  const [shippingName, setShippingName] = useState(user?.name || "");
  const [shippingEmail, setShippingEmail] = useState(user?.email || "");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  const items: RedeemItem[] = [
    {
      id: "tshirt",
      name: "Community Hero Premium Tee",
      description: "Pre-shrunk 100% organic cotton crewneck in forest green. Features our signature 3D-embroidered leaf badge and bold modern logo across the chest.",
      cost: 800,
      category: "apparel",
      renderSvg: (className = "") => (
        <svg className={`w-full h-full ${className}`} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Studio Backdrop */}
          <rect width="160" height="160" rx="24" fill="#F8FAFC" />
          <circle cx="80" cy="80" r="50" fill="#E2E8F0" opacity="0.4" />
          {/* T-Shirt Shape */}
          <path d="M40 42 C45 42 52 48 58 48 C65 48 72 42 80 42 C88 42 95 48 102 48 C108 48 115 42 120 42 C124 42 130 46 132 50 L142 74 C143 77 140 80 137 78 L124 72 L124 130 C124 135 120 138 115 138 L45 138 C40 138 36 135 36 130 L36 72 L23 78 C20 80 17 77 18 74 L28 50 C30 46 36 42 40 42 Z" fill="#15803D" stroke="#166534" strokeWidth="3" />
          {/* Sleeve seams */}
          <path d="M44 68 L36 72" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
          <path d="M116 68 L124 72" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
          {/* Collar Detail */}
          <path d="M64 48 C68 53 92 53 96 48" stroke="#166534" strokeWidth="3.5" strokeLinecap="round" />
          {/* Leaf Badge on the Left Chest */}
          <g transform="translate(60, 68) scale(0.65)">
            <rect x="-8" y="-8" width="16" height="16" rx="4" fill="#58CC02" />
            <path d="M-3 2 C1 2 4 -1 4 -4 C4 -4 1 -4 -2 -1 C-3 0 -3 1 -3 2Z" fill="#FFFFFF" />
            <path d="M-4 4 L-2 2" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          {/* Bold Lettering across chest */}
          <text x="80" y="92" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="8.5" textAnchor="middle" letterSpacing="0.5">COMMUNITY</text>
          <text x="80" y="102" fill="#58CC02" fontFamily="sans-serif" fontWeight="900" fontSize="9.5" textAnchor="middle" letterSpacing="1">HERO</text>
          {/* Hanger shadow */}
          <path d="M80 32 C82 32 84 34 84 36 C84 38 80 40 80 40" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: "backpack",
      name: "Hero Explorer Backpack",
      description: "Heavy-duty 900D ballistic nylon bag. Loaded with a padded 16\" laptop slot, hidden anti-theft pocket, and beautiful embroidered metallic badge.",
      cost: 1500,
      category: "gear",
      renderSvg: (className = "") => (
        <svg className={`w-full h-full ${className}`} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="160" rx="24" fill="#F8FAFC" />
          <circle cx="80" cy="80" r="50" fill="#E2E8F0" opacity="0.4" />
          {/* Top Handle */}
          <path d="M65 35 C65 26 95 26 95 35" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
          {/* Main Body */}
          <path d="M45 50 C45 40 115 40 115 50 L120 120 C120 130 110 135 100 135 L60 135 C50 135 40 130 40 120 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
          {/* Side Bottle pocket */}
          <rect x="35" y="85" width="10" height="25" rx="3" fill="#475569" stroke="#0F172A" strokeWidth="2" />
          <path d="M35 88 L45 88" stroke="#0F172A" strokeWidth="2" />
          {/* Outer Zip Compartment */}
          <path d="M50 85 C50 78 110 78 110 85 L110 125 C110 128 107 130 104 130 L56 130 C53 130 50 128 50 125 Z" fill="#334155" stroke="#0F172A" strokeWidth="2.5" />
          {/* Horizontal Zip Line */}
          <line x1="56" y1="92" x2="104" y2="92" stroke="#0F172A" strokeWidth="2" />
          <circle cx="62" cy="92" r="2.5" fill="#58CC02" />
          {/* Community Hero Accent Patch */}
          <rect x="65" y="102" width="30" height="16" rx="4" fill="#58CC02" stroke="#15803D" strokeWidth="1.5" />
          <circle cx="72" cy="110" r="3" fill="#FFFFFF" />
          <text x="84" y="113" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="6.5" textAnchor="middle">HERO</text>
          {/* Top Compress Strap */}
          <path d="M48 60 L112 60" stroke="#58CC02" strokeWidth="2.5" opacity="0.8" />
        </svg>
      )
    },
    {
      id: "cap",
      name: "Civic Guardian Snapback",
      description: "Structured 6-panel streetwear cap with standard plastic adjustable snap. Raised 3D embroidery of the Hero Shield, breathable mesh.",
      cost: 700,
      category: "apparel",
      renderSvg: (className = "") => (
        <svg className={`w-full h-full ${className}`} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="160" rx="24" fill="#F8FAFC" />
          <circle cx="80" cy="80" r="50" fill="#E2E8F0" opacity="0.4" />
          {/* Cap Visor / Brim */}
          <path d="M30 102 C45 116 115 116 130 102 C125 96 35 96 30 102 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
          {/* Visor Stitching */}
          <path d="M38 101 C50 108 110 108 122 101" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
          {/* Cap Crown */}
          <path d="M40 96 C40 45 120 45 120 96 Z" fill="#58CC02" stroke="#166534" strokeWidth="3.5" />
          {/* Crown Seams */}
          <path d="M80 50 L80 96" stroke="#166534" strokeWidth="2" strokeDasharray="2 2" />
          <path d="M80 50 C55 65 45 80 42 96" stroke="#166534" strokeWidth="1.5" opacity="0.6" />
          <path d="M80 50 C105 65 115 80 118 96" stroke="#166534" strokeWidth="1.5" opacity="0.6" />
          {/* Center Button */}
          <circle cx="80" cy="49" r="4.5" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
          {/* Embroidery Emblem Shield */}
          <path d="M80 66 L89 71 L86 81 L80 85 L74 81 L71 71 Z" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />
          {/* Star inside shield */}
          <path d="M80 71 L82 75 L86 75 L83 78 L84 82 L80 80 L76 82 L77 78 L74 75 L78 75 Z" fill="#F59E0B" />
        </svg>
      )
    },
    {
      id: "flask",
      name: "Civic Insulated Flask",
      description: "Professional grade stainless steel water bottle with zero-condensation powder coat. Featuring a leak-proof straw lid and integrated carry clip.",
      cost: 950,
      category: "gear",
      renderSvg: (className = "") => (
        <svg className={`w-full h-full ${className}`} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="160" rx="24" fill="#F8FAFC" />
          <circle cx="80" cy="80" r="50" fill="#E2E8F0" opacity="0.4" />
          {/* Cap loop handle */}
          <path d="M72 32 C72 26 88 26 88 32" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
          {/* Lid */}
          <rect x="66" y="32" width="28" height="12" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="2.5" />
          {/* Neck */}
          <rect x="71" y="44" width="18" height="8" fill="#64748B" stroke="#0F172A" strokeWidth="2" />
          {/* Bottle Body */}
          <path d="M55 58 C55 52 105 52 105 58 L105 130 C105 134 101 138 97 138 L63 138 C59 138 55 134 55 130 Z" fill="#58CC02" stroke="#166534" strokeWidth="3.5" />
          {/* Metallic bottom base */}
          <path d="M55 125 L105 125 L105 130 C105 134 101 138 97 138 L63 138 C59 138 55 134 55 130 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
          {/* Emblem engraving */}
          <g transform="translate(80, 88) scale(1.1)">
            {/* Outline Shield */}
            <path d="M-8 -10 L8 -10 L8 -2 L0 6 L-8 -2 Z" fill="#FFFFFF" opacity="0.9" />
            <path d="M-5 -2 C-1 -2 2 -5 2 -8 C2 -8 -1 -8 -4 -5 C-5 -4 -5 -3 -5 -2Z" fill="#166534" />
          </g>
          <text x="80" y="112" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="7" textAnchor="middle" letterSpacing="0.5">COMMUNITY HERO</text>
        </svg>
      )
    },
    {
      id: "stickers",
      name: "Holographic Emblem Pack",
      description: "Pack of 5 heavy-duty outdoor-rated holographic stickers. Ideal for customizing laptops, skateboards, and helmets with reflective metallic gloss finish.",
      cost: 600,
      category: "collectible",
      renderSvg: (className = "") => (
        <svg className={`w-full h-full ${className}`} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="160" rx="24" fill="#F8FAFC" />
          <circle cx="80" cy="80" r="50" fill="#E2E8F0" opacity="0.4" />
          {/* Overlapping Sticker 1 (Circular) */}
          <g transform="translate(58, 62) rotate(-12)">
            <circle cx="0" cy="0" r="26" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="22" fill="#58CC02" />
            <text x="0" y="3" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="6.5" textAnchor="middle">HERO</text>
          </g>
          {/* Overlapping Sticker 2 (Shield) */}
          <g transform="translate(100, 95) rotate(15)">
            <path d="M-22 -22 L22 -22 L22 -4 L0 18 L-22 -4 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
            <path d="M-18 -18 L18 -18 L18 -4 L0 14 L-18 -4 Z" fill="#F59E0B" />
            <text x="0" y="-3" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="8" textAnchor="middle">CIVIC</text>
          </g>
          {/* Cute Bird Mascot Sticker */}
          <g transform="translate(80, 75) scale(0.9)">
            <circle cx="0" cy="0" r="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="13" fill="#E0F2FE" />
            <path d="M-3 2 C0 2 2 -1 2 -4" fill="none" stroke="#0284C7" strokeWidth="1.5" />
            {/* Tiny Beak */}
            <path d="M-2 -1 L2 -1 L0 3 Z" fill="#F59E0B" />
            {/* Eyes */}
            <circle cx="-4" cy="-3" r="1.5" fill="#1E293B" />
            <circle cx="4" cy="-3" r="1.5" fill="#1E293B" />
          </g>
        </svg>
      )
    }
  ];

  const handleOpenRedeemModal = (item: RedeemItem) => {
    if (!user || user.coins < item.cost) return;
    setSelectedItem(item);
    setRedeemSuccess(null);
    setError(null);
  };

  const handleConfirmRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedItem) return;
    
    if (!shippingName.trim() || !shippingEmail.trim() || !shippingAddress.trim() || !shippingPhone.trim()) {
      setError("Please fill out all shipping details.");
      return;
    }

    setIsRedeeming(true);
    setError(null);

    try {
      const response = await axiosInstance.post(`/users/${user._id}/redeem`, {
        itemId: selectedItem.id,
        itemCost: selectedItem.cost,
        itemName: selectedItem.name,
        shippingDetails: {
          name: shippingName,
          email: shippingEmail,
          phone: shippingPhone,
          address: shippingAddress
        }
      });

      if (response.data?.success) {
        // Update user locally
        dispatch(updateUserLocal(response.data.user));
        setRedeemSuccess(response.data.message);
        // Clean form but keep defaults
        setShippingPhone("");
        setShippingAddress("");
      } else {
        setError(response.data?.message || "Failed to redeem your prize.");
      }
    } catch (err: any) {
      console.error("Redemption error:", err);
      setError(err.response?.data?.message || "An error occurred during redemption. Please try again.");
    } finally {
      setIsRedeeming(false);
    }
  };

  const coinBalance = user?.coins || 0;

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">
      {/* Premium Duolingo/Leetcode Style Header */}
      <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
            <Gift className="w-8 h-8 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">HERO REWARDS DEPOT</h2>
            <p className="text-xs text-gray-400 font-black uppercase tracking-wider">Spend Your Coins on Official Gear</p>
          </div>
        </div>

        {/* Big Balance Card */}
        <div className="bg-yellow-50/50 border-2 border-yellow-200 rounded-2xl px-6 py-3 flex items-center space-x-3 shadow-sm shrink-0">
          <span className="text-3xl animate-pulse">🪙</span>
          <div>
            <div className="text-[10px] text-yellow-700 font-black uppercase tracking-widest">Available Balance</div>
            <div className="text-2xl font-black text-yellow-600 font-mono leading-none">{coinBalance}</div>
          </div>
        </div>
      </div>

      {/* Quick Policy Notice */}
      <div className="bg-emerald-50/60 border border-emerald-150 rounded-2xl p-4 flex items-start space-x-3 text-xs">
        <Truck className="w-5 h-5 text-[#58cc02] shrink-0 mt-0.5" />
        <div className="text-emerald-800 font-semibold leading-relaxed">
          <strong className="font-extrabold uppercase text-[10px] bg-[#58cc02] text-white px-2 py-0.5 rounded-full mr-1.5">Free Global Shipping</strong>
          All physical goods are hand-packaged and shipped free of charge to verified Community Heroes. Orders process within 48 hours. Minimum 600 coins required to redeem.
        </div>
      </div>

      {/* Grid of Redeemable Goods */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const isEligible = coinBalance >= item.cost;
          const progressPercent = Math.min(100, (coinBalance / item.cost) * 100);

          return (
            <div 
              key={item.id}
              className="bg-white border-2 border-gray-150 hover:border-[#58cc02] rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 overflow-hidden relative group"
            >
              {/* Category tag */}
              <div className="absolute top-4 right-4 z-10 pointer-events-none">
                <span className="bg-slate-100/80 backdrop-blur-sm text-slate-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                  {item.category}
                </span>
              </div>

              {/* Clickable Area for Pop-Up Description */}
              <div 
                onClick={() => setViewingItem(item)}
                className="cursor-pointer space-y-4 flex flex-col flex-grow group"
              >
                {/* Vector Artwork Container */}
                <div className="w-full aspect-square max-h-48 rounded-2xl overflow-hidden shadow-inner border border-slate-100 relative group-hover:scale-[1.02] transition-transform duration-200">
                  {item.renderSvg()}
                  <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/95 text-gray-800 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-sm border border-slate-100/80 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <span>Details</span>
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-1.5 flex-grow">
                  <h3 className="font-black text-sm text-gray-800 tracking-tight leading-snug group-hover:text-[#58cc02] transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                  <span className="text-[10px] text-[#58cc02] font-black uppercase tracking-wider flex items-center space-x-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Read Full Details</span>
                    <span>→</span>
                  </span>
                </div>
              </div>

              {/* Progress and Actions */}
              <div className="space-y-3 pt-2 border-t border-gray-50">
                {/* Cost Label */}
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400 uppercase tracking-wider text-[9px]">Redemption Cost</span>
                  <span className="text-yellow-600 font-black font-mono text-sm bg-yellow-50 px-2.5 py-1 rounded-xl border border-yellow-100 flex items-center space-x-1">
                    <span>🪙</span>
                    <span>{item.cost}</span>
                  </span>
                </div>

                {/* Eligibility Progress Indicator */}
                {!isEligible && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-gray-400 font-bold">
                      <span>Redeem Progress</span>
                      <span>{coinBalance} / {item.cost} 🪙</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="h-full bg-yellow-400 rounded-full" 
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Redeem Trigger Button */}
                <button
                  disabled={!isEligible}
                  onClick={() => handleOpenRedeemModal(item)}
                  className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    isEligible 
                      ? "bg-[#58cc02] text-white hover:bg-[#46a302] shadow-md hover:shadow-lg active:translate-y-0.5 cursor-pointer" 
                      : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center justify-center space-x-1.5"
                  }`}
                >
                  {isEligible ? (
                    <span>Redeem Gear</span>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>Need {item.cost - coinBalance} More Coins</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Redemption Form & Success Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border-3 border-gray-200 rounded-3xl w-full max-w-lg shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Gift className="w-5 h-5 text-[#58cc02]" />
                <h3 className="font-black text-sm uppercase tracking-wider text-gray-800">
                  {redeemSuccess ? "Redemption Complete!" : "Verify Shipping Details"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-slate-200 hover:text-gray-700 transition"
              >
                <span className="text-xs font-black uppercase px-2 py-1">Cancel</span>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {redeemSuccess ? (
                // Success State View
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-[#58cc02] rounded-full flex items-center justify-center mx-auto animate-bounce shadow-sm">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-base text-gray-800 uppercase tracking-tight">Order Confirmed!</h4>
                    <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-100 max-w-md mx-auto">
                      {redeemSuccess}
                    </p>
                  </div>
                  {/* Miniature Product Preview */}
                  <div className="w-32 h-32 mx-auto rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
                    {selectedItem.renderSvg()}
                  </div>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                    Deducted {selectedItem.cost} Coins • Tracking code dispatched via email
                  </p>
                </div>
              ) : (
                // Order Form View
                <form onSubmit={handleConfirmRedeem} className="space-y-4">
                  {/* Selected Item Preview Box */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl overflow-hidden shrink-0">
                      {selectedItem.renderSvg()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-gray-500 uppercase tracking-widest">Selected Prize</h4>
                      <h3 className="font-black text-sm text-gray-800 leading-tight mt-0.5">{selectedItem.name}</h3>
                      <span className="inline-block bg-yellow-50 text-yellow-600 border border-yellow-100 text-[10px] font-black font-mono px-2 py-0.5 rounded-md mt-1">
                        Cost: 🪙 {selectedItem.cost} Coins
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-semibold p-3.5 rounded-xl flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="space-y-3.5 text-xs">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Recipient Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={shippingName}
                          onChange={(e) => setShippingName(e.target.value)}
                          placeholder="Your legal name..."
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-150 focus:border-[#58cc02] rounded-xl font-bold text-gray-800 transition outline-none"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Contact Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          required
                          value={shippingEmail}
                          onChange={(e) => setShippingEmail(e.target.value)}
                          placeholder="your.email@example.com..."
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-150 focus:border-[#58cc02] rounded-xl font-bold text-gray-800 transition outline-none"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          required
                          value={shippingPhone}
                          onChange={(e) => setShippingPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-150 focus:border-[#58cc02] rounded-xl font-bold text-gray-800 transition outline-none"
                        />
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Delivery Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                        <textarea
                          required
                          rows={2.5}
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="Street Address, Apartment, City, State, ZIP..."
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-150 focus:border-[#58cc02] rounded-xl font-bold text-gray-800 transition outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isRedeeming}
                      className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      {isRedeeming ? (
                        <span>Processing Order...</span>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>Deduct Coins & Ship Gear</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-slate-50 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="bg-white hover:bg-slate-100 border border-gray-200 text-gray-700 font-black uppercase tracking-widest px-5 py-2.5 rounded-xl text-[10px] transition cursor-pointer"
              >
                {redeemSuccess ? "Back to Depot" : "Nevermind"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Detailed Product Description Pop up Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border-3 border-gray-200 rounded-3xl w-full max-w-md shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Gift className="w-5 h-5 text-[#58cc02]" />
                <span className="bg-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                  {viewingItem.category}
                </span>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-slate-200 hover:text-gray-700 transition"
              >
                <span className="text-xs font-black uppercase px-2 py-1">Close</span>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              {/* Premium artwork view */}
              <div className="w-full aspect-square max-w-[240px] mx-auto rounded-3xl overflow-hidden shadow-md border border-slate-200 relative bg-slate-50">
                {viewingItem.renderSvg("w-full h-full")}
              </div>

              {/* Title & Description */}
              <div className="space-y-3">
                <h3 className="text-lg font-black text-gray-800 tracking-tight leading-snug">
                  {viewingItem.name}
                </h3>
                <p className="text-xs text-gray-600 font-semibold leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {viewingItem.description}
                </p>
              </div>

              {/* Specifications / Detail Tags */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-center">
                  <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Global Shipping</div>
                  <div className="text-xs font-black text-emerald-600 uppercase tracking-wider mt-1">100% Free</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-center">
                  <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Process Time</div>
                  <div className="text-xs font-black text-gray-700 uppercase tracking-wider mt-1">Under 48h</div>
                </div>
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-5 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Cost indicator */}
              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-2xl">🪙</span>
                <div>
                  <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Redemption Cost</div>
                  <div className="text-sm font-black text-yellow-600 font-mono">{viewingItem.cost} Coins</div>
                </div>
              </div>

              {/* Redeem trigger button */}
              <button
                onClick={() => {
                  const isEligible = coinBalance >= viewingItem.cost;
                  if (isEligible) {
                    setSelectedItem(viewingItem);
                    setViewingItem(null);
                  }
                }}
                disabled={coinBalance < viewingItem.cost}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  coinBalance >= viewingItem.cost
                    ? "bg-[#58cc02] text-white hover:bg-[#46a302] shadow-md hover:shadow-lg active:translate-y-0.5 cursor-pointer"
                    : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed flex items-center space-x-1.5"
                }`}
              >
                {coinBalance >= viewingItem.cost ? (
                  <span>Claim Now</span>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Locked</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

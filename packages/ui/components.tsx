import React from 'react';

export const Button = ({ children, onClick, variant = 'primary' }: any) => {
  const base = "px-4 py-2 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all";
  const variants: any = {
    primary: "bg-[#F5A623] text-black hover:bg-[#FF8C00] shadow-[0_0_15px_rgba(245,166,35,0.2)]",
    secondary: "bg-[#1A161C] text-[#F0E8D8] border border-[#2A2430] hover:border-[#F5A623]",
    ghost: "text-[#7A6E80] hover:text-[#F0E8D8]"
  };
  
  return (
    <button className={`${base} ${variants[variant]}`} onClick={onClick}>
      {children}
    </button>
  );
};

export const Panel = ({ title, children, icon: Icon }: any) => (
  <div className="bg-[#0E0B0F] border border-[#2A2430] rounded-xl overflow-hidden flex flex-col">
    <div className="h-10 bg-[#141116] border-b border-[#2A2430] px-3 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-[#F5A623]" />}
      <span className="text-[10px] font-black uppercase tracking-widest text-[#7A6E80]">{title}</span>
    </div>
    <div className="flex-1 overflow-auto p-4">
      {children}
    </div>
  </div>
);

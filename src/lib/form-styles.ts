/**
 * Centralized form styling constants to reduce duplication
 * across form components.
 */

export const FORM_STYLES = {
  input: "bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm",
  label: "text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1",
  select: "w-full bg-zinc-900/50 border-zinc-800 focus:ring-[#0055FF] focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm",
  selectContent: "bg-zinc-900 border-zinc-800 text-white rounded-xl",
  textarea: "bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white rounded-xl px-4 py-3 text-sm",
  grid: "grid grid-cols-1 md:grid-cols-2 gap-6",
  gridThirds: "grid grid-cols-1 md:grid-cols-3 gap-6",
  divider: "h-px bg-zinc-900 w-full",
};

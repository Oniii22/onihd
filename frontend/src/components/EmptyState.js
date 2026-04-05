import { Search } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center" data-testid="empty-state">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5">
        <Search size={24} strokeWidth={2} className="text-gray-300" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 tracking-tight">Cerca una citta</h3>
      <p className="text-sm text-gray-400 mt-2 max-w-[260px] leading-relaxed">
        Inserisci il nome di un comune per vedere i distributori e confrontare i prezzi.
      </p>
    </div>
  );
}

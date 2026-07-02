export default function SuppliersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 rounded-[12px] bg-white/20" />
          <div className="mt-2 h-4 w-32 rounded-[8px] bg-white/10" />
        </div>
        <div className="h-11 w-40 rounded-[20px] bg-white/20" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[20px] border-2 border-black bg-white p-4">
            <div className="space-y-2">
              <div className="h-4 w-40 rounded bg-[#00592B]/20" />
              <div className="h-3 w-56 rounded bg-[#4D8A6B]/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

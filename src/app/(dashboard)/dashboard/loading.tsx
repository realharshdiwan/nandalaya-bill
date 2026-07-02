export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-48 rounded-[12px] bg-white/20" />
        <div className="mt-2 h-4 w-32 rounded-[8px] bg-white/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[20px] border-2 border-black bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-[12px] bg-[#00592B]/20" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-16 rounded bg-[#4D8A6B]/20" />
                <div className="h-5 w-20 rounded bg-[#00592B]/20" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-[20px] border-2 border-black bg-white p-4">
        <div className="h-4 w-40 rounded bg-[#00592B]/20 mb-3" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[12px] border-2 border-black bg-white p-3">
              <div className="h-3 w-12 rounded bg-[#4D8A6B]/20 mb-2" />
              <div className="h-5 w-16 rounded bg-[#00592B]/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

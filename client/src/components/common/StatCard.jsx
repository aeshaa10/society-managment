export default function StatCard({ icon: Icon, label, value, sub, color = 'navy', trend }) {
  const colors = {
    navy: 'bg-blue-900 text-white',
    emerald: 'bg-emerald-600 text-white',
    amber: 'bg-amber-500 text-white',
    purple: 'bg-purple-600 text-white',
    red: 'bg-red-500 text-white',
    indigo: 'bg-indigo-600 text-white',
    cyan: 'bg-cyan-600 text-white',
    slate: 'bg-slate-600 text-white',
  };
  const iconBg = {
    navy: 'bg-blue-800',
    emerald: 'bg-emerald-700',
    amber: 'bg-amber-600',
    purple: 'bg-purple-700',
    red: 'bg-red-600',
    indigo: 'bg-indigo-700',
    cyan: 'bg-cyan-700',
    slate: 'bg-slate-700',
  };

  return (
    <div className={`rounded-xl p-5 shadow-sm ${colors[color]} flex flex-col gap-3 relative overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
      <div className="absolute -right-1 -bottom-6 h-16 w-16 rounded-full bg-white/5" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-medium opacity-80 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconBg[color]}`}>
            <Icon size={20} className="opacity-90" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="text-xs opacity-80 relative z-10">
          <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
          <span className="ml-1">vs last month</span>
        </div>
      )}
    </div>
  );
}

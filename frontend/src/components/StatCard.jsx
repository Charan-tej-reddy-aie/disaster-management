export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass = "bg-blue-100 text-blue-600",
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold text-slate-800">
            {value}
          </h3>

          {subtitle && (
            <p className="mt-2 text-xs text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`rounded-xl p-3 ${iconClass}`}>
          <Icon size={22} />
        </div>

      </div>

    </div>
  );
}
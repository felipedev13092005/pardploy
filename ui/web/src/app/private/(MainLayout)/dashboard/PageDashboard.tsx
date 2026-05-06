export default function PageDashboard() {
  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Panel Principal</h1>
      <p className="mt-2 text-slate-600">Bienvenido de nuevo al sistema.</p>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="h-24 bg-blue-50 border border-blue-100 rounded-lg"></div>
        <div className="h-24 bg-purple-50 border border-purple-100 rounded-lg"></div>
        <div className="h-24 bg-emerald-50 border border-emerald-100 rounded-lg"></div>
      </div>
    </section>
  );
}

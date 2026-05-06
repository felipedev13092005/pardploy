import { Outlet, Link } from "react-router";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100 text-slate-900">
      {/* Sidebar con Tailwind */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6">
        <h2 className="text-xl font-bold mb-6 text-blue-600">Mi App</h2>
        <nav className="space-y-2">
          <Link to="/" className="block p-2 hover:bg-slate-50 rounded">Dashboard</Link>
          <Link to="/ajustes" className="block p-2 hover:bg-slate-50 rounded">Ajustes</Link>
        </nav>
      </aside>

      {/* Contenido Dinámico */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm">
          <Outlet /> {/* <-- Aquí cae el contenido de PageDashboard */}
        </div>
      </main>
    </div>
  );
}

import { Network } from "lucide-react";

export default function PageNetworks() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Network className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Redes</h1>
      </div>
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Redes - En desarrollo
      </div>
    </div>
  );
}
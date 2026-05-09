import { HardDrive } from "lucide-react";

export default function PageVolumes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HardDrive className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Volúmenes</h1>
      </div>
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Volúmenes - En desarrollo
      </div>
    </div>
  );
}
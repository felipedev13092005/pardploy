import { KeyRound } from "lucide-react";

export default function PageSecrets() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <KeyRound className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Secretos</h1>
      </div>
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Secretos - En desarrollo
      </div>
    </div>
  );
}
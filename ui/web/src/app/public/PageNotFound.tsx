import { Link } from "react-router";
import { Button } from "@/shared/ui/components/ui/button";
import { Home, TriangleAlert } from "lucide-react";

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <TriangleAlert className="h-24 w-24 text-destructive" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">404</h1>
        <p className="text-muted-foreground text-lg max-w-md">
          La página que buscas no existe o ha sido movida.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
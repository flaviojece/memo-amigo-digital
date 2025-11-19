import { Link } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 pattern-bg">
      <Card className="card-memo max-w-md w-full">
        <CardContent className="text-center p-8">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-destructive/10 rounded-senior">
              <AlertCircle className="w-16 h-16 text-destructive" />
            </div>
          </div>
          
          <h1 className="text-senior-4xl font-bold text-foreground mb-4">
            404
          </h1>
          
          <p className="text-senior-lg text-muted-foreground mb-8">
            Página não encontrada
          </p>
          
          <p className="text-senior-base text-muted-foreground mb-8">
            A página que você está procurando não existe ou foi movida.
          </p>
          
          <Button asChild size="lg" className="w-full text-senior-lg">
            <Link to="/">
              <Home className="w-6 h-6 mr-3" />
              Voltar para Início
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;

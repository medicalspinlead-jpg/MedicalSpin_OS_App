import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WifiOff } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-muted rounded-full">
              <WifiOff className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Você está offline</CardTitle>
          <CardDescription>
            Não foi possível conectar à internet. Verifique sua conexão e tente novamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>Algumas funcionalidades podem estar limitadas enquanto você estiver offline.</p>
        </CardContent>
      </Card>
    </div>
  )
}

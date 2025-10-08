import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { IconSignature, IconCheck } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"

interface DigitalSignatureProps {
  letterId: string
  onSignatureComplete?: () => void
}

export const DigitalSignature = ({ letterId, onSignatureComplete }: DigitalSignatureProps) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [signatureData, setSignatureData] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsSigning(true)
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSigning) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsSigning(false)
    const canvas = canvasRef.current
    if (canvas) {
      setSignatureData(canvas.toDataURL())
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureData("")
  }

  const handleSignDocument = async () => {
    if (!signatureData) {
      toast({
        title: "Error",
        description: "Please provide a signature first",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-digital-signature', {
        body: {
          letter_id: letterId,
          signature_data: signatureData
        }
      })

      if (error) throw error

      toast({
        title: "Document Signed",
        description: "Your signature has been applied successfully (UAE compliant)",
      })

      onSignatureComplete?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconSignature className="h-5 w-5" />
          Digital Signature
        </CardTitle>
        <CardDescription>
          Sign your legal document with a UAE-compliant digital signature
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Badge variant="outline">
            <IconCheck className="h-3 w-3 mr-1" />
            UAE Federal Law Decree No. 46/2021 Compliant
          </Badge>
        </div>

        <div className="border-2 border-dashed rounded-lg p-4">
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="border rounded cursor-crosshair bg-background w-full"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={clearSignature}>
            Clear
          </Button>
          <Button onClick={handleSignDocument} disabled={loading || !signatureData}>
            {loading ? "Signing..." : "Sign Document"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          By signing, you certify that this signature is legally binding and complies with UAE digital signature regulations.
          Your signature will be cryptographically hashed for verification purposes.
        </p>
      </CardContent>
    </Card>
  )
}
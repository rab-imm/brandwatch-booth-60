import { Header } from "@/components/Header"
import { OCRUpload } from "@/components/OCRUpload"
import { OCRHistory } from "@/components/OCRHistory"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const OCRPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">OCR Document Scanner</h1>
          <p className="text-muted-foreground">
            Extract text from PDFs and images using AI-powered OCR technology
          </p>
        </div>

        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="scan">Scan Document</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="mt-6">
            <OCRUpload />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <OCRHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default OCRPage

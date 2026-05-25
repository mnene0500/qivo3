
"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCcw, Home } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application Error Logged:", error)
  }, [error])

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-8 text-center select-none">
      <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      
      <div className="space-y-2 mb-10">
        <h1 className="text-2xl font-black text-black tracking-tight uppercase">System Error</h1>
        <div className="bg-gray-50 p-4 rounded-2xl border border-red-100 max-w-sm mx-auto">
          <p className="text-[10px] font-mono font-bold text-red-600 break-words text-left">
            {error.message || "An unexpected client-side exception occurred."}
          </p>
          {error.digest && (
            <p className="text-[8px] font-mono text-gray-400 mt-2">Digest: {error.digest}</p>
          )}
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <Button 
          onClick={() => reset()}
          className="w-full h-14 rounded-full bg-black text-white font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
        >
          <div className="flex items-center gap-2">
            <RefreshCcw className="w-4 h-4" />
            Try to Recover
          </div>
        </Button>
        
        <Button 
          variant="ghost" 
          onClick={() => window.location.href = '/'}
          className="w-full h-12 text-[10px] font-black text-gray-400 uppercase tracking-widest"
        >
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </div>
        </Button>
      </div>

      <p className="fixed bottom-10 text-[9px] font-bold text-gray-300 uppercase tracking-[0.3em]">
        QIVO Engine v1.2.1
      </p>
    </div>
  )
}

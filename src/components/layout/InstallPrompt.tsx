"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Download } from "lucide-react"

/**
 * @fileOverview A non-intrusive PWA install prompt.
 */
export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (!sessionStorage.getItem('install_prompt_dismissed')) {
        setShow(true)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    sessionStorage.setItem('install_prompt_dismissed', 'true')
  }

  if (!show) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white border rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00A2FF] rounded-xl flex items-center justify-center text-white shadow-lg">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-black uppercase tracking-tight">MatchFlow App</p>
            <p className="text-[10px] text-gray-400 font-medium">Add to home screen for faster access</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={handleInstall} 
            className="rounded-full bg-[#00A2FF] h-8 text-[10px] font-bold uppercase tracking-widest px-4 shadow-lg shadow-blue-100"
          >
            Install
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDismiss} 
            className="rounded-full h-8 w-8 text-gray-300 hover:text-black"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
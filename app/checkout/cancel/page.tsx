"use client"

import { XCircle, MessageSquare, ArrowLeft } from "lucide-react"

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Cancel Icon */}
        <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-orange-400" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          Payment Cancelled
        </h1>

        <p className="text-white/60 mb-8">
          No worries! Your payment was not processed. The reservation is still available if you'd like to complete it.
        </p>

        {/* Options */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-8 text-left">
          <h2 className="font-semibold text-white mb-4">What would you like to do?</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#375DEE]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <ArrowLeft className="w-4 h-4 text-[#375DEE]" />
              </div>
              <div>
                <p className="font-medium text-white">Go Back</p>
                <p className="text-sm text-white/50">Close this page to return to your conversation</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#375DEE]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-[#375DEE]" />
              </div>
              <div>
                <p className="font-medium text-white">Text Us</p>
                <p className="text-sm text-white/50">Reply to our messages if you have questions or want a new link</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-white/40 text-sm">
          Changed your mind? Just text us and we can send you a new payment link anytime.
        </p>
      </div>
    </div>
  )
}

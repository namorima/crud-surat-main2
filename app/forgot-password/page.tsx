"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthMark, AuthScreen, authCardClass } from "@/components/auth/AuthScreen"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!email) {
      setError("Sila masukkan alamat email anda.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email")
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Gagal menghantar email. Sila cuba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScreen>
      <Card className={authCardClass}>
        <CardHeader className="space-y-1.5 p-0 pb-6">
          <div className="mb-3.5"><AuthMark /></div>
          <CardTitle className="text-title-2-medium text-text-primary">Lupa Kata Laluan</CardTitle>
          <CardDescription>
            Masukkan alamat email anda dan kami akan hantar pautan untuk reset kata laluan.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {success ? (
            <div className="space-y-4">
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700">
                  Jika email itu berdaftar, pautan reset kata laluan telah dihantar. Sila semak inbox anda. Pautan sah selama 1 jam.
                </AlertDescription>
              </Alert>
              <div className="text-center text-sm text-text-secondary">
                Tidak terima email? Semak folder spam atau cuba lagi dalam beberapa minit.
              </div>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Kembali ke Log Masuk
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contoh@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-text-secondary">
                    Masukkan email yang didaftarkan dengan akaun anda. Jika akaun anda belum ada email, hubungi pentadbir.
                  </p>
                </div>

                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? "Menghantar..." : "Hantar Email Reset"}
                </Button>

                <div className="text-center">
                  <Link href="/login" className="text-sm text-accent-600 hover:underline dark:text-accent-400">
                    Kembali ke Log Masuk
                  </Link>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </AuthScreen>
  )
}

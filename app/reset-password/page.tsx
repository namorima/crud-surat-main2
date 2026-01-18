"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Get token from URL hash (Supabase sends it in hash)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    
    if (accessToken) {
      setToken(accessToken)
    } else {
      setError("Link reset password tidak sah atau telah tamat tempoh.")
    }
  }, [])

  // Password validation
  const passwordValidation = {
    minLength: newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasLowerCase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    passwordsMatch: newPassword === confirmPassword && newPassword !== "",
  }

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!token) {
      setError("Token tidak sah. Sila minta reset password semula.")
      return
    }

    if (!isPasswordValid) {
      setError("Sila pastikan kata laluan memenuhi semua keperluan.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      setSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err: any) {
      setError(err.message || "Gagal reset kata laluan. Sila cuba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset Kata Laluan</CardTitle>
          <CardDescription>
            Masukkan kata laluan baru anda untuk akaun anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700">
                  Kata laluan berjaya di-reset! Anda akan diarahkan ke halaman log masuk...
                </AlertDescription>
              </Alert>
              <Link href="/login">
                <Button className="w-full">
                  Pergi ke Log Masuk
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

              {!token ? (
                <div className="text-center">
                  <p className="mb-4 text-sm text-gray-600">
                    Link reset password tidak sah atau telah tamat tempoh.
                  </p>
                  <Link href="/forgot-password">
                    <Button variant="outline" className="w-full">
                      Minta Reset Password Semula
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Kata Laluan Baru</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Masukkan kata laluan baru"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={newPassword} />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Sahkan Kata Laluan</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Masukkan semula kata laluan baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Password Requirements */}
                  <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                    <p className="font-medium text-gray-700">Keperluan Kata Laluan:</p>
                    <ul className="space-y-1">
                      <li className={passwordValidation.minLength ? "text-green-600" : "text-gray-600"}>
                        {passwordValidation.minLength ? "✓" : "○"} Minimum 8 aksara
                      </li>
                      <li className={passwordValidation.hasUpperCase ? "text-green-600" : "text-gray-600"}>
                        {passwordValidation.hasUpperCase ? "✓" : "○"} Mengandungi huruf besar
                      </li>
                      <li className={passwordValidation.hasLowerCase ? "text-green-600" : "text-gray-600"}>
                        {passwordValidation.hasLowerCase ? "✓" : "○"} Mengandungi huruf kecil
                      </li>
                      <li className={passwordValidation.hasNumber ? "text-green-600" : "text-gray-600"}>
                        {passwordValidation.hasNumber ? "✓" : "○"} Mengandungi nombor
                      </li>
                      <li className={passwordValidation.passwordsMatch ? "text-green-600" : "text-gray-600"}>
                        {passwordValidation.passwordsMatch ? "✓" : "○"} Kata laluan sepadan
                      </li>
                    </ul>
                  </div>

                  <Button className="w-full" type="submit" disabled={loading || !isPasswordValid}>
                    {loading ? "Mereset Kata Laluan..." : "Reset Kata Laluan"}
                  </Button>

                  <div className="text-center">
                    <Link href="/login" className="text-sm text-blue-600 hover:underline">
                      Kembali ke Log Masuk
                    </Link>
                  </div>
                </form>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

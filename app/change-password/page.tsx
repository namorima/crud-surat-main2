"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthMark, AuthScreen, authCardClass } from "@/components/auth/AuthScreen"
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator"
import { useAuth } from "@/lib/auth-provider"
import { useRouter } from "next/navigation"

export default function ChangePasswordPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [email, setEmail] = useState(user?.email || "")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const isFirstTimeLogin = user?.must_change_password && !user?.is_password_changed
  const needsEmail = isFirstTimeLogin && !user?.email

  // Password validation
  const passwordValidation = {
    minLength: newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasLowerCase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    notSameAsUsername: newPassword !== user?.id && newPassword !== user?.username,
    passwordsMatch: newPassword === confirmPassword && newPassword !== "",
  }

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    // Validation
    if (!isPasswordValid) {
      setError("Sila pastikan kata laluan memenuhi semua keperluan.")
      return
    }

    if (needsEmail && !email) {
      setError("Email diperlukan untuk password recovery.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: isFirstTimeLogin ? user?.username : currentPassword,
          newPassword,
          email: needsEmail ? email : undefined,
          userId: user?.id,
          isFirstTime: isFirstTimeLogin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password")
      }

      setSuccess(true)

      // Logout and redirect to login after 2 seconds
      setTimeout(() => {
        logout()
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Gagal menukar kata laluan. Sila cuba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScreen>
      <Card className={authCardClass}>
        <CardHeader className="space-y-1.5 p-0 pb-6">
          <div className="mb-3.5"><AuthMark /></div>
          <CardTitle className="text-title-2-medium text-text-primary">
            {isFirstTimeLogin ? "Tukar Kata Laluan - Login Pertama" : "Tukar Kata Laluan"}
          </CardTitle>
          <CardDescription>
            {isFirstTimeLogin
              ? "Untuk keselamatan akaun anda, sila tukar kata laluan dan masukkan email anda."
              : "Tukar kata laluan anda untuk keselamatan yang lebih baik."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {success && (
            <Alert className="mb-4 border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                Kata laluan berjaya ditukar! Anda akan dilog keluar untuk log masuk semula dengan kata laluan baru.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password - only if not first time */}
            {!isFirstTimeLogin && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Kata Laluan Semasa</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Masukkan kata laluan semasa"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading || success}
                />
              </div>
            )}

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
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-icon-secondary hover:text-foreground-icon-primary"
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
                disabled={loading || success}
              />
            </div>

            {/* Email - mandatory if first time and no email */}
            {needsEmail && (
              <div className="space-y-2">
                <Label htmlFor="email">Email (untuk password recovery)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contoh@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || success}
                />
                <p className="text-xs text-text-secondary">
                  Email akan digunakan untuk reset password jika anda terlupa.
                </p>
              </div>
            )}

            {/* Password Requirements */}
            <div className="space-y-2 rounded-md border border-border-button-default bg-background-secondary-default p-3 text-sm">
              <p className="font-medium text-text-secondary">Keperluan Kata Laluan:</p>
              <ul className="space-y-1">
                <li className={passwordValidation.minLength ? "text-green-600" : "text-text-secondary"}>
                  {passwordValidation.minLength ? "✓" : "○"} Minimum 8 aksara
                </li>
                <li className={passwordValidation.hasUpperCase ? "text-green-600" : "text-text-secondary"}>
                  {passwordValidation.hasUpperCase ? "✓" : "○"} Mengandungi huruf besar
                </li>
                <li className={passwordValidation.hasLowerCase ? "text-green-600" : "text-text-secondary"}>
                  {passwordValidation.hasLowerCase ? "✓" : "○"} Mengandungi huruf kecil
                </li>
                <li className={passwordValidation.hasNumber ? "text-green-600" : "text-text-secondary"}>
                  {passwordValidation.hasNumber ? "✓" : "○"} Mengandungi nombor
                </li>
                <li className={passwordValidation.notSameAsUsername ? "text-green-600" : "text-text-secondary"}>
                  {passwordValidation.notSameAsUsername ? "✓" : "○"} Berbeza dari ID pengguna
                </li>
                <li className={passwordValidation.passwordsMatch ? "text-green-600" : "text-text-secondary"}>
                  {passwordValidation.passwordsMatch ? "✓" : "○"} Kata laluan sepadan
                </li>
              </ul>
            </div>

            <Button className="w-full" type="submit" disabled={loading || !isPasswordValid || success}>
              {loading ? "Menukar Kata Laluan..." : "Tukar Kata Laluan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthScreen>
  )
}

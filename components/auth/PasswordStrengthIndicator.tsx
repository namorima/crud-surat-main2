"use client"

interface PasswordStrengthIndicatorProps {
  password: string
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const calculateStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0

    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++

    if (score <= 2) return { score, label: "Lemah", color: "bg-red-500" }
    if (score <= 4) return { score, label: "Sederhana", color: "bg-yellow-500" }
    return { score, label: "Kuat", color: "bg-green-500" }
  }

  if (!password) return null

  const strength = calculateStrength(password)
  const widthPercentage = (strength.score / 6) * 100

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">Kekuatan Kata Laluan:</span>
        <span className={`font-medium ${
          strength.label === "Kuat" ? "text-green-600" :
          strength.label === "Sederhana" ? "text-yellow-600" :
          "text-red-600"
        }`}>
          {strength.label}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all duration-300 ${strength.color}`}
          style={{ width: `${widthPercentage}%` }}
        />
      </div>
    </div>
  )
}

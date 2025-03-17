"use client"

import type React from "react"

import { useEffect, useState } from "react"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = () => {
      setHasError(true)
    }

    window.addEventListener("error", handleError)

    return () => {
      window.removeEventListener("error", handleError)
    }
  }, [])

  useEffect(() => {
    if (hasError) {
      // Recargar el componente después de un error
      setHasError(false)

      // Pequeño retraso para asegurar que React termine su ciclo actual
      const timer = setTimeout(() => {
        window.location.reload()
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [hasError])

  return <>{children}</>
}


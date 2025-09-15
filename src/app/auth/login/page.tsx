import LoginForm from '@/components/auth/LoginForm'
import React, { Suspense } from 'react'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm/>
    </Suspense>
  )
}

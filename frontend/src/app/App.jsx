import React from 'react'
import { RouterProvider } from "react-router-dom"
import { router } from "./app.routes.jsx"
import { useAuth } from "../features/auth/hook/useAuth.js"
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast';

const App = () => {

  const auth = useAuth()

  useEffect(() => {
    auth.handleGetMe()
  }, []);

  return (
    <>
      <Toaster position="top-right" />
      <RouterProvider router={router} />
    </>
  )
}

export default App
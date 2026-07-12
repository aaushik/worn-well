import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ConnectedApp } from './ConnectedApp'

const convexUrl = import.meta.env.VITE_CONVEX_URL
if (!convexUrl) throw new Error('VITE_CONVEX_URL is not configured')
const convex = new ConvexReactClient(convexUrl)

createRoot(document.getElementById('root')!).render(
  <StrictMode><ConvexProvider client={convex}><ConnectedApp /></ConvexProvider></StrictMode>,
)

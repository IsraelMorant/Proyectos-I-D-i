import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'

import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'

import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Wallet from './pages/Wallet'
import Inventory from './pages/Inventory'
import PublishPiece from './pages/PublishPiece'
import SearchPiece from './pages/SearchPiece'
import { MatchesList, MatchDetail } from './pages/MatchDetail'

function SearchRoute() {
  const { openSearchPieceModal } = useApp()

  useEffect(() => {
    openSearchPieceModal()
  }, [openSearchPieceModal])

  return <Products />
}

export default function App() {
  const { isAuth, authReady } = useApp()
if (!authReady) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      Cargando sesión...
    </div>
  )
}
  if (!isAuth) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/recuperar" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/productos" element={<Products />} />
      <Route path="/productos/:id" element={<ProductDetail />} />
      <Route path="/chat/:matchId" element={<Chat />} />
      <Route path="/perfil" element={<Profile />} />
      <Route path="/billetera" element={<Wallet />} />
      <Route path="/inventario" element={<Inventory />} />
      <Route path="/matches" element={<MatchesList />} />
      <Route path="/match/:id" element={<MatchDetail />} />

      <Route path="/publicar" element={<PublishPiece />} />
      <Route
        path="/publicar-pieza"
        element={<Navigate to="/publicar" replace />}
      />

      <Route path="/buscar-pieza" element={<SearchRoute />} />
      <Route path="/buscar" element={<SearchPiece />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
import Navbar from './Navbar'
import ChatWidget from './ChatWidget'
import AddProductModal from './AddProductModal'
import BuyTokensModal from './BuyTokensModal'
import SearchPieceModal from './SearchPieceModal'
import RatingModal from './RatingModal'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-brand-bg">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
      <ChatWidget />
      <AddProductModal />
      <BuyTokensModal />
      <SearchPieceModal />
      <RatingModal />
    </div>
  )
}
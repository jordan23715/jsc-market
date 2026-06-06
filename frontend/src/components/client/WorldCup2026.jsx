import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import api from '../../services/api'
import SEO from '../common/SEO'
import ProductCard from '../common/ProductCard'
import useCartStore from '../../context/CartContext'
import { getImageUrl } from '../../services/api'

const SWIPER_BP = {
  0:    { slidesPerView: 2, spaceBetween: 8 },
  480:  { slidesPerView: 2, spaceBetween: 10 },
  640:  { slidesPerView: 3, spaceBetween: 12 },
  1024: { slidesPerView: 5, spaceBetween: 16 },
}

const DEFAULT_CFG = {
  seo: {
    title: 'Coupe du Monde 2026 | Meilleures Offres Tech & Électro — JSC-Market',
    description: 'JSC-Market vous prépare pour la Coupe du Monde 2026 ! TV 4K, smartphones, audio : les meilleures offres tech au Cameroun pendant le Mondial.',
    keywords: 'coupe du monde 2026, mondial 2026 cameroun, TV 4K, smartphone cameroun, offres world cup, JSC-Market',
  },
  hero: {
    titre: '🏆 Coupe du Monde 2026',
    sousTitre: 'Vivez chaque match en grand ! Les meilleures offres tech pour les fans de foot au Cameroun',
    boutonTexte: '🛒 Voir toutes les offres',
    boutonLien: '/products',
    bgColor: '#0d3b6e',
    image: '',
    countdownDate: '2026-07-19T18:00:00',
  },
  sections: [
    { id: 'tvs',        titre: '📺 Télévisions 4K — Vivez le match en grand !',  categories: ['Télévisions'],     limit: 8, color: '#0d3b6e', visible: true },
    { id: 'phones',     titre: '📱 Smartphones — Restez connecté au Mondial',     categories: ['Smartphones'],     limit: 8, color: '#c41e3a', visible: true },
    { id: 'audio',      titre: '🎧 Audio & Son — L\'ambiance du stade',           categories: ['Audio'],           limit: 8, color: '#1a6e3a', visible: true },
    { id: 'gaming',     titre: '🎮 Gaming — Vivez le foot en jeu vidéo',          categories: ['Consoles & Jeux'], limit: 8, color: '#6e1a6e', visible: true },
    { id: 'appliances', titre: '🔌 Électroménager — Préparez votre salon',        categories: ['Électroménager'],  limit: 8, color: '#6e3a0d', visible: true },
  ],
  promo: { visible: true, titre: '🔥 Offres Spéciales Coupe du Monde 2026', categories: [], limit: 8 },
  bannersExtra: [],
  categoryCards: {
    visible: true,
    titre: '🏟️ Nos sélections pour le Mondial',
    items: [
      { titre: 'Télévisions', image: '', lien: '/products?categorie=Télévisions', bgFrom: '#4c1d95', bgTo: '#c41e3a', bouton: "J'achète" },
      { titre: 'Smartphones', image: '', lien: '/products?categorie=Smartphones', bgFrom: '#1a3a6e', bgTo: '#1a6e3a', bouton: "J'achète" },
      { titre: 'Audio & Son', image: '', lien: '/products?categorie=Audio',        bgFrom: '#6e1a1a', bgTo: '#c47a1a', bouton: "J'achète" },
      { titre: 'Gaming',      image: '', lien: '/products?categorie=Consoles & Jeux', bgFrom: '#1a4e1a', bgTo: '#6e1a8e', bouton: "J'achète" },
    ],
  },
}

/* ── Carousel section ── */
function SectionCarousel({ section, products, loading }) {
  if (!section.visible) return null
  return (
    <section>
      <div className="text-white px-4 py-3 rounded-t-xl flex items-center justify-between" style={{ backgroundColor: section.color || '#0d3b6e' }}>
        <h2 className="font-bold text-sm sm:text-base md:text-lg">{section.titre}</h2>
        <Link to={`/products?categorie=${encodeURIComponent(section.categories?.[0] || '')}`} className="text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition whitespace-nowrap">
          Voir plus →
        </Link>
      </div>
      <div className="bg-white rounded-b-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex gap-2 p-3">{[...Array(4)].map((_, i) => (
            <div key={i} className="flex-1 animate-pulse">
              <div className="bg-gray-200 rounded-lg" style={{ paddingTop: '75%' }} />
              <div className="p-2 space-y-1.5"><div className="h-2 bg-gray-200 rounded w-3/4" /><div className="h-6 bg-gray-200 rounded" /></div>
            </div>
          ))}</div>
        ) : (
          <Swiper breakpoints={SWIPER_BP} navigation pagination={{ clickable: true }} modules={[Navigation, Pagination]} className="p-3 pb-8" style={{ '--swiper-navigation-size': '28px', '--swiper-navigation-color': section.color }}>
            {products.map(p => <SwiperSlide key={p._id} className="h-auto"><ProductCard product={p} compact /></SwiperSlide>)}
            {!products.length && <SwiperSlide><p className="text-center text-gray-400 py-8 text-sm">Aucun produit</p></SwiperSlide>}
          </Swiper>
        )}
      </div>
    </section>
  )
}

/* ── Promo mini-card ── */
function PromoCard({ product }) {
  const { addItem } = useCartStore()
  const prix = product.prixPromo ?? product.prix
  const remise = product.prixPromo ? Math.round(((product.prix - product.prixPromo) / product.prix) * 100) : 0
  const img = product.images?.[0]?.startsWith('http') ? product.images[0] : getImageUrl(product.images?.[0])
  return (
    <Link to={`/products/${product.slug || product._id}`} className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-orange-300 hover:shadow-md transition-all flex flex-col">
      <div className="relative bg-white overflow-hidden" style={{ paddingTop: '70%' }}>
        <img src={img || 'https://via.placeholder.com/300x210'} alt={product.nom} className="absolute inset-0 w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300" loading="lazy" onError={e => { e.target.src = 'https://via.placeholder.com/300x210' }} />
        {remise > 0 && <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">-{remise}%</span>}
      </div>
      <div className="p-2 flex flex-col flex-1">
        <p className="text-xs text-gray-400 truncate">{product.marque}</p>
        <p className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 flex-1 leading-tight mt-0.5">{product.nom}</p>
        <div className="mt-1.5">
          <p className="text-sm font-bold text-orange-500">{prix.toLocaleString('fr-FR')} F</p>
          {remise > 0 && <p className="text-xs text-gray-400 line-through">{product.prix.toLocaleString('fr-FR')} F</p>}
        </div>
        <button onClick={e => { e.preventDefault(); e.stopPropagation(); addItem(product) }} disabled={product.stock === 0} className="mt-2 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white text-xs font-bold py-1.5 rounded-lg transition-colors">
          {product.stock === 0 ? 'Épuisé' : 'ACHETER'}
        </button>
      </div>
    </Link>
  )
}

/* ════════════ MAIN COMPONENT ════════════ */
export default function WorldCup2026() {
  const [cfg, setCfg]                = useState(DEFAULT_CFG)
  const [sectionData, setSectionData] = useState({})
  const [promos, setPromos]           = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const cfgRes = await api.get('/admin/public/event-pages/world-cup-2026').catch(() => ({ data: { data: null } }))
      const config = cfgRes.data.data || DEFAULT_CFG
      setCfg(config)

      const sections = config.sections || DEFAULT_CFG.sections
      const promo    = config.promo    || DEFAULT_CFG.promo

      const results = await Promise.all(sections.filter(s => s.visible).map(async s => {
        const cats = s.categories || []
        if (!cats.length) return { id: s.id, products: [] }
        const reqs = await Promise.all(cats.map(c => api.get('/products', { params: { categorie: c, limit: s.limit || 8, sort: '-createdAt' } })))
        const all = reqs.flatMap(r => r.data.data.products || [])
        const map = new Map(); all.forEach(p => map.set(String(p._id), p))
        return { id: s.id, products: [...map.values()].slice(0, s.limit || 8) }
      }))
      const dataMap = {}; results.forEach(r => { dataMap[r.id] = r.products })
      setSectionData(dataMap)

      const promoCats = promo.categories || []
      let promoProducts = []
      if (promoCats.length) {
        const rr = await Promise.all(promoCats.map(c => api.get('/products', { params: { categorie: c, limit: 20, sort: '-createdAt' } })))
        promoProducts = rr.flatMap(r => r.data.data.products || [])
      } else {
        const rr = await api.get('/products', { params: { limit: 20, sort: '-createdAt' } })
        promoProducts = rr.data.data.products || []
      }
      setPromos(promoProducts.filter(p => p.prixPromo).slice(0, promo.limit || 8))
    } catch (e) {
      console.error('WorldCup load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const hero   = cfg.hero   || DEFAULT_CFG.hero
  const seo    = cfg.seo    || DEFAULT_CFG.seo
  const catCards = cfg.categoryCards || DEFAULT_CFG.categoryCards
  const banners  = (cfg.bannersExtra || []).filter(b => b.image)

  return (
    <div className="min-h-screen bg-gray-100">
      <SEO title={seo.title} description={seo.description} keywords={seo.keywords} image={seo.image} url="/world-cup-2026" />

      <div className="container-custom py-3 sm:py-4 space-y-5 sm:space-y-6">

        {/* ── HERO ── */}
        <section
          className="rounded-2xl overflow-hidden relative"
          style={{
            background: hero.image
              ? `url(${hero.image}) center/cover no-repeat`
              : `linear-gradient(135deg, ${hero.bgColor || '#0d3b6e'} 0%, #1a6e3a 50%, #c41e3a 100%)`
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 px-4 sm:px-8 py-10 sm:py-16 text-center text-white">
            <div className="text-4xl sm:text-5xl mb-3 select-none">⚽ 🏆 ⚽</div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight drop-shadow mb-2">{hero.titre}</h1>
            <p className="text-sm sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-4 leading-relaxed">{hero.sousTitre}</p>
            {hero.countdownDate && (
              <div className="flex flex-col items-center mb-6">
                <p className="text-xs text-white/70 mb-2 uppercase tracking-widest">Début du Mondial dans</p>
                <CountdownBig endDate={new Date(hero.countdownDate)} />
              </div>
            )}
            <Link to={hero.boutonLien || '/products'} className="inline-block bg-orange-500 hover:bg-orange-400 text-white font-black px-8 py-3 rounded-full text-sm sm:text-base shadow-lg hover:shadow-orange-500/40 transition-all">
              {hero.boutonTexte}
            </Link>
            <div className="flex justify-center gap-1 mt-6">
              <div className="h-1 w-16 rounded-full bg-green-500" />
              <div className="h-1 w-16 rounded-full bg-red-500" />
              <div className="h-1 w-16 rounded-full bg-yellow-400" />
            </div>
          </div>
        </section>

        {/* ── BANNIÈRES PRODUITS — grille 2 col, ratio naturel ── */}
        {banners.length > 0 && (
          <section>
            <div className={`grid gap-3 ${banners.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {banners.map((b, i) => (
                <Link key={i} to={b.lien || '/products'} className="block rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  {/* Image s'adapte au format naturel — pas de hauteur fixe */}
                  <img
                    src={b.image}
                    alt={b.titre || `Bannière ${i + 1}`}
                    className="w-full h-auto block hover:opacity-95 transition-opacity"
                    loading="lazy"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── CARTES CATÉGORIES (type "L'installation ultime du fan") ── */}
        {catCards?.visible !== false && catCards?.items?.length > 0 && (
          <section>
            <div className="bg-orange-500 text-white px-4 py-2.5 rounded-t-xl">
              <h2 className="font-bold text-sm sm:text-base">{catCards.titre}</h2>
            </div>
            <div className="bg-white rounded-b-xl shadow-sm p-3">
              <div className={`grid gap-3 ${
                catCards.items.length <= 2 ? 'grid-cols-2' :
                catCards.items.length === 3 ? 'grid-cols-3' :
                'grid-cols-2 sm:grid-cols-4'
              }`}>
                {catCards.items.map((card, i) => (
                  <Link
                    key={i}
                    to={card.lien || '/products'}
                    className="group rounded-2xl overflow-hidden flex flex-col hover:scale-[1.02] transition-transform shadow"
                    style={{ background: `linear-gradient(145deg, ${card.bgFrom || '#4c1d95'}, ${card.bgTo || '#c41e3a'})` }}
                  >
                    {/* Image ou placeholder TV icon */}
                    <div className="flex-1 flex items-center justify-center p-3 min-h-[100px] sm:min-h-[130px]">
                      {card.image ? (
                        <img
                          src={card.image}
                          alt={card.titre}
                          className="w-full h-auto max-h-32 object-contain drop-shadow-lg"
                          loading="lazy"
                          onError={e => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        /* Icône TV SVG inline quand pas d'image */
                        <svg viewBox="0 0 80 60" className="w-16 h-16 sm:w-20 sm:h-20 opacity-30" fill="white">
                          <rect x="5" y="5" width="70" height="45" rx="4" fill="none" stroke="white" strokeWidth="3"/>
                          <rect x="15" y="50" width="50" height="5" rx="2" fill="white"/>
                          <line x1="20" y1="55" x2="30" y2="55" stroke="white" strokeWidth="3"/>
                          <line x1="50" y1="55" x2="60" y2="55" stroke="white" strokeWidth="3"/>
                          <circle cx="40" cy="27" r="10" fill="none" stroke="white" strokeWidth="2"/>
                          <line x1="34" y1="18" x2="28" y2="10" stroke="white" strokeWidth="2"/>
                          <line x1="46" y1="18" x2="52" y2="10" stroke="white" strokeWidth="2"/>
                        </svg>
                      )}
                    </div>
                    {/* Label + CTA */}
                    <div className="px-3 pb-3 text-center">
                      <p className="text-white font-bold text-sm sm:text-base leading-tight mb-2">{card.titre}</p>
                      <span className="inline-block bg-black text-white text-xs font-bold px-4 py-1.5 rounded-full group-hover:bg-orange-500 transition-colors">
                        {card.bouton || "J'achète"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── PROMO GRID ── */}
        {cfg.promo?.visible !== false && promos.length > 0 && (
          <section>
            <div className="bg-red-600 text-white px-4 py-2.5 rounded-t-xl flex items-center justify-between">
              <h2 className="font-bold text-sm sm:text-base md:text-lg">{cfg.promo?.titre || '🔥 Offres Spéciales World Cup'}</h2>
              <Link to="/products" className="text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition">Tout voir →</Link>
            </div>
            <div className="bg-white rounded-b-xl shadow-sm p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {promos.map(p => <PromoCard key={p._id} product={p} />)}
              </div>
            </div>
          </section>
        )}

        {/* ── SECTIONS CAROUSELS ── */}
        {(cfg.sections || DEFAULT_CFG.sections).filter(s => s.visible).map(s => (
          <SectionCarousel key={s.id} section={s} products={sectionData[s.id] || []} loading={loading} />
        ))}

        {/* ── FOOTER SEO ── */}
        <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6 text-center">
          <div className="text-3xl mb-3">🌍⚽🏆</div>
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-2">JSC-Market — Votre partenaire tech pour la Coupe du Monde 2026</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl mx-auto">
            Équipez-vous pour le Mondial 2026 avec JSC-Market Cameroun. TV 4K, smartphones, enceintes,
            consoles de jeu — profitez des meilleures offres avec livraison rapide partout au Cameroun.
            Paiement par Orange Money, MTN MoMo ou à la livraison.
          </p>
          <Link to="/products" className="mt-4 inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-full text-sm transition">
            Découvrir tous les produits
          </Link>
        </section>

      </div>
    </div>
  )
}

/* ── Countdown stylisé World Cup ── */
function CountdownBig({ endDate }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endDate) - Date.now()
      if (diff > 0) setT({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [endDate])

  const Unit = ({ v, label }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-3 sm:px-5 py-2 sm:py-3 min-w-[56px] sm:min-w-[72px]">
        <span className="text-xl sm:text-3xl font-black text-white tabular-nums">{String(v).padStart(2, '0')}</span>
      </div>
      <span className="text-white/60 text-[10px] sm:text-xs mt-1 uppercase tracking-widest">{label}</span>
    </div>
  )
  return (
    <div className="flex items-start gap-2 sm:gap-3">
      <Unit v={t.d} label="Jours" /><span className="text-white/50 text-2xl font-bold mt-2">:</span>
      <Unit v={t.h} label="Heures" /><span className="text-white/50 text-2xl font-bold mt-2">:</span>
      <Unit v={t.m} label="Min" /><span className="text-white/50 text-2xl font-bold mt-2">:</span>
      <Unit v={t.s} label="Sec" />
    </div>
  )
}

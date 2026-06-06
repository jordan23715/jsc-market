import { useState, useEffect, useMemo, useRef } from 'react'
import * as XLSX from 'xlsx'
import ProductForm from '../components/ProductForm'
import adminApi from '../services/adminApi'
import useAuthStore from '../../context/AuthContext'
import { getImageUrl } from '../../services/api'
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiPackage,
  FiAlertTriangle, FiX, FiGrid, FiList,
  FiChevronLeft, FiChevronRight, FiDownload, FiUpload, FiCheckCircle
} from 'react-icons/fi'

const PER_PAGE = 10

// ── Badge stock ───────────────────────────────────────────────
function StockBadge({ stock }) {
  if (stock === 0)   return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-600">Épuisé</span>
  if (stock <= 3)    return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700">Faible ({stock})</span>
  return               <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700">{stock} en stock</span>
}

// ── Skeleton chargement ───────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="bg-slate-100 aspect-[4/3]" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-slate-100 rounded w-1/3" />
        <div className="h-4 bg-slate-100 rounded w-4/5" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-8 bg-slate-100 rounded mt-3" />
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────
export default function Products() {
  const [products, setProducts]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [formOpen, setFormOpen]           = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [search, setSearch]               = useState('')
  const [filterCat, setFilterCat]         = useState('')
  const [filterStock, setFilterStock]     = useState('')
  const [view, setView]                   = useState('grid') // 'grid' | 'table'
  const [deleteId, setDeleteId]           = useState(null)
  const [page, setPage]                   = useState(1)
  const [totalCount, setTotalCount]       = useState(0)
  const [importModal, setImportModal]     = useState(false)
  const [importRows, setImportRows]       = useState([])
  const [importProgress, setImportProgress] = useState(null) // null | { done, total, errors }
  const [exportMenu, setExportMenu]       = useState(false)
  const importRef = useRef(null)

  const { user } = useAuthStore()
  const isAdmin = ['admin', 'manager'].includes(user?.role)

  // ── Chargement ──
  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const { products, total } = await adminApi.getProductsAdmin()
      setProducts(products || [])
      setTotalCount(total || products?.length || 0)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  // ── Catégories disponibles ──
  const categories = useMemo(() =>
    [...new Set(products.map(p => p.categorie).filter(Boolean))].sort()
  , [products])

  // ── Filtrage ──
  const filtered = useMemo(() => {
    let list = [...products]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.nom?.toLowerCase().includes(q) ||
        p.marque?.toLowerCase().includes(q) ||
        p.categorie?.toLowerCase().includes(q)
      )
    }
    if (filterCat)  list = list.filter(p => p.categorie === filterCat)
    if (filterStock === 'epuise') list = list.filter(p => p.stock === 0)
    if (filterStock === 'faible') list = list.filter(p => p.stock > 0 && p.stock <= 3)
    if (filterStock === 'ok')     list = list.filter(p => p.stock > 3)
    return list
  }, [products, search, filterCat, filterStock])

  // ── Stats rapides ──
  const stats = useMemo(() => ({
    total:   products.length,
    epuise:  products.filter(p => p.stock === 0).length,
    faible:  products.filter(p => p.stock > 0 && p.stock <= 3).length,
    promo:   products.filter(p => p.prixPromo && p.prixPromo < p.prix).length,
  }), [products])

  // ── Actions ──
  const openAdd  = () => { setSelectedProduct(null); setFormOpen(true) }
  const openEdit = (p) => { setSelectedProduct(p);   setFormOpen(true) }

  const handleDelete = async (id) => {
    try {
      await adminApi.deleteProduct(id)
      setDeleteId(null)
      fetchProducts()
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    }
  }

  const handleFormSubmit = async (formData, productId) => {
    if (productId) await adminApi.updateProduct(productId, formData)
    else           await adminApi.createProduct(formData)
    fetchProducts()
  }

  // ── EXPORT ──
  const COLS = ['nom','categorie','marque','prix','prixPromo','stock','description','images']

  const exportCSV = () => {
    const rows = [COLS, ...products.map(p => COLS.map(k =>
      k === 'images' ? (p.images || []).join('|') : (p[k] ?? '')
    ))]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `produits_jscmarket_${new Date().toISOString().slice(0,10)}.csv`
    a.click(); setExportMenu(false)
  }

  const exportExcel = () => {
    const data = products.map(p => ({
      Nom: p.nom, Categorie: p.categorie, Marque: p.marque,
      Prix: p.prix, PrixPromo: p.prixPromo || '', Stock: p.stock,
      Description: p.description || '',
      Images: (p.images || []).join('|'),
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Produits')
    XLSX.writeFile(wb, `produits_jscmarket_${new Date().toISOString().slice(0,10)}.xlsx`)
    setExportMenu(false)
  }

  // ── IMPORT ──
  const parsePrice = (s) => {
    if (!s && s !== 0) return 0
    // Remove FCFA, spaces, then remove commas (thousands separator in French)
    const cleaned = String(s).replace(/FCFA/gi,'').replace(/\s/g,'').replace(/,/g,'').trim()
    return Math.round(Number(cleaned)) || 0
  }

  const detectBrand = (name) => {
    const brands = ['MeWe','SuperFlame','Super Flame','SUPER FLAME','Roch','ROCH',
      'Eurolux','EUROLUX','Oscar','OSCAR','Midea','MIDEA','Valencia','VALENCIA',
      'Goodwin','GOODWIN','Belle France','Belle Vie','Innova','INNOVA','Signature',
      'SIGNATURE','Fiabtec','FIABTEC','Millennium','MILLENNIUM']
    for (const b of brands) {
      if (name.toLowerCase().includes(b.toLowerCase())) return b
    }
    return ''
  }

  const detectCategorie = (name, url) => {
    const n = (name + ' ' + url).toLowerCase()
    // Cuisinière doit être détecté avant four (car les cuisinières ont souvent "four intégré")
    if (n.includes('cuisin')) return 'Cuisinières à Gaz'
    if (n.includes('réfrigér') || n.includes('refriger') || n.includes('frigo')) return 'Réfrigérateurs'
    if (n.includes('lave-vaisselle') || n.includes('vaisselle')) return 'Lave-vaisselle'
    if (n.includes('lave-linge') || n.includes('machine à laver')) return 'Lave-linge'
    if (n.includes('climatiseur') || n.includes('clim')) return 'Climatiseurs'
    if (n.includes('télévision') || n.includes('television') || n.includes(' tv ')) return 'Télévisions'
    if (n.includes('four encastrable') || n.includes('four electrique') || n.includes('four électrique')) return 'Fours'
    return 'Électroménager'
  }

  const handleImportFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        // Get raw rows with header row
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        if (raw.length < 2) { alert('Fichier vide ou invalide.'); return }

        const headers = raw[0].map(h => String(h).toLowerCase().trim())
        const dataRows = raw.slice(1).filter(r => r.some(c => c !== ''))

        // Detect Glotelho format (CSS class column names)
        const isGlotelho = headers.some(h =>
          h.includes('flex') || h.includes('clamp') || h.includes('shrink') || h.includes('xl:')
        )

        let normalized
        if (isGlotelho) {
          // Glotelho format: [productUrl, imageUrl, name, currentPrice, originalPrice, discount]
          normalized = dataRows.map(row => {
            const productUrl = String(row[0] || '')
            const imageUrl   = String(row[1] || '').trim()
            const name       = String(row[2] || '').trim()
            const prixActuel = parsePrice(row[3]) // Current (discounted) price
            const prixOrig   = parsePrice(row[4]) // Original price

            if (!name || !prixActuel) return null

            const prix      = prixOrig > prixActuel ? prixOrig : prixActuel
            const prixPromo = prixOrig > prixActuel ? prixActuel : undefined

            return {
              nom:         name,
              categorie:   detectCategorie(name, productUrl),
              marque:      detectBrand(name),
              prix,
              prixPromo,
              stock:       10,
              description: name,
              images:      imageUrl ? [imageUrl] : [],
            }
          }).filter(Boolean)
        } else {
          // Format standard JSC-Market
          const idx = (keys) => {
            for (const k of keys) {
              const i = headers.findIndex(h => h === k || h.includes(k))
              if (i >= 0) return i
            }
            return -1
          }
          const iNom  = idx(['nom','name','produit'])
          const iCat  = idx(['categorie','catégorie','category'])
          const iMar  = idx(['marque','brand'])
          const iPrix = idx(['prix','price'])
          const iPromo= idx(['prixpromo','promo'])
          const iStock= idx(['stock'])
          const iDesc = idx(['description'])
          const iImg  = idx(['images','image'])

          normalized = dataRows.map(row => ({
            nom:         String(row[iNom] ?? ''),
            categorie:   String(row[iCat] ?? ''),
            marque:      String(row[iMar] ?? ''),
            prix:        Number(row[iPrix]) || 0,
            prixPromo:   iPromo >= 0 && row[iPromo] ? Number(row[iPromo]) : undefined,
            stock:       Number(row[iStock]) || 0,
            description: String(row[iDesc] ?? ''),
            images:      iImg >= 0 ? String(row[iImg] || '').split('|').filter(Boolean) : [],
          })).filter(r => r.nom && r.prix > 0)
        }

        if (normalized.length === 0) {
          alert('Aucun produit valide trouvé. Vérifiez le format du fichier.')
          return
        }

        setImportRows(normalized)
        setImportProgress(null)
        setImportModal(true)
      } catch (err) {
        console.error(err)
        alert('Erreur lors de la lecture du fichier : ' + err.message)
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const runImport = async () => {
    const total = importRows.length
    let done = 0, errors = 0
    setImportProgress({ done: 0, total, errors: 0 })

    // Récupérer les catégories existantes
    let existingCats = []
    try { existingCats = await adminApi.getCategories() } catch {}
    const catNames = existingCats.map(c => (c.nom || c).toLowerCase())

    // Créer les catégories manquantes
    const neededCats = [...new Set(importRows.map(r => r.categorie).filter(Boolean))]
    for (const cat of neededCats) {
      if (!catNames.includes(cat.toLowerCase())) {
        try { await adminApi.createCategory({ nom: cat, description: cat }) } catch {}
      }
    }

    // Importer les produits
    for (const row of importRows) {
      try {
        await adminApi.createProduct({ ...row, isActive: true })
        done++
      } catch (err) {
        console.error('Import erreur:', err.message || err)
        errors++
      }
      setImportProgress({ done, total, errors })
    }
    await fetchProducts()
  }

  const clearFilters = () => { setSearch(''); setFilterCat(''); setFilterStock(''); setPage(1) }
  const hasFilters   = search || filterCat || filterStock

  // Reset page quand les filtres changent
  useEffect(() => { setPage(1) }, [search, filterCat, filterStock])

  // Pagination
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // ── Image produit ──
  const getImg = (p) => {
    const idx = p.imagePrincipale ?? 0
    return p.images?.length > 0 ? getImageUrl(p.images[idx]) : null
  }

  return (
    <div className="space-y-5 pb-10">

      {/* ── EN-TÊTE ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Produits</h1>
          <p className="text-slate-400 text-sm mt-0.5">{totalCount} produit{totalCount > 1 ? 's' : ''} au total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">

          {/* Import */}
          <input ref={importRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportFile} />
          <button
            onClick={() => importRef.current?.click()}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-green-400 hover:text-green-600 text-slate-600 font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm"
          >
            <FiUpload className="w-4 h-4" /> Importer
          </button>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setExportMenu(v => !v)}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-600 font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm"
            >
              <FiDownload className="w-4 h-4" /> Exporter
            </button>
            {exportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden min-w-[160px]">
                <button onClick={exportCSV}   className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2"><span>📄</span> CSV</button>
                <button onClick={exportExcel} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2"><span>📊</span> Excel (.xlsx)</button>
              </div>
            )}
          </div>

          {/* Ajouter */}
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm"
          >
            <FiPlus className="w-4 h-4" /> Ajouter un produit
          </button>
        </div>
      </div>

      {/* ── STATS RAPIDES ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',    val: stats.total,   color: 'bg-slate-800   text-white',           dot: '' },
          { label: 'Épuisés', val: stats.epuise,  color: 'bg-red-50      text-red-700  border border-red-100',    dot: 'bg-red-400' },
          { label: 'Stock faible', val: stats.faible, color: 'bg-amber-50 text-amber-700 border border-amber-100', dot: 'bg-amber-400' },
          { label: 'En promo', val: stats.promo,  color: 'bg-orange-50   text-orange-700 border border-orange-100', dot: 'bg-orange-400' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl px-4 py-3 flex items-center gap-3 ${s.color}`}>
            {s.dot && <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.dot}`} />}
            <div>
              <p className="text-xl font-black">{s.val}</p>
              <p className="text-xs opacity-70">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <FiAlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── BARRE RECHERCHE + FILTRES ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">

          {/* Recherche */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un produit, marque…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>

          {/* Filtre catégorie */}
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 min-w-[160px]"
          >
            <option value="">Toutes catégories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Filtre stock */}
          <select
            value={filterStock}
            onChange={e => setFilterStock(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 min-w-[140px]"
          >
            <option value="">Tout le stock</option>
            <option value="ok">En stock</option>
            <option value="faible">Stock faible</option>
            <option value="epuise">Épuisé</option>
          </select>

          {/* Vue grid/table */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-white shadow-sm text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('table')}
              className={`p-2 rounded-lg transition-colors ${view === 'table' ? 'bg-white shadow-sm text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Résultats + reset */}
        {hasFilters && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              <span className="font-bold text-slate-800">{filtered.length}</span> résultat{filtered.length > 1 ? 's' : ''}
            </p>
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-semibold">
              <FiX className="w-3.5 h-3.5" /> Effacer les filtres
            </button>
          </div>
        )}
      </div>

      {/* ── CONTENU ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array(10).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 flex flex-col items-center gap-3 text-slate-400">
          <FiPackage className="w-12 h-12 text-slate-200" />
          <p className="text-base font-semibold text-slate-500">Aucun produit trouvé</p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-sm text-orange-500 hover:underline font-medium">
              Effacer les filtres
            </button>
          )}
        </div>
      ) : view === 'grid' ? (

        /* ── VUE GRILLE ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {paginated.map(p => {
            const img = getImg(p)
            const prixFinal = p.prixPromo && p.prixPromo < p.prix ? p.prixPromo : p.prix
            const remise = p.prixPromo ? Math.round(((p.prix - p.prixPromo) / p.prix) * 100) : 0

            return (
              <div key={p._id} className="bg-white rounded-2xl border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all overflow-hidden group flex flex-col">

                {/* Image */}
                <div className="relative bg-slate-50 aspect-[4/3] overflow-hidden">
                  {img ? (
                    <img
                      src={img}
                      alt={p.nom}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { e.target.src = 'https://via.placeholder.com/300x200?text=Produit' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiPackage className="w-10 h-10 text-slate-200" />
                    </div>
                  )}
                  {remise > 0 && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                      -{remise}%
                    </span>
                  )}
                  {p.stock === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-gray-800 font-bold text-xs px-2 py-1 rounded-lg">Épuisé</span>
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="p-3 flex flex-col flex-1 gap-1.5">
                  <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider truncate">{p.marque || p.categorie}</p>
                  <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight flex-1">{p.nom}</h3>

                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div>
                      <p className="text-sm font-black text-orange-500">{prixFinal.toLocaleString('fr-FR')} <span className="text-xs font-semibold">F</span></p>
                      {remise > 0 && <p className="text-xs text-slate-400 line-through">{p.prix.toLocaleString('fr-FR')} F</p>}
                    </div>
                    <StockBadge stock={p.stock} />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => openEdit(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-orange-100 hover:text-orange-600 text-slate-600 text-xs font-semibold py-2 rounded-lg transition-colors"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" /> Modifier
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteId(p._id)}
                        className="flex items-center justify-center p-2 bg-slate-100 hover:bg-red-100 hover:text-red-500 text-slate-400 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      ) : (

        /* ── VUE TABLE ── */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Produit</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Catégorie</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Prix</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Stock</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => {
                  const img = getImg(p)
                  const prixFinal = p.prixPromo && p.prixPromo < p.prix ? p.prixPromo : p.prix
                  const remise = p.prixPromo ? Math.round(((p.prix - p.prixPromo) / p.prix) * 100) : 0

                  return (
                    <tr key={p._id} className="border-t border-slate-50 hover:bg-slate-50/70 transition-colors">

                      {/* Produit */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                            {img ? (
                              <img src={img} alt={p.nom} className="w-full h-full object-cover"
                                onError={e => { e.target.src = 'https://via.placeholder.com/48x48' }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FiPackage className="w-5 h-5 text-slate-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate max-w-[200px]">{p.nom}</p>
                            {p.marque && <p className="text-xs text-slate-400 truncate">{p.marque}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Catégorie */}
                      <td className="px-5 py-3">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                          {p.categorie || '—'}
                        </span>
                      </td>

                      {/* Prix */}
                      <td className="px-5 py-3">
                        <p className="font-bold text-orange-500 text-sm">{prixFinal.toLocaleString('fr-FR')} F</p>
                        {remise > 0 && (
                          <p className="text-xs text-slate-400 line-through">{p.prix.toLocaleString('fr-FR')} F</p>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-5 py-3">
                        <StockBadge stock={p.stock} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="flex items-center gap-1.5 bg-slate-100 hover:bg-orange-100 hover:text-orange-600 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" /> Modifier
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteId(p._id)}
                              className="flex items-center gap-1.5 bg-slate-100 hover:bg-red-100 hover:text-red-500 text-slate-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" /> Suppr.
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PAGINATION ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3">
          <p className="text-sm text-slate-500">
            <span className="font-bold text-slate-800">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)}</span>
            {' '}sur{' '}
            <span className="font-bold text-slate-800">{filtered.length}</span> produits
          </p>

          <div className="flex items-center gap-1">
            {/* Précédent */}
            <button
              onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronLeft className="w-4 h-4" /> Préc.
            </button>

            {/* Numéros de pages */}
            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce((acc, n, idx, arr) => {
                  if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) =>
                  n === '…' ? (
                    <span key={`dots-${i}`} className="px-2 text-slate-400 text-sm">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
                        page === n
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {n}
                    </button>
                  )
                )
              }
            </div>

            {/* Suivant */}
            <button
              onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              disabled={page === totalPages}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Suiv. <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMATION SUPPRESSION ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <FiTrash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Supprimer ce produit ?</h3>
                <p className="text-sm text-slate-500">Cette action est irréversible.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL IMPORT ── */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Importer des produits</h3>
                <p className="text-sm text-slate-400 mt-0.5">{importRows.length} produit{importRows.length > 1 ? 's' : ''} détecté{importRows.length > 1 ? 's' : ''}</p>
              </div>
              {!importProgress && (
                <button onClick={() => setImportModal(false)} className="p-2 hover:bg-slate-100 rounded-lg"><FiX className="w-5 h-5 text-slate-400" /></button>
              )}
            </div>

            {/* Aperçu */}
            {!importProgress && (
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-5 max-h-60 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      {['Nom','Catégorie','Marque','Prix','Stock'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-bold text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-t border-slate-50">
                        <td className="px-3 py-2 truncate max-w-[150px] text-slate-700">{r.nom}</td>
                        <td className="px-3 py-2 text-slate-500">{r.categorie}</td>
                        <td className="px-3 py-2 text-slate-500">{r.marque}</td>
                        <td className="px-3 py-2 text-orange-600 font-semibold">{r.prix?.toLocaleString()} F</td>
                        <td className="px-3 py-2 text-slate-500">{r.stock}</td>
                      </tr>
                    ))}
                    {importRows.length > 20 && (
                      <tr><td colSpan={5} className="px-3 py-2 text-center text-slate-400">... et {importRows.length - 20} autres</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Progression */}
            {importProgress && (
              <div className="mb-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-semibold">{importProgress.done} / {importProgress.total} importés</span>
                  {importProgress.errors > 0 && <span className="text-red-500 text-xs">{importProgress.errors} erreur{importProgress.errors > 1 ? 's' : ''}</span>}
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-green-500 transition-all duration-300"
                    style={{ width: `${Math.round((importProgress.done / importProgress.total) * 100)}%` }}
                  />
                </div>
                {importProgress.done === importProgress.total && (
                  <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                    <FiCheckCircle className="w-4 h-4" />
                    Import terminé !
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              {importProgress !== null && importProgress.done === importProgress.total ? (
                <button
                  onClick={() => { setImportModal(false); setImportProgress(null) }}
                  className="w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm"
                >Fermer</button>
              ) : importProgress !== null ? (
                <div className="w-full py-2.5 text-center text-sm text-slate-400 animate-pulse">Import en cours...</div>
              ) : (
                <>
                  <button onClick={() => setImportModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">Annuler</button>
                  <button onClick={runImport} className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm">
                    Importer {importRows.length} produit{importRows.length > 1 ? 's' : ''}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FORMULAIRE PRODUIT ── */}
      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        product={selectedProduct}
      />
    </div>
  )
}

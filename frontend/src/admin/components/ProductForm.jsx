import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import adminApi from '../services/adminApi'
import { getImageUrl } from '../../services/api'
import { FiX, FiStar, FiUpload, FiImage, FiTag, FiDollarSign, FiPackage, FiSearch } from 'react-icons/fi'

const PLACEHOLDER = 'https://placehold.co/120x120/f1f5f9/94a3b8?text=IMG'

/* ── Composants UI réutilisables ── */
const Label = ({ children, required }) => (
  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
    {children}{required && <span className="text-orange-400 ml-0.5">*</span>}
  </label>
)
const Input = ({ error, className = '', ...p }) => (
  <input className={`w-full bg-slate-700/60 border ${error ? 'border-red-500' : 'border-slate-600'} text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 placeholder-slate-500 ${className}`} {...p} />
)
const Select = ({ error, children, ...p }) => (
  <select className={`w-full bg-slate-700/60 border ${error ? 'border-red-500' : 'border-slate-600'} text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 [&>option]:bg-slate-800 ${p.className || ''}`} {...p}>{children}</select>
)
const Textarea = ({ ...p }) => (
  <textarea className="w-full bg-slate-700/60 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 placeholder-slate-500 resize-none" {...p} />
)
const ErrMsg = ({ msg }) => msg ? <p className="text-red-400 text-xs mt-1">{msg}</p> : null
const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-800">
      {Icon && <Icon className="w-4 h-4 text-orange-400" />}
      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="p-4 space-y-3">{children}</div>
  </div>
)

/* ── Miniature image ── */
function ImageThumb({ src, isPrimary, onRemove, onSetPrimary }) {
  const [err, setErr] = useState(false)
  const url = src.startsWith('blob:') ? src : getImageUrl(src)
  return (
    <div className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 group cursor-pointer ${isPrimary ? 'border-orange-500 shadow-lg shadow-orange-500/20' : 'border-slate-600'}`} onClick={onSetPrimary}>
      <img src={err ? PLACEHOLDER : url} alt="" className="w-full h-full object-cover" onError={() => setErr(true)} />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all" />
      <button type="button" onClick={e => { e.stopPropagation(); onRemove(e) }}
        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <FiX size={9} />
      </button>
      {isPrimary && <span className="absolute bottom-1 left-1 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">⭐ Principal</span>}
    </div>
  )
}

const EMPTY = {
  nom: '', prix: '', stock: '', categorie: '', categorie2: '',
  descriptionCourte: '', description: '', marque: '', prixPromo: '',
  isActive: true,
  seo: { metaDescription: '', keywords: '' },
}

export default function ProductForm({ open = false, onClose = () => {}, onSubmit = async () => {}, product = null }) {
  const [form, setForm]                 = useState(EMPTY)
  const [existingImages, setExisting]   = useState([])
  const [selectedFiles, setFiles]       = useState([])
  const [previews, setPreviews]         = useState([])
  const [categories, setCategories]     = useState([])
  const [errors, setErrors]             = useState({})
  const [submitError, setSubmitError]   = useState(null)
  const [loading, setLoading]           = useState(false)
  const [mainImgIdx, setMainImgIdx]     = useState(0)
  const [mainErrImg, setMainErrImg]     = useState(false)
  const [activeTab, setActiveTab]       = useState('general')

  useEffect(() => {
    if (!open) return
    setActiveTab('general')
    if (product) {
      setForm({
        nom: product.nom || '', prix: product.prix || '', stock: product.stock || '',
        categorie: product.categorie || '', categorie2: product.categorie2 || '',
        descriptionCourte: product.descriptionCourte || '',
        description: product.description || '', marque: product.marque || '',
        prixPromo: product.prixPromo || '', isActive: product.isActive !== false,
        seo: { metaDescription: product.seo?.metaDescription || '', keywords: product.seo?.keywords || '' },
      })
      const imgs = (product.images || []).filter(Boolean)
      setExisting(imgs.map(src => ({ src })))
      setMainImgIdx(product.imagePrincipale ?? 0)
    } else {
      setForm(EMPTY)
      setExisting([])
      setMainImgIdx(0)
    }
    setFiles([]); setPreviews([]); setErrors({}); setSubmitError(null)
  }, [product, open])

  useEffect(() => { setMainErrImg(false) }, [mainImgIdx])

  useEffect(() => {
    adminApi.getCategories().then(c => setCategories(c || [])).catch(() => {})
  }, [])

  const allImages = [...existingImages, ...previews]
  const mainSrc   = allImages[mainImgIdx]?.src || ''

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setSeo = (k, v) => setForm(f => ({ ...f, seo: { ...f.seo, [k]: v } }))

  const handleFiles = e => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const newPreviews = files.map(f => ({ src: URL.createObjectURL(f), file: f }))
    setFiles(s => [...s, ...files])
    setPreviews(p => [...p, ...newPreviews])
    e.target.value = null
  }

  const removeExisting = i => {
    setExisting(e => e.filter((_, idx) => idx !== i))
    if (mainImgIdx >= i && mainImgIdx > 0) setMainImgIdx(m => m - 1)
  }
  const removePreview = i => {
    URL.revokeObjectURL(previews[i]?.src)
    setFiles(s => s.filter((_, idx) => idx !== i))
    setPreviews(p => p.filter((_, idx) => idx !== i))
    const abs = existingImages.length + i
    if (mainImgIdx >= abs && mainImgIdx > 0) setMainImgIdx(m => m - 1)
  }

  const validate = () => {
    const errs = {}
    if (!form.nom.trim())       errs.nom = 'Nom requis'
    if (!form.prix || isNaN(form.prix)) errs.prix = 'Prix valide requis'
    if (form.stock === '' || isNaN(form.stock)) errs.stock = 'Stock requis'
    if (!form.categorie.trim()) errs.categorie = 'Catégorie principale requise'
    setErrors(errs)
    if (Object.keys(errs).length) setActiveTab('general')
    return !Object.keys(errs).length
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true); setSubmitError(null)
    try {
      let uploadedUrls = []
      if (selectedFiles.length) uploadedUrls = await adminApi.uploadImages(selectedFiles, 'products')
      const allImgs = [...existingImages.map(i => i.src), ...uploadedUrls]
      if (!allImgs.length) { setSubmitError('Au moins une image est requise'); setLoading(false); return }
      await onSubmit({
        nom: form.nom.trim(), prix: Number(form.prix), stock: Number(form.stock),
        categorie: form.categorie.trim(), categorie2: form.categorie2.trim(),
        descriptionCourte: form.descriptionCourte.trim(),
        description: form.description.trim(), marque: (form.marque || '').trim() || 'N/A',
        prixPromo: form.prixPromo ? Number(form.prixPromo) : null,
        isActive: form.isActive, images: allImgs,
        imagePrincipale: Math.min(mainImgIdx, allImgs.length - 1),
        seo: form.seo,
      }, product?._id)
      onClose()
    } catch (err) {
      setSubmitError(err.response?.data?.error || err.message || 'Erreur enregistrement')
    } finally {
      setLoading(false)
    }
  }

  const TABS = [
    { id: 'general', label: 'Général' },
    { id: 'prix',    label: 'Prix & Stock' },
    { id: 'medias',  label: 'Images' },
    { id: 'seo',     label: '🔍 SEO' },
  ]

  return (
    <Modal open={open} title={product ? '✏️ Modifier le produit' : '➕ Nouveau produit'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {submitError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <FiX className="flex-shrink-0" /> {submitError}
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${activeTab === t.id ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: GÉNÉRAL ── */}
        {activeTab === 'general' && (
          <div className="space-y-3">
            <Section icon={FiTag} title="Informations générales">
              <div>
                <Label required>Nom du produit</Label>
                <Input value={form.nom} onChange={e => set('nom', e.target.value)} error={errors.nom} placeholder="Ex: Samsung Galaxy S24 Ultra" />
                <ErrMsg msg={errors.nom} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Marque</Label>
                  <Input value={form.marque} onChange={e => set('marque', e.target.value)} placeholder="Samsung, Apple..." />
                </div>
                <div>
                  <Label required>Catégorie principale</Label>
                  <Select value={form.categorie} onChange={e => set('categorie', e.target.value)} error={errors.categorie}>
                    <option value="">-- Choisir --</option>
                    {categories.map(c => <option key={c._id} value={c.nom}>{c.nom}</option>)}
                  </Select>
                  <ErrMsg msg={errors.categorie} />
                </div>
              </div>
              <div>
                <Label>Catégorie secondaire <span className="text-slate-500 normal-case font-normal">(optionnel)</span></Label>
                <Select value={form.categorie2} onChange={e => set('categorie2', e.target.value)}>
                  <option value="">-- Aucune --</option>
                  {categories.filter(c => c.nom !== form.categorie).map(c => <option key={c._id} value={c.nom}>{c.nom}</option>)}
                </Select>
                <p className="text-slate-500 text-xs mt-1">Le produit apparaîtra aussi dans cette catégorie</p>
              </div>
              <div>
                <Label>Description courte</Label>
                <Input value={form.descriptionCourte} onChange={e => set('descriptionCourte', e.target.value)} maxLength={120} placeholder="Résumé en 1-2 lignes..." />
              </div>
              <div>
                <Label>Description complète</Label>
                <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Description détaillée du produit..." />
              </div>
            </Section>

            {/* Statut */}
            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
              <span className="text-sm text-slate-300">Produit visible sur le site</span>
              <button type="button" onClick={() => set('isActive', !form.isActive)}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-orange-500' : 'bg-slate-600'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: PRIX & STOCK ── */}
        {activeTab === 'prix' && (
          <Section icon={FiDollarSign} title="Prix & Stock">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label required>Prix (FCFA)</Label>
                <Input type="number" value={form.prix} onChange={e => set('prix', e.target.value)} error={errors.prix} placeholder="150000" min="0" />
                <ErrMsg msg={errors.prix} />
              </div>
              <div>
                <Label>Prix promo (FCFA)</Label>
                <Input type="number" value={form.prixPromo} onChange={e => set('prixPromo', e.target.value)} placeholder="120000" min="0" />
                {form.prixPromo && form.prix && Number(form.prixPromo) < Number(form.prix) && (
                  <p className="text-emerald-400 text-xs mt-1">-{Math.round((1 - form.prixPromo / form.prix) * 100)}% de remise</p>
                )}
              </div>
              <div>
                <Label required>Stock</Label>
                <Input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} error={errors.stock} placeholder="10" min="0" />
                <ErrMsg msg={errors.stock} />
              </div>
            </div>
            {form.prixPromo && Number(form.prixPromo) >= Number(form.prix) && (
              <p className="text-amber-400 text-xs bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">⚠️ Le prix promo doit être inférieur au prix normal</p>
            )}
          </Section>
        )}

        {/* ── TAB: IMAGES ── */}
        {activeTab === 'medias' && (
          <Section icon={FiImage} title="Images du produit">
            {/* Aperçu principal */}
            <div className="flex gap-4">
              <div className="w-36 h-36 flex-shrink-0 rounded-2xl overflow-hidden border-2 border-orange-500/40 bg-slate-700 flex items-center justify-center">
                {mainSrc ? (
                  <img src={mainErrImg ? PLACEHOLDER : (mainSrc.startsWith('blob:') ? mainSrc : getImageUrl(mainSrc))}
                    alt="Principal" className="w-full h-full object-contain p-2" onError={() => setMainErrImg(true)} />
                ) : (
                  <div className="flex flex-col items-center text-slate-500 gap-2">
                    <FiImage size={28} /><span className="text-xs">Aucune image</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-2">Clique sur une image pour la définir comme principale</p>
                <div className="flex flex-wrap gap-2">
                  {existingImages.map((img, i) => (
                    <ImageThumb key={`ex-${i}`} src={img.src} isPrimary={mainImgIdx === i}
                      onRemove={e => { e.stopPropagation(); removeExisting(i) }}
                      onSetPrimary={() => setMainImgIdx(i)} />
                  ))}
                  {previews.map((p, i) => {
                    const abs = existingImages.length + i
                    return (
                      <ImageThumb key={`pr-${i}`} src={p.src} isPrimary={mainImgIdx === abs}
                        onRemove={e => { e.stopPropagation(); removePreview(i) }}
                        onSetPrimary={() => setMainImgIdx(abs)} />
                    )
                  })}
                </div>
              </div>
            </div>
            <label className="flex items-center gap-3 border-2 border-dashed border-orange-500/40 hover:border-orange-500 rounded-xl p-4 cursor-pointer hover:bg-orange-500/5 transition-colors group">
              <FiUpload className="text-orange-400 flex-shrink-0 group-hover:scale-110 transition-transform" size={20} />
              <div>
                <p className="text-sm font-semibold text-orange-400">Ajouter des images</p>
                <p className="text-xs text-slate-500">JPG, PNG, WEBP — max 10MB chacune</p>
              </div>
              <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
            </label>
          </Section>
        )}

        {/* ── TAB: SEO ── */}
        {activeTab === 'seo' && (
          <Section icon={FiSearch} title="Optimisation SEO">
            <p className="text-slate-500 text-xs">Ces données améliorent le référencement Google de la fiche produit.</p>
            <div>
              <Label>Meta Description</Label>
              <Textarea value={form.seo.metaDescription} onChange={e => setSeo('metaDescription', e.target.value)}
                rows={3} maxLength={160} placeholder="Description optimisée pour Google (max 160 car.)..." />
              <div className="flex justify-between mt-1">
                <p className="text-slate-500 text-xs">Idéalement entre 120 et 160 caractères</p>
                <span className={`text-xs font-mono ${form.seo.metaDescription.length > 160 ? 'text-red-400' : form.seo.metaDescription.length > 120 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {form.seo.metaDescription.length}/160
                </span>
              </div>
            </div>
            <div>
              <Label>Mots-clés SEO</Label>
              <Input value={form.seo.keywords} onChange={e => setSeo('keywords', e.target.value)}
                placeholder="smartphone, samsung, galaxy, cameroun..." />
              <p className="text-slate-500 text-xs mt-1">Séparés par des virgules</p>
            </div>
            {/* Aperçu Google */}
            {(form.nom || form.seo.metaDescription) && (
              <div className="bg-white rounded-xl p-4 space-y-0.5">
                <p className="text-[13px] text-blue-600 font-medium truncate">{form.nom || 'Nom du produit'} | JSC-Market Cameroun</p>
                <p className="text-[11px] text-emerald-700">https://jsc-market.cm/products/...</p>
                <p className="text-[12px] text-gray-600 line-clamp-2">{form.seo.metaDescription || 'Ajoutez une meta description pour améliorer votre référencement Google.'}</p>
              </div>
            )}
          </Section>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1 border-t border-slate-700">
          <button type="submit" disabled={loading}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm">
            {loading ? 'Enregistrement...' : (product ? '💾 Enregistrer les modifications' : '✅ Créer le produit')}
          </button>
          <button type="button" onClick={onClose} disabled={loading}
            className="px-5 border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 font-medium py-3 rounded-xl transition-colors text-sm">
            Annuler
          </button>
        </div>
      </form>
    </Modal>
  )
}

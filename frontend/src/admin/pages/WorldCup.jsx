import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { FiSave, FiEye, FiPlus, FiTrash2, FiUpload, FiX } from 'react-icons/fi'
import adminApi from '../services/adminApi'
import api from '../../services/api'

/* ── Shared UI ── */
const Input = ({ className = '', ...p }) => (
  <input className={`w-full bg-slate-700/50 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 placeholder-slate-500 ${className}`} {...p} />
)
const Textarea = ({ className = '', ...p }) => (
  <textarea className={`w-full bg-slate-700/50 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 placeholder-slate-500 resize-none ${className}`} {...p} />
)
const Select = ({ children, className = '', ...p }) => (
  <select className={`w-full bg-slate-700/50 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 ${className}`} {...p}>{children}</select>
)
const Field = ({ label, children, hint }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
    {children}
    {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
  </div>
)
function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-orange-500' : 'bg-slate-600'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}
function ImageField({ label, value, onChange }) {
  const ref = useRef()
  const [uploading, setUploading] = useState(false)
  const upload = async (file) => {
    setUploading(true)
    try { const [url] = await adminApi.uploadImages([file], 'events'); onChange(url) }
    catch { toast.error('Erreur upload') }
    finally { setUploading(false) }
  }
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
      {value ? (
        <div className="relative h-28 rounded-xl overflow-hidden bg-slate-700 mb-2">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange('')} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white"><FiX className="w-3 h-3" /></button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current.click()} disabled={uploading} className="w-full h-20 rounded-xl border-2 border-dashed border-slate-600 hover:border-orange-500 flex items-center justify-center gap-2 text-slate-400 hover:text-orange-400 transition text-sm">
          {uploading ? 'Upload...' : <><FiUpload className="w-4 h-4" /> Choisir une image</>}
        </button>
      )}
      {value && <button type="button" onClick={() => ref.current.click()} disabled={uploading} className="text-xs text-slate-400 hover:text-orange-400 flex items-center gap-1"><FiUpload className="w-3 h-3" />{uploading ? 'Upload...' : 'Changer'}</button>}
      <Input className="mt-1" value={value} onChange={e => onChange(e.target.value)} placeholder="Ou coller URL de l'image..." />
    </div>
  )
}

/* ── Default config ── */
const DEFAULT = {
  isActive: true,
  seo: { title: '', description: '', keywords: '', image: '' },
  hero: { titre: '🏆 Coupe du Monde 2026', sousTitre: '', boutonTexte: '🛒 Voir toutes les offres', boutonLien: '/products', bgColor: '#0d3b6e', image: '', countdownDate: '2026-07-19T18:00' },
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

export default function WorldCup() {
  const [cfg, setCfg]         = useState(DEFAULT)
  const [categories, setCats] = useState([])
  const [activeTab, setTab]   = useState('hero')
  const [saving, setSaving]   = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/event-pages/world-cup-2026').catch(() => ({ data: { data: null } })),
      adminApi.getCategories(),
    ]).then(([cfgRes, cats]) => {
      if (cfgRes.data.data) setCfg(cfgRes.data.data)
      setCats(cats)
    }).catch(() => toast.error('Erreur chargement'))
    .finally(() => setLoading(false))
  }, [])

  const set = (path, val) => {
    const keys = path.split('.')
    setCfg(prev => {
      const next = { ...prev }
      let cur = next
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] }
        cur = cur[keys[i]]
      }
      cur[keys[keys.length - 1]] = val
      return next
    })
  }

  const setSection = (idx, key, val) => {
    setCfg(prev => ({ ...prev, sections: prev.sections.map((s, i) => i === idx ? { ...s, [key]: val } : s) }))
  }

  const toggleSectionCat = (idx, cat) => {
    const s = cfg.sections[idx]
    const cats = s.categories.includes(cat) ? s.categories.filter(c => c !== cat) : [...s.categories, cat]
    setSection(idx, 'categories', cats)
  }

  const togglePromoCat = (cat) => {
    const cats = cfg.promo.categories.includes(cat) ? cfg.promo.categories.filter(c => c !== cat) : [...cfg.promo.categories, cat]
    set('promo.categories', cats)
  }

  const save = async () => {
    setSaving(true)
    try {
      await api.put('/admin/event-pages/world-cup-2026', cfg)
      toast.success('Page World Cup sauvegardée !')
    } catch { toast.error('Erreur sauvegarde') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  const setCard = (idx, key, val) => {
    setCfg(prev => ({
      ...prev,
      categoryCards: {
        ...prev.categoryCards,
        items: (prev.categoryCards?.items || []).map((c, i) => i === idx ? { ...c, [key]: val } : c),
      },
    }))
  }

  const addCard = () => setCfg(prev => ({
    ...prev,
    categoryCards: {
      ...prev.categoryCards,
      items: [...(prev.categoryCards?.items || []), { titre: '', image: '', lien: '/products', bgFrom: '#4c1d95', bgTo: '#c41e3a', bouton: "J'achète" }],
    },
  }))

  const removeCard = (idx) => setCfg(prev => ({
    ...prev,
    categoryCards: { ...prev.categoryCards, items: prev.categoryCards.items.filter((_, i) => i !== idx) },
  }))

  const TABS = [
    { id: 'hero',     label: '🎯 Hero' },
    { id: 'sections', label: '📦 Sections' },
    { id: 'promo',    label: '🔥 Promos' },
    { id: 'cards',    label: '🃏 Cartes' },
    { id: 'banners',  label: '🖼️ Bannières' },
    { id: 'seo',      label: '🔍 SEO' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">⚽ World Cup 2026</h1>
          <p className="text-slate-400 text-sm mt-1">Configuration de la landing page Coupe du Monde</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Page active</span>
            <Toggle checked={cfg.isActive} onChange={v => set('isActive', v)} />
          </div>
          <a href="/world-cup-2026" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition">
            <FiEye className="w-4 h-4" /> Prévisualiser
          </a>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium text-sm transition">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave className="w-4 h-4" />}
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === t.id ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: HERO ── */}
      {activeTab === 'hero' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Section Hero</h2>
          <Field label="Titre principal">
            <Input value={cfg.hero.titre} onChange={e => set('hero.titre', e.target.value)} placeholder="🏆 Coupe du Monde 2026" />
          </Field>
          <Field label="Sous-titre / Description">
            <Textarea value={cfg.hero.sousTitre} onChange={e => set('hero.sousTitre', e.target.value)} rows={2} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Texte du bouton CTA">
              <Input value={cfg.hero.boutonTexte} onChange={e => set('hero.boutonTexte', e.target.value)} />
            </Field>
            <Field label="Lien du bouton">
              <Input value={cfg.hero.boutonLien} onChange={e => set('hero.boutonLien', e.target.value)} placeholder="/products" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Couleur de fond (si pas d'image)">
              <div className="flex items-center gap-3">
                <input type="color" value={cfg.hero.bgColor || '#0d3b6e'} onChange={e => set('hero.bgColor', e.target.value)} className="h-10 w-20 rounded-lg border border-slate-600 cursor-pointer bg-transparent" />
                <span className="text-slate-400 text-sm font-mono">{cfg.hero.bgColor}</span>
              </div>
            </Field>
            <Field label="Date fin du compte à rebours">
              <Input type="datetime-local" value={cfg.hero.countdownDate || ''} onChange={e => set('hero.countdownDate', e.target.value)} />
            </Field>
          </div>
          <ImageField label="Image de fond du Hero (optionnel)" value={cfg.hero.image || ''} onChange={v => set('hero.image', v)} />
        </div>
      )}

      {/* ── TAB: SECTIONS ── */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          {cfg.sections.map((s, idx) => (
            <div key={s.id} className={`bg-slate-800 border rounded-2xl p-4 space-y-3 transition ${s.visible ? 'border-slate-700' : 'border-slate-700/40 opacity-60'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">{s.titre || s.id}</h3>
                <Toggle checked={s.visible} onChange={v => setSection(idx, 'visible', v)} />
              </div>
              <Field label="Titre de la section">
                <Input value={s.titre} onChange={e => setSection(idx, 'titre', e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Catégories (multi-select)">
                  <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto bg-slate-700/50 rounded-xl p-2 border border-slate-600">
                    {categories.map(c => (
                      <label key={c._id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-600/60 cursor-pointer">
                        <input type="checkbox" checked={s.categories.includes(c.nom)} onChange={() => toggleSectionCat(idx, c.nom)} className="accent-orange-500" />
                        <span className="text-xs text-slate-300 truncate">{c.nom}</span>
                      </label>
                    ))}
                  </div>
                </Field>
                <div className="space-y-3">
                  <Field label="Nb produits max">
                    <Input type="number" value={s.limit} onChange={e => setSection(idx, 'limit', Number(e.target.value))} min="4" max="20" />
                  </Field>
                  <Field label="Couleur en-tête">
                    <div className="flex items-center gap-2">
                      <input type="color" value={s.color || '#0d3b6e'} onChange={e => setSection(idx, 'color', e.target.value)} className="h-9 w-16 rounded-lg border border-slate-600 cursor-pointer bg-transparent" />
                      <span className="text-xs text-slate-400 font-mono">{s.color}</span>
                    </div>
                  </Field>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: PROMO ── */}
      {activeTab === 'promo' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">Grille Promotions</h2>
            <Toggle checked={cfg.promo.visible} onChange={v => set('promo.visible', v)} />
          </div>
          <Field label="Titre de la section promo">
            <Input value={cfg.promo.titre} onChange={e => set('promo.titre', e.target.value)} />
          </Field>
          <Field label="Nb produits" hint="Seuls les produits avec une promotion s'affichent">
            <Input type="number" value={cfg.promo.limit} onChange={e => set('promo.limit', Number(e.target.value))} min="4" max="20" />
          </Field>
          <Field label="Filtrer par catégories (optionnel)" hint="Vide = toutes catégories">
            <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto bg-slate-700/50 rounded-xl p-2 border border-slate-600">
              {categories.map(c => (
                <label key={c._id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-600/60 cursor-pointer">
                  <input type="checkbox" checked={cfg.promo.categories.includes(c.nom)} onChange={() => togglePromoCat(c.nom)} className="accent-orange-500" />
                  <span className="text-xs text-slate-300 truncate">{c.nom}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>
      )}

      {/* ── TAB: CARTES CATÉGORIES ── */}
      {activeTab === 'cards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-white font-semibold">Cartes Catégories</h2>
              <Toggle checked={cfg.categoryCards?.visible !== false} onChange={v => set('categoryCards.visible', v)} />
            </div>
            <button onClick={addCard} className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm">
              <FiPlus className="w-4 h-4" /> Ajouter une carte
            </button>
          </div>
          <Field label="Titre de la section">
            <Input value={cfg.categoryCards?.titre || ''} onChange={e => set('categoryCards.titre', e.target.value)} placeholder="🏟️ Nos sélections pour le Mondial" />
          </Field>
          {(cfg.categoryCards?.items || []).map((card, i) => (
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium">Carte {i + 1}</span>
                <button onClick={() => removeCard(i)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
              {/* Preview */}
              <div className="h-24 rounded-xl flex flex-col items-center justify-center gap-2 text-white" style={{ background: `linear-gradient(145deg, ${card.bgFrom || '#4c1d95'}, ${card.bgTo || '#c41e3a'})` }}>
                {card.image && <img src={card.image} alt="" className="h-12 object-contain" />}
                <span className="text-xs font-bold">{card.titre || 'Titre carte'}</span>
                <span className="text-[10px] bg-black/50 px-2 py-0.5 rounded-full">{card.bouton || "J'achète"}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Titre">
                  <Input value={card.titre} onChange={e => setCard(i, 'titre', e.target.value)} placeholder="Télévisions" />
                </Field>
                <Field label="Lien">
                  <Input value={card.lien} onChange={e => setCard(i, 'lien', e.target.value)} placeholder="/products?categorie=..." />
                </Field>
                <Field label="Bouton texte">
                  <Input value={card.bouton} onChange={e => setCard(i, 'bouton', e.target.value)} placeholder="J'achète" />
                </Field>
                <div className="space-y-2">
                  <Field label="Dégradé : couleur début">
                    <div className="flex items-center gap-2">
                      <input type="color" value={card.bgFrom || '#4c1d95'} onChange={e => setCard(i, 'bgFrom', e.target.value)} className="h-9 w-16 rounded-lg border border-slate-600 cursor-pointer bg-transparent" />
                      <span className="text-xs text-slate-400 font-mono">{card.bgFrom}</span>
                    </div>
                  </Field>
                  <Field label="Couleur fin">
                    <div className="flex items-center gap-2">
                      <input type="color" value={card.bgTo || '#c41e3a'} onChange={e => setCard(i, 'bgTo', e.target.value)} className="h-9 w-16 rounded-lg border border-slate-600 cursor-pointer bg-transparent" />
                      <span className="text-xs text-slate-400 font-mono">{card.bgTo}</span>
                    </div>
                  </Field>
                </div>
              </div>
              <ImageField label="Image de la carte (optionnel)" value={card.image || ''} onChange={v => setCard(i, 'image', v)} />
            </div>
          ))}
          {!(cfg.categoryCards?.items?.length) && (
            <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center text-slate-500 text-sm">Aucune carte. Cliquez sur "Ajouter une carte".</div>
          )}
        </div>
      )}

      {/* ── TAB: BANNIÈRES EXTRA ── */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">Bannières supplémentaires</h2>
            <button onClick={() => setCfg(p => ({ ...p, bannersExtra: [...(p.bannersExtra || []), { image: '', lien: '/products', titre: '' }] }))} className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm">
              <FiPlus className="w-4 h-4" /> Ajouter
            </button>
          </div>
          {(cfg.bannersExtra || []).map((b, i) => (
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium">Bannière {i + 1}</span>
                <button onClick={() => setCfg(p => ({ ...p, bannersExtra: p.bannersExtra.filter((_, j) => j !== i) }))} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
              <ImageField label="Image" value={b.image} onChange={v => setCfg(p => ({ ...p, bannersExtra: p.bannersExtra.map((x, j) => j === i ? { ...x, image: v } : x) }))} />
              <Field label="Lien">
                <Input value={b.lien} onChange={e => setCfg(p => ({ ...p, bannersExtra: p.bannersExtra.map((x, j) => j === i ? { ...x, lien: e.target.value } : x) }))} placeholder="/products" />
              </Field>
            </div>
          ))}
          {!(cfg.bannersExtra?.length) && (
            <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center text-slate-500 text-sm">Aucune bannière. Cliquez sur "Ajouter".</div>
          )}
        </div>
      )}

      {/* ── TAB: SEO ── */}
      {activeTab === 'seo' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Optimisation SEO</h2>
          <Field label="Meta Title" hint="Max 60 caractères recommandé">
            <Input value={cfg.seo.title} onChange={e => set('seo.title', e.target.value)} placeholder="Coupe du Monde 2026 | Meilleures Offres Tech — JSC-Market" />
            <p className="text-xs text-slate-500 mt-1">{cfg.seo.title.length}/60 car.</p>
          </Field>
          <Field label="Meta Description" hint="Max 160 caractères">
            <Textarea value={cfg.seo.description} onChange={e => set('seo.description', e.target.value)} rows={3} placeholder="JSC-Market vous prépare pour la Coupe du Monde 2026 !" />
            <p className="text-xs text-slate-500 mt-1">{cfg.seo.description.length}/160 car.</p>
          </Field>
          <Field label="Mots-clés (séparés par des virgules)">
            <Input value={cfg.seo.keywords} onChange={e => set('seo.keywords', e.target.value)} placeholder="coupe du monde 2026, TV 4K cameroun, smartphone mondial" />
          </Field>
          <ImageField label="Image OG (partage réseaux sociaux)" value={cfg.seo.image || ''} onChange={v => set('seo.image', v)} />
          <div className="bg-slate-700/50 rounded-xl p-4 mt-2">
            <p className="text-sm text-slate-400 mb-2">Aperçu Google</p>
            <p className="text-blue-400 text-sm font-medium truncate">{cfg.seo.title || 'Coupe du Monde 2026 | JSC-Market'}</p>
            <p className="text-green-400 text-xs">https://jsc-market.cm/world-cup-2026</p>
            <p className="text-slate-400 text-xs mt-1 line-clamp-2">{cfg.seo.description || 'Description de la page...'}</p>
          </div>
        </div>
      )}

      {/* Save bottom */}
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave className="w-4 h-4" />}
          Sauvegarder la configuration
        </button>
      </div>
    </div>
  )
}

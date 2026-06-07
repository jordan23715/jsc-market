import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiShoppingCart, FiHeart, FiTruck, FiShield, FiRefreshCw, FiMinus, FiPlus } from 'react-icons/fi';
import api, { getImageUrl } from '../../services/api';
import useCartStore from '../../context/CartContext';
import { toast } from 'react-toastify';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [tab, setTab] = useState('description');

  useEffect(() => {
    loadProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  // SEO dynamique à chaque chargement de produit
  useEffect(() => {
    if (!product) return;
    const prix = product.prixPromo && product.prixPromo < product.prix ? product.prixPromo : product.prix;
    const img = product.images?.[0] || '';
    const desc = product.seo?.metaDescription || product.description?.slice(0, 160) || `${product.nom} disponible sur JSC-Market Cameroun.`;
    const keywords = product.seo?.keywords || '';

    document.title = `${product.nom} | JSC-Market Cameroun`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', desc);

    // Meta keywords
    const setMetaName = (name, val) => {
      if (!val) return;
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
      el.setAttribute('content', val);
    };
    setMetaName('keywords', keywords);

    // Open Graph
    const setMeta = (prop, val) => {
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
      el.setAttribute('content', val);
    };
    setMeta('og:title', `${product.nom} | JSC-Market Cameroun`);
    setMeta('og:description', desc);
    setMeta('og:image', img);
    setMeta('og:type', 'product');
    setMeta('og:url', window.location.href);

    // JSON-LD structured data
    const existing = document.getElementById('product-jsonld');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.id = 'product-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.nom,
      description: product.description || desc,
      image: Array.isArray(product.images) ? product.images : [img],
      brand: { '@type': 'Brand', name: product.marque || 'JSC-Market' },
      offers: {
        '@type': 'Offer',
        price: prix,
        priceCurrency: 'XAF',
        availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: 'JSC-Market Cameroun' },
      },
    });
    document.head.appendChild(script);

    return () => {
      document.title = 'JSC-Market Cameroun | Site de vente en ligne leader';
      document.getElementById('product-jsonld')?.remove();
    };
  }, [product]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      // Essaie slug d'abord, sinon ID (rétrocompatibilité)
      const isId = /^[a-f0-9]{24}$/i.test(slug)
      const res = isId
        ? await api.get(`/products/${slug}`)
        : await api.get(`/products/slug/${slug}`)
      const p = res.data?.data?.product
      if (!p) throw new Error('Produit introuvable')
      // Rediriger vers l'URL propre si on a accédé par ID
      if (isId && p.slug) navigate(`/products/${p.slug}`, { replace: true })
      setProduct(p);
    } catch {
      toast.error('Produit non trouvé');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${quantity} × ${product.nom} ajouté au panier`, { position: 'bottom-right', autoClose: 2000 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const prixFinal = product.prixPromo && product.prixPromo < product.prix ? product.prixPromo : product.prix;
  const remise = product.prixPromo ? Math.round(((product.prix - product.prixPromo) / product.prix) * 100) : 0;
  const mainImageUrl = product.images?.length > 0
    ? getImageUrl(product.images[imageIndex])
    : 'https://via.placeholder.com/600x600?text=Produit';
  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-4 sm:py-6">

        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-4 flex-wrap">
          <Link to="/" className="hover:text-orange-500 transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-orange-500 transition-colors">Boutique</Link>
          {product.categorie && (
            <>
              <span>/</span>
              <Link
                to={`/products?categorie=${encodeURIComponent(product.categorie)}`}
                className="hover:text-orange-500 transition-colors"
              >
                {product.categorie}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-800 font-medium truncate max-w-[150px] sm:max-w-xs">{product.nom}</span>
        </div>

        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors mb-4 font-medium"
        >
          <FiArrowLeft className="w-4 h-4" /> Retour
        </button>

        {/* MAIN CARD */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* ── COLONNE IMAGE ── */}
            <div className="p-4 sm:p-6 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-100">

              {/* Image principale */}
              <div className="relative rounded-xl overflow-hidden bg-white aspect-square mb-3 shadow-inner">
                <img
                  src={mainImageUrl}
                  alt={product.nom}
                  className="w-full h-full object-contain p-4"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/600x600?text=Produit'; }}
                />
                {remise > 0 && (
                  <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow">
                    -{remise}%
                  </span>
                )}
                {lowStock && (
                  <span className="absolute top-3 right-3 bg-orange-400 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                    Plus que {product.stock} !
                  </span>
                )}
                {!inStock && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-white text-gray-800 font-bold px-4 py-2 rounded-xl text-sm">Épuisé</span>
                  </div>
                )}
              </div>

              {/* Miniatures */}
              {product.images?.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setImageIndex(idx)}
                      className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === imageIndex ? 'border-orange-500 shadow-md' : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <img
                        src={getImageUrl(img)}
                        alt={`${product.nom} ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/100x100'; }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── COLONNE INFOS ── */}
            <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">

              {/* Marque + Catégorie */}
              <div className="flex items-center gap-2 flex-wrap">
                {product.marque && (
                  <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">{product.marque}</span>
                )}
                {product.categorie && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{product.categorie}</span>
                )}
              </div>

              {/* Nom */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-snug">{product.nom}</h1>

              {/* Stock */}
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={`text-sm font-semibold ${inStock ? 'text-green-700' : 'text-red-600'}`}>
                  {!inStock ? 'Rupture de stock' : lowStock ? `Seulement ${product.stock} restant(s)` : 'En stock'}
                </span>
              </div>

              {/* PRIX */}
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-black text-orange-500">
                    {prixFinal.toLocaleString('fr-FR')}
                    <span className="text-lg ml-1">FCFA</span>
                  </span>
                  {remise > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-base text-gray-400 line-through">{product.prix.toLocaleString('fr-FR')} FCFA</span>
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">-{remise}%</span>
                    </div>
                  )}
                </div>
                {remise > 0 && (
                  <p className="text-xs text-green-700 font-semibold mt-1">
                    Vous économisez {(product.prix - prixFinal).toLocaleString('fr-FR')} FCFA
                  </p>
                )}
              </div>

              {/* QUANTITÉ */}
              {inStock && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantité</label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-700"
                      >
                        <FiMinus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-bold text-gray-900 border-x-2 border-gray-200 h-10 flex items-center justify-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-700"
                      >
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-xs text-gray-400">{product.stock} disponible(s)</span>
                  </div>
                </div>
              )}

              {/* BOUTONS */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors text-sm sm:text-base shadow-sm"
                >
                  <FiShoppingCart className="w-5 h-5" />
                  {inStock ? 'ACHETER' : 'Produit épuisé'}
                </button>
                <button className="sm:w-14 flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-red-300 hover:text-red-500 text-gray-500 rounded-xl py-3.5 transition-colors sm:py-0">
                  <FiHeart className="w-5 h-5" />
                  <span className="sm:hidden text-sm font-medium">Favoris</span>
                </button>
              </div>

              {/* GARANTIES */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                <div className="flex flex-col items-center text-center gap-1 p-2">
                  <FiTruck className="w-5 h-5 text-orange-400" />
                  <span className="text-xs text-gray-600 font-medium leading-tight">Livraison partout au Cameroun</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1 p-2">
                  <FiShield className="w-5 h-5 text-orange-400" />
                  <span className="text-xs text-gray-600 font-medium leading-tight">Produit authentique garanti</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1 p-2">
                  <FiRefreshCw className="w-5 h-5 text-orange-400" />
                  <span className="text-xs text-gray-600 font-medium leading-tight">Retour sous 7 jours</span>
                </div>
              </div>

              {/* PAIEMENTS */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 font-medium">Paiement :</span>
                {['Orange Money', 'MTN MoMo', 'Visa'].map(m => (
                  <span key={m} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ONGLETS DESCRIPTION */}
        <div className="bg-white rounded-2xl shadow-sm mt-4 sm:mt-6 overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-none">
            {[
              { key: 'description', label: 'Description' },
              { key: 'details', label: 'Détails' },
              { key: 'livraison', label: 'Livraison & Retours' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 sm:px-6 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  tab === t.key
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Contenu onglet */}
          <div className="p-4 sm:p-6">

            {tab === 'description' && (
              <div className="space-y-4">
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                  {product.description || 'Aucune description disponible pour ce produit.'}
                </p>
                {product.descriptionLongue && product.descriptionLongue !== product.description && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                      {product.descriptionLongue}
                    </p>
                  </div>
                )}
              </div>
            )}

            {tab === 'details' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Marque', value: product.marque },
                  { label: 'Catégorie', value: product.categorie },
                  { label: 'Référence', value: product._id?.slice(-8).toUpperCase() },
                  { label: 'Stock disponible', value: product.stock > 0 ? `${product.stock} unité(s)` : 'Épuisé' },
                  { label: 'Prix original', value: product.prix ? `${product.prix.toLocaleString('fr-FR')} FCFA` : null },
                  { label: 'Prix promo', value: product.prixPromo ? `${product.prixPromo.toLocaleString('fr-FR')} FCFA` : null },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-gray-50">
                    <span className="text-sm text-gray-500 font-medium">{row.label}</span>
                    <span className="text-sm text-gray-900 font-semibold text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'livraison' && (
              <div className="space-y-4 text-sm sm:text-base text-gray-700">
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl">
                  <FiTruck className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Livraison</p>
                    <p className="text-gray-600 text-sm">Livraison gratuite dès 50 000 FCFA d'achat. Frais de 2 500 FCFA en dessous.</p>
                    <p className="text-gray-600 text-sm mt-1">Délai : 24h–72h selon votre ville.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                  <FiRefreshCw className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Retours</p>
                    <p className="text-gray-600 text-sm">Retour accepté sous 7 jours après réception si le produit est défectueux ou non conforme.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                  <FiShield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Garantie</p>
                    <p className="text-gray-600 text-sm">Tous nos produits sont authentiques et garantis. Contactez-nous au +237 692 45 93 55 pour toute réclamation.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOUTON RETOUR BAS DE PAGE */}
        <div className="mt-6 flex justify-center">
          <Link
            to="/products"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 transition-colors font-medium"
          >
            <FiArrowLeft className="w-4 h-4" /> Continuer mes achats
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;

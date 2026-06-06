import api from '../../services/api'

export default {
  // PRODUCTS
  async getProducts(params = {}){
    const res = await api.get('/products', { params })
    return res.data?.data?.products ?? []
  },
  async getProductsAdmin(params = {}){
    const res = await api.get('/admin/products', { params })
    const { products = [], total = 0 } = res.data?.data ?? {}
    return { products, total }
  },
  async getProductById(id){
    const res = await api.get(`/products/${id}`)
    return res.data?.data?.product ?? null
  },
  async createProduct(payload){
    const res = await api.post('/admin/products', payload)
    return res.data?.data?.product ?? null
  },
  async updateProduct(id, payload){
    const res = await api.put(`/admin/products/${id}`, payload)
    return res.data?.data?.product ?? null
  },
  async deleteProduct(id){
    const res = await api.delete(`/admin/products/${id}`)
    return res.data
  },

  // CATEGORIES
  async getCategories(){
    const res = await api.get('/admin/categories')
    return res.data.data.categories || []
  },
  async uploadImages(files, folder = 'products'){
    const CLOUD = 'doxgdg2h1'
    const PRESET = 'jscmarket_upload'
    const urls = await Promise.all(files.map(async (file) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', PRESET)
      fd.append('folder', `jscmarket/${folder}`)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!data.secure_url) throw new Error(data.error?.message || 'Upload Cloudinary échoué')
      return data.secure_url
    }))
    return urls
  },
  async createCategory(payload){
    const res = await api.post('/admin/categories', payload)
    return res.data.data.category
  },
  async updateCategory(id, payload){
    const res = await api.put(`/admin/categories/${id}`, payload)
    return res.data.data.category
  },
  async deleteCategory(id){
    const res = await api.delete(`/admin/categories/${id}`)
    return res.data
  },

  // ORDERS
  async getOrders(){
    const res = await api.get('/admin/orders')
    return res.data.data.orders
  },
  async getOrderById(id){
    const res = await api.get(`/admin/orders/${id}`)
    return res.data.data.order
  },
  async updateOrderStatus(id, statut){
    const res = await api.put(`/admin/orders/${id}/status`, { statut })
    return res.data.data.order
  },
  async createManualOrder(payload){
    const res = await api.post('/admin/orders', payload)
    return res.data.data.order
  },
  async deleteOrder(id){
    const res = await api.delete(`/admin/orders/${id}`)
    return res.data
  },

  // CUSTOMERS
  async getCustomers(){
    const res = await api.get('/admin/customers')
    return res.data.data.users
  },
  async updateCustomerRole(id, role){
    const res = await api.put(`/admin/customers/${id}/role`, { role })
    return res.data.data.user
  },

  // REPORTS
  async getStats(){
    try{
      const [productsRes, ordersRes, customersRes] = await Promise.all([
        api.get('/products', { params: { limit: 1 } }),
        api.get('/admin/orders'),
        api.get('/admin/customers'),
      ])

      const productsCount = productsRes.data.data.pagination?.totalItems ?? productsRes.data.data.products.length
      const orders = ordersRes.data.data.orders || []
      const customers = customersRes.data.data.users || []
      const revenue = orders.reduce((s,o)=>s + (o.montantFinal ?? o.montantTotal ?? 0), 0)

      return { sales: orders.length, orders: orders.length, customers: customers.length, revenue }
    }catch(err){
      return { sales: 0, orders: 0, customers: 0, revenue: 0 }
    }
  },

  async getSalesReport(range){
    const res = await api.get('/admin/reports/sales', { params: range })
    return res.data.data
  },

  // BANNERS
  async getBanners(){
    const res = await api.get('/admin/banners')
    return res.data.data.banners || []
  },
  async createBanner(payload){
    const res = await api.post('/admin/banners', payload)
    return res.data.data.banner
  },
  async updateBanner(id, payload){
    const res = await api.put(`/admin/banners/${id}`, payload)
    return res.data.data.banner
  },
  async deleteBanner(id){
    const res = await api.delete(`/admin/banners/${id}`)
    return res.data
  },

  // POPUPS
  async getPopups(){
    const res = await api.get('/admin/popups')
    return res.data.data.popups || []
  },
  async createPopup(payload){
    const res = await api.post('/admin/popups', payload)
    return res.data.data.popup
  },
  async updatePopup(id, payload){
    const res = await api.put(`/admin/popups/${id}`, payload)
    return res.data.data.popup
  },
  async deletePopup(id){
    const res = await api.delete(`/admin/popups/${id}`)
    return res.data
  },

  // REPORTS & STATS
  async getMonthlySalesReport(){
    const res = await api.get('/admin/reports/monthly')
    return res.data.data.monthlySales || []
  },
  async getDashboardStats(){
    const res = await api.get('/admin/stats')
    return res.data.data || {}
  },

  // USERS (Admin management)
  async getUsers(){
    const res = await api.get('/admin/users')
    return res.data.data.users || []
  },
  async createUser(payload){
    const res = await api.post('/admin/users', payload)
    return res.data.data.user
  },
  async updateUser(id, payload){
    const res = await api.put(`/admin/users/${id}`, payload)
    return res.data.data.user
  },
  async deleteUser(id){
    const res = await api.delete(`/admin/users/${id}`)
    return res.data
  },

  // AUTH
  async login({ email, password }){
    const res = await api.post('/auth/login', { email, password })
    return res.data.data
  },

  getRoles(){ return ['admin', 'manager', 'agent', 'responsable_magasin', 'client'] },

  // ACCOUNTING
  async getAccountingOrders(){
    const res = await api.get('/admin/accounting/orders')
    return res.data.data?.orders || []
  },
  async getExpenses(){
    const res = await api.get('/admin/accounting/expenses')
    return res.data.data?.expenses || []
  },
  async createExpense(payload){
    const res = await api.post('/admin/accounting/expenses', payload)
    return res.data.expense || res.data.data?.expense || res.data
  },
  async updateExpense(id, payload){
    const res = await api.put(`/admin/accounting/expenses/${id}`, payload)
    return res.data.expense || res.data.data?.expense || res.data
  },
  async deleteExpense(id){
    const res = await api.delete(`/admin/accounting/expenses/${id}`)
    return res.data
  },

  // SHIPPING
  async getShippingConfig(){
    const res = await api.get('/shipping/config')
    return res.data.data || { zones: [], partners: [] }
  },
  async getShippingZones(){
    const res = await api.get('/shipping/zones')
    return res.data.data?.zones || []
  },
  async createShippingZone(payload){
    const res = await api.post('/shipping/zones', payload)
    return res.data.data?.zone
  },
  async updateShippingZone(id, payload){
    const res = await api.put(`/shipping/zones/${id}`, payload)
    return res.data.data?.zone
  },
  async deleteShippingZone(id){
    const res = await api.delete(`/shipping/zones/${id}`)
    return res.data
  },
  async getShippingPartners(){
    const res = await api.get('/shipping/partners')
    return res.data.data?.partners || []
  },
  async createShippingPartner(payload){
    const res = await api.post('/shipping/partners', payload)
    return res.data.data?.partner
  },
  async updateShippingPartner(id, payload){
    const res = await api.put(`/shipping/partners/${id}`, payload)
    return res.data.data?.partner
  },
  async deleteShippingPartner(id){
    const res = await api.delete(`/shipping/partners/${id}`)
    return res.data
  },

  // PAYMENTS
  async getPayments(){
    const res = await api.get('/admin/payments')
    return res.data.data?.payments || []
  },
  async getPaymentProviders(){
    const res = await api.get('/admin/payment-providers')
    return res.data.data || { providers: [], mode: 'sandbox' }
  },

  // HOMEPAGE CONFIG
  async getHomepageConfig(){
    const res = await api.get('/admin/homepage-config')
    return res.data.data || {}
  },
  async updateHomepageConfig(payload){
    const res = await api.put('/admin/homepage-config', payload)
    return res.data.data || {}
  },
  async getPublicBanners(position){
    const params = position ? { position } : {}
    const res = await api.get('/admin/public/banners', { params })
    return res.data.data?.banners || []
  },
  async getPublicHomepageConfig(){
    const res = await api.get('/admin/public/homepage-config')
    return res.data.data || {}
  },

  // RETURNS
  async getReturns(){
    const res = await api.get('/admin/returns')
    return res.data.data.returns || []
  },
  async createReturn(payload){
    const res = await api.post('/admin/returns', payload)
    return res.data.data.return
  },
  async updateReturn(id, payload){
    const res = await api.put(`/admin/returns/${id}`, payload)
    return res.data.data.return
  },
  async deleteReturn(id){
    const res = await api.delete(`/admin/returns/${id}`)
    return res.data
  },
}


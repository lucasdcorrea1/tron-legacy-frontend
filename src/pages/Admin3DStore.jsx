import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { products3d, categories3d, admin3d, imageUrl } from '../services/api3d';
import AdminLayout from '../components/AdminLayout';
import './Admin3DStore.css';

export default function Admin3DStore() {
  const { profile } = useAuth();
  const isSuperuser = profile?.role === 'superuser' || profile?.role === 'superadmin';
  const [tab, setTab] = useState('products');

  if (!isSuperuser) {
    return (
      <AdminLayout>
        <div className="s3d-admin">
          <div className="s3d-empty">Acesso restrito a Super Administradores.</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="s3d-admin">
        <div className="s3d-header">
          <h1>3D Store</h1>
          <p>Gerencie produtos, categorias e pedidos da loja 3D</p>
        </div>

        <div className="s3d-tabs">
          <button className={`s3d-tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>
            Produtos
          </button>
          <button className={`s3d-tab ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}>
            Categorias
          </button>
          <button className={`s3d-tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
            Pedidos
          </button>
        </div>

        {tab === 'products' && <ProductsTab />}
        {tab === 'categories' && <CategoriesTab />}
        {tab === 'orders' && <OrdersTab />}
      </div>
    </AdminLayout>
  );
}

// ── Products Tab ────────────────────────────────────────────────────

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '', description: '', price: '', category_id: '',
    material: '', dimensions: '', weight: '', print_time_hours: '',
    stock: '', featured: false, images: [],
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await admin3d.products.list({ limit: 100 });
      setProducts(data.products || []);
    } catch { }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const data = await categories3d.list();
      setCategories(data.categories || []);
    } catch { }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', category_id: '', material: '', dimensions: '', weight: '', print_time_hours: '', stock: '', featured: false, images: [] });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      category_id: product.category_id,
      material: product.material || '',
      dimensions: product.dimensions || '',
      weight: product.weight ? String(product.weight) : '',
      print_time_hours: product.print_time_hours ? String(product.print_time_hours) : '',
      stock: String(product.stock),
      featured: product.featured,
      images: product.images || [],
    });
    setEditing(product.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price) || 0,
      category_id: form.category_id,
      material: form.material,
      dimensions: form.dimensions,
      weight: parseFloat(form.weight) || 0,
      print_time_hours: parseFloat(form.print_time_hours) || 0,
      stock: parseInt(form.stock) || 0,
      featured: form.featured,
      images: form.images,
    };
    try {
      if (editing) {
        await admin3d.products.update(editing, data);
      } else {
        await admin3d.products.create(data);
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deletar este produto?')) return;
    try {
      await admin3d.products.delete(id);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await admin3d.products.update(product.id, { active: !product.active });
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const formatPrice = (price) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const data = await admin3d.images.upload(file);
        setForm(f => ({ ...f, images: [...f.images, data.group_id] }));
      }
    } catch (err) {
      alert('Erro no upload: ' + err.message);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = async (index) => {
    const groupId = form.images[index];
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
    try {
      await admin3d.images.deleteGroup(groupId);
    } catch { /* image may have been an old URL, ignore */ }
  };

  return (
    <div className="s3d-tab-content">
      <div className="s3d-tab-header">
        <span>{products.length} produto(s)</span>
        <button className="s3d-btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          + Novo Produto
        </button>
      </div>

      {showForm && (
        <form className="s3d-form" onSubmit={handleSubmit}>
          <h3>{editing ? 'Editar Produto' : 'Novo Produto'}</h3>
          <div className="s3d-form-grid">
            <div className="s3d-field">
              <label>Nome *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="s3d-field">
              <label>Preco (R$) *</label>
              <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
            </div>
            <div className="s3d-field">
              <label>Categoria *</label>
              <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} required>
                <option value="">Selecionar...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="s3d-field">
              <label>Estoque</label>
              <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
            </div>
            <div className="s3d-field">
              <label>Material</label>
              <input value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} />
            </div>
            <div className="s3d-field">
              <label>Dimensoes</label>
              <input value={form.dimensions} onChange={e => setForm(f => ({ ...f, dimensions: e.target.value }))} placeholder="Ex: 10x5x3 cm" />
            </div>
            <div className="s3d-field">
              <label>Peso (g)</label>
              <input type="number" step="0.1" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
            </div>
            <div className="s3d-field">
              <label>Tempo de impressao (h)</label>
              <input type="number" step="0.1" value={form.print_time_hours} onChange={e => setForm(f => ({ ...f, print_time_hours: e.target.value }))} />
            </div>
          </div>
          <div className="s3d-field full">
            <label>Descricao</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="s3d-field">
            <label className="s3d-checkbox">
              <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
              Destaque
            </label>
          </div>
          <div className="s3d-field full">
            <label>Imagens</label>
            <div className="s3d-images-list">
              {form.images.map((groupId, i) => (
                <div key={i} className="s3d-image-item">
                  <img src={imageUrl(groupId, 'thumb')} alt="" />
                  <button type="button" onClick={() => removeImage(i)}>x</button>
                </div>
              ))}
              <label className={`s3d-upload-btn ${uploading ? 'uploading' : ''}`}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                  hidden
                />
                {uploading ? 'Enviando...' : '+ Upload'}
              </label>
            </div>
          </div>
          <div className="s3d-form-actions">
            <button type="button" className="s3d-btn-outline" onClick={resetForm}>Cancelar</button>
            <button type="submit" className="s3d-btn-primary">{editing ? 'Salvar' : 'Criar'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="s3d-loading">Carregando...</div>
      ) : products.length === 0 ? (
        <div className="s3d-empty">Nenhum produto cadastrado.</div>
      ) : (
        <div className="s3d-table-wrap">
          <table className="s3d-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preco</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className={!p.active ? 's3d-inactive' : ''}>
                  <td>
                    <div className="s3d-product-cell">
                      {p.images && p.images.length > 0 ? (
                        <img src={imageUrl(p.images[0], 'thumb')} alt="" className="s3d-thumb" />
                      ) : (
                        <div className="s3d-thumb-placeholder" />
                      )}
                      <div>
                        <strong>{p.name}</strong>
                        {p.featured && <span className="s3d-badge-feat">Destaque</span>}
                        <br /><span className="s3d-slug">{p.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td>{formatPrice(p.price)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <button className={`s3d-status-btn ${p.active ? 'active' : 'inactive'}`} onClick={() => handleToggleActive(p)}>
                      {p.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td>
                    <div className="s3d-actions">
                      <button className="s3d-btn-sm" onClick={() => handleEdit(p)}>Editar</button>
                      <button className="s3d-btn-sm danger" onClick={() => handleDelete(p.id)}>Deletar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Categories Tab ──────────────────────────────────────────────────

function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', image: '', sort_order: '0' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categories3d.list();
      setCategories(data.categories || []);
    } catch { }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ name: '', description: '', image: '', sort_order: '0' });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (cat) => {
    setForm({
      name: cat.name,
      description: cat.description || '',
      image: cat.image || '',
      sort_order: String(cat.sort_order || 0),
    });
    setEditing(cat.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: form.name,
      description: form.description,
      image: form.image,
      sort_order: parseInt(form.sort_order) || 0,
    };
    try {
      if (editing) {
        await admin3d.categories.update(editing, data);
      } else {
        await admin3d.categories.create(data);
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deletar esta categoria?')) return;
    try {
      await admin3d.categories.delete(id);
      fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="s3d-tab-content">
      <div className="s3d-tab-header">
        <span>{categories.length} categoria(s)</span>
        <button className="s3d-btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          + Nova Categoria
        </button>
      </div>

      {showForm && (
        <form className="s3d-form" onSubmit={handleSubmit}>
          <h3>{editing ? 'Editar Categoria' : 'Nova Categoria'}</h3>
          <div className="s3d-form-grid">
            <div className="s3d-field">
              <label>Nome *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="s3d-field">
              <label>Ordem</label>
              <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
            </div>
            <div className="s3d-field">
              <label>Imagem (URL)</label>
              <input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} />
            </div>
          </div>
          <div className="s3d-field full">
            <label>Descricao</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="s3d-form-actions">
            <button type="button" className="s3d-btn-outline" onClick={resetForm}>Cancelar</button>
            <button type="submit" className="s3d-btn-primary">{editing ? 'Salvar' : 'Criar'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="s3d-loading">Carregando...</div>
      ) : categories.length === 0 ? (
        <div className="s3d-empty">Nenhuma categoria cadastrada.</div>
      ) : (
        <div className="s3d-table-wrap">
          <table className="s3d-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Slug</th>
                <th>Ordem</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td className="s3d-slug">{c.slug}</td>
                  <td>{c.sort_order}</td>
                  <td>
                    <div className="s3d-actions">
                      <button className="s3d-btn-sm" onClick={() => handleEdit(c)}>Editar</button>
                      <button className="s3d-btn-sm danger" onClick={() => handleDelete(c.id)}>Deletar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Orders Tab ──────────────────────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await admin3d.orders.list({ limit: 50, status: statusFilter || undefined });
      setOrders(data.orders || []);
    } catch { }
    setLoading(false);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await admin3d.orders.updateStatus(orderId, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePaymentChange = async (orderId, paymentStatus) => {
    try {
      await admin3d.orders.updateStatus(orderId, { payment_status: paymentStatus });
      fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const statusLabels = {
    pending: 'Pendente', confirmed: 'Confirmado', printing: 'Imprimindo',
    shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado',
  };

  const paymentLabels = {
    pending: 'Pendente', paid: 'Pago', refunded: 'Reembolsado', failed: 'Falhou',
  };

  return (
    <div className="s3d-tab-content">
      <div className="s3d-tab-header">
        <div className="s3d-order-filters">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Todos os status</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <span>{orders.length} pedido(s)</span>
      </div>

      {loading ? (
        <div className="s3d-loading">Carregando...</div>
      ) : orders.length === 0 ? (
        <div className="s3d-empty">Nenhum pedido encontrado.</div>
      ) : (
        <div className="s3d-orders-list">
          {orders.map(order => (
            <div key={order.id} className="s3d-order-card">
              <div className="s3d-order-header">
                <div>
                  <strong>#{order.id.slice(-8)}</strong>
                  <span className="s3d-order-date">{formatDate(order.created_at)}</span>
                </div>
                <span className="s3d-order-total">{formatPrice(order.total)}</span>
              </div>
              <div className="s3d-order-items">
                {order.items.map((item, i) => (
                  <div key={i} className="s3d-order-item">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatPrice(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="s3d-order-address">
                {order.shipping_address.name} - {order.shipping_address.street}, {order.shipping_address.number} - {order.shipping_address.city}/{order.shipping_address.state} - CEP {order.shipping_address.zip_code}
              </div>
              {order.notes && <div className="s3d-order-notes">Obs: {order.notes}</div>}
              <div className="s3d-order-controls">
                <div className="s3d-control-group">
                  <label>Status:</label>
                  <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)}>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="s3d-control-group">
                  <label>Pagamento:</label>
                  <select value={order.payment_status} onChange={e => handlePaymentChange(order.id, e.target.value)}>
                    {Object.entries(paymentLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

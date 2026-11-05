import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Product } from '../lib/types'
import { Empty, ErrorBox, PageHeader, Spinner, money } from '../components/ui'

const blank = { name: '', price: '', quantity: '', description: '', image: '' }

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.readAsDataURL(file)
  })
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '??'
  )
}

function ProductImage({ src, name, className }: { src?: string; name: string; className?: string }) {
  const [broken, setBroken] = useState(false)
  if (!src || broken) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-panel2 to-edge ${className ?? ''}`}>
        <span className="text-lg font-black text-slate-500">{initials(name)}</span>
      </div>
    )
  }
  return <img src={src} alt={name} className={className} onError={() => setBroken(true)} />
}

export default function Products() {
  const { user, refresh } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [products, setProducts] = useState<Product[]>(() => api.peek<{ products: Product[] }>('/products')?.products ?? [])
  const [loading, setLoading] = useState(() => api.peek('/products') === undefined)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState<Product | null>(null)
  const [qty, setQty] = useState<Record<string, string>>({})

  const load = useCallback(() => {
    setLoading(api.peek('/products') === undefined)
    api
      .get<{ products: Product[] }>('/products')
      .then((d) => setProducts(d.products))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function pickImage(e: ChangeEvent<HTMLInputElement>, apply: (url: string) => void) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > 1_500_000) {
      setError('Image must be smaller than 1.5 MB.')
      return
    }
    try {
      apply(await readImage(file))
      setError('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMsg('')
    try {
      await api.post('/products', {
        name: form.name,
        price: Number(form.price),
        quantity: Number(form.quantity) || 0,
        description: form.description,
        image: form.image,
      })
      setForm(blank)
      setMsg('Product created.')
      load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editing) return
    setError('')
    try {
      await api.patch(`/products/${editing._id}`, {
        name: editing.Product_name,
        price: Number(editing.Price),
        quantity: Number(editing.Quantity),
        description: editing.Description,
        image: editing.Image,
      })
      setEditing(null)
      setMsg('Product updated.')
      load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function remove(p: Product) {
    if (!window.confirm(`Delete ${p.Product_name}?`)) return
    setError('')
    try {
      await api.del(`/products/${p._id}`)
      setMsg('Product deleted.')
      load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function buy(p: Product) {
    const q = Number(qty[p._id] || 1)
    setError('')
    setMsg('')
    try {
      await api.post(`/products/${p._id}/buy`, { quantity: q })
      setMsg(`Bought ${q} × ${p.Product_name}.`)
      setQty((s) => ({ ...s, [p._id]: '1' }))
      await refresh()
      load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Products (admin)' : 'Shop'}
        subtitle={isAdmin ? 'Create, edit and delete drops.' : 'Spend your points on drops and keep your network growing.'}
      />
      {error && <div className="mb-4"><ErrorBox message={error} /></div>}
      {msg && (
        <div className="mb-4 rounded-xl border border-lime/40 bg-lime/10 px-4 py-3 text-sm text-lime">{msg}</div>
      )}

      {isAdmin && (
        <form onSubmit={create} className="card mb-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="field" placeholder="Product name" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="field" placeholder="Price" type="number" min="0" step="any" required value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <input className="field" placeholder="Stock" type="number" min="0" value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="field" placeholder="Image URL (or upload a file)" value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })} />
            <label className="btn-ghost cursor-pointer text-sm">
              {form.image ? 'Change image' : 'Upload image'}
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => pickImage(e, (url) => setForm((f) => ({ ...f, image: url })))} />
            </label>
          </div>
          <input className="field" placeholder="Description"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex items-center gap-3">
            {form.image && (
              <ProductImage src={form.image} name={form.name || 'New product'}
                className="h-16 w-24 shrink-0 rounded-lg object-cover" />
            )}
            <button className="btn-primary">Add product</button>
          </div>
        </form>
      )}

      {loading ? (
        <Spinner />
      ) : products.length === 0 ? (
        <Empty>No products yet.</Empty>
      ) : isAdmin ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>Image</th><th>Name</th><th>Price</th><th>Stock</th><th>Description</th><th /></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <ProductImage src={p.Image} name={p.Product_name}
                      className="h-10 w-14 rounded-md object-cover" />
                  </td>
                  <td className="font-medium text-white">{p.Product_name}</td>
                  <td className="text-lime">{money(p.Price)}</td>
                  <td>{money(p.Quantity)}</td>
                  <td className="max-w-xs truncate text-slate-400">{p.Description}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setEditing({ ...p })}>Edit</button>
                      <button className="btn-danger !px-3 !py-1.5 text-xs" onClick={() => remove(p)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p._id} className="card flex flex-col">
              <ProductImage src={p.Image} name={p.Product_name}
                className="mb-3 aspect-[16/10] w-full rounded-xl object-cover" />
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white">{p.Product_name}</h3>
                <span className="pill text-lime">{money(p.Price)} pts</span>
              </div>
              <p className="mt-1 flex-1 text-sm text-slate-400">{p.Description || 'No description.'}</p>
              <div className="mt-2 text-xs text-slate-500">{money(p.Quantity)} in stock</div>
              <div className="mt-4 flex gap-2">
                <input
                  type="number" min="1" max={p.Quantity}
                  className="field !w-20 !py-2 text-center"
                  value={qty[p._id] ?? '1'}
                  onChange={(e) => setQty((s) => ({ ...s, [p._id]: e.target.value }))}
                />
                <button
                  className="btn-primary flex-1"
                  disabled={p.Quantity <= 0}
                  onClick={() => buy(p)}
                >
                  {p.Quantity <= 0 ? 'Sold out' : 'Buy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditing(null)}>
          <form onSubmit={saveEdit} className="card w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white">Edit product</h2>
            <div className="mt-4 grid gap-3">
              <input className="field" value={editing.Product_name}
                onChange={(e) => setEditing({ ...editing, Product_name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className="field" type="number" step="any" value={editing.Price}
                  onChange={(e) => setEditing({ ...editing, Price: Number(e.target.value) })} />
                <input className="field" type="number" value={editing.Quantity}
                  onChange={(e) => setEditing({ ...editing, Quantity: Number(e.target.value) })} />
              </div>
              <textarea className="field" rows={3} value={editing.Description}
                onChange={(e) => setEditing({ ...editing, Description: e.target.value })} />
              <input className="field" placeholder="Image URL (or upload a file)" value={editing.Image}
                onChange={(e) => setEditing({ ...editing, Image: e.target.value })} />
              <div className="flex items-center gap-3">
                <ProductImage src={editing.Image} name={editing.Product_name}
                  className="h-16 w-24 shrink-0 rounded-lg object-cover" />
                <label className="btn-ghost cursor-pointer text-sm">
                  Upload image
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => pickImage(e, (url) => setEditing((p) => (p ? { ...p, Image: url } : p)))} />
                </label>
                {editing.Image && (
                  <button type="button" className="btn-ghost text-xs"
                    onClick={() => setEditing({ ...editing, Image: '' })}>
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary">Save</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

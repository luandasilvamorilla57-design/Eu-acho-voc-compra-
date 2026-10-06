import {useCallback,useEffect,useMemo,useState} from 'react'
import {supabase} from '../lib/supabase'
import type {AddExpenseInput,CashEntry,ControlSettings,Customer,NewProductInput,Product,ProductExpense,ProductPhoto,RegisterSaleInput,Sale,SaleItem} from './types'

const db=supabase as any
const PHOTO_BUCKET='control-product-photos'

function asNumber<T extends Record<string,any>>(rows:T[],keys:string[]){
  return rows.map(row=>{
    const next:Record<string,any>={...row}
    for(const key of keys)if(next[key]!==null&&next[key]!==undefined)next[key]=Number(next[key])
    return next as T
  })
}

export function useControlData(userId:string){
  const [settings,setSettings]=useState<ControlSettings|null>(null)
  const [products,setProducts]=useState<Product[]>([])
  const [photos,setPhotos]=useState<ProductPhoto[]>([])
  const [expenses,setExpenses]=useState<ProductExpense[]>([])
  const [sales,setSales]=useState<Sale[]>([])
  const [saleItems,setSaleItems]=useState<SaleItem[]>([])
  const [cashEntries,setCashEntries]=useState<CashEntry[]>([])
  const [customers,setCustomers]=useState<Customer[]>([])
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState<string|null>(null)

  const load=useCallback(async()=>{
    if(!userId)return
    setError(null)
    try{
      const current=await db.from('control_settings').select('*').eq('user_id',userId).maybeSingle()
      if(current.error)throw current.error
      if(!current.data){
        const inserted=await db.from('control_settings').insert({user_id:userId}).select('*').single()
        if(inserted.error)throw inserted.error
        setSettings(inserted.data as ControlSettings)
      }else setSettings(current.data as ControlSettings)

      const [p,ph,e,s,si,c,cu]=await Promise.all([
        db.from('control_products').select('*').order('created_at',{ascending:false}),
        db.from('control_product_photos').select('*').order('position',{ascending:true}),
        db.from('control_product_expenses').select('*').order('occurred_at',{ascending:false}),
        db.from('control_sales').select('*').order('sale_date',{ascending:false}).order('created_at',{ascending:false}),
        db.from('control_sale_items').select('*').order('created_at',{ascending:false}),
        db.from('control_cash_entries').select('*').order('occurred_at',{ascending:false}).order('created_at',{ascending:false}),
        db.from('control_customers').select('*').order('name',{ascending:true})
      ])
      for(const result of [p,ph,e,s,si,c,cu])if(result.error)throw result.error

      const rawPhotos=(ph.data||[]) as ProductPhoto[]
      const signed=await Promise.all(rawPhotos.map(async photo=>{
        const result=await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(photo.storage_path,3600)
        return {...photo,signed_url:result.data?.signedUrl||null}
      }))

      setProducts(asNumber((p.data||[]) as Product[],['purchase_unit_cost','listed_price','minimum_price']))
      setPhotos(signed)
      setExpenses(asNumber((e.data||[]) as ProductExpense[],['amount']))
      setSales((s.data||[]) as Sale[])
      setSaleItems(asNumber((si.data||[]) as SaleItem[],['unit_price']))
      setCashEntries(asNumber((c.data||[]) as CashEntry[],['amount']))
      setCustomers((cu.data||[]) as Customer[])
    }catch(err:any){
      setError(err?.message||'Não foi possível carregar seus dados.')
    }finally{
      setLoading(false)
    }
  },[userId])

  useEffect(()=>{void load()},[load])

  const createProduct=useCallback(async(input:NewProductInput,files:File[])=>{
    setBusy(true);setError(null)
    try{
      const rpc=await db.rpc('control_create_product',{
        p_name:input.name,
        p_purchase_unit_cost:input.purchaseUnitCost,
        p_quantity:input.quantity,
        p_purchase_date:input.purchaseDate,
        p_category:input.category||null,
        p_source:input.source||null,
        p_listed_price:input.listedPrice??null,
        p_minimum_price:input.minimumPrice??null,
        p_notes:input.notes||null
      })
      if(rpc.error)throw rpc.error
      const productId=String(rpc.data)

      for(let index=0;index<Math.min(files.length,8);index++){
        const file=files[index]
        if(file.size>10*1024*1024)throw new Error('Cada foto pode ter no máximo 10 MB.')
        const ext=(file.name.split('.').pop()||'jpg').toLowerCase()
        const safeExt=['jpg','jpeg','png','webp','heic','heif'].includes(ext)?ext:'jpg'
        const path=`${userId}/${productId}/${crypto.randomUUID()}.${safeExt}`
        const uploaded=await supabase.storage.from(PHOTO_BUCKET).upload(path,file,{cacheControl:'3600',upsert:false})
        if(uploaded.error)throw uploaded.error
        const photo=await db.from('control_product_photos').insert({
          user_id:userId,product_id:productId,storage_path:path,stage:'purchase',position:index
        })
        if(photo.error){
          await supabase.storage.from(PHOTO_BUCKET).remove([path])
          throw photo.error
        }
      }
      await load()
      return productId
    }finally{setBusy(false)}
  },[load,userId])

  const registerSale=useCallback(async(input:RegisterSaleInput)=>{
    setBusy(true);setError(null)
    try{
      const result=await db.rpc('control_register_sale',{
        p_product_id:input.productId,
        p_quantity:input.quantity,
        p_unit_price:input.unitPrice,
        p_sale_date:input.saleDate,
        p_payment_method:input.paymentMethod,
        p_customer_id:input.customerId||null,
        p_notes:input.notes||null
      })
      if(result.error)throw result.error
      await load()
      return String(result.data)
    }finally{setBusy(false)}
  },[load])

  const addExpense=useCallback(async(input:AddExpenseInput)=>{
    setBusy(true);setError(null)
    try{
      const result=await db.rpc('control_add_product_expense',{
        p_product_id:input.productId,
        p_amount:input.amount,
        p_expense_type:input.expenseType,
        p_description:input.description||null,
        p_occurred_at:input.occurredAt
      })
      if(result.error)throw result.error
      await load()
    }finally{setBusy(false)}
  },[load])

  const addCashEntry=useCallback(async(input:{kind:'income'|'expense';category:string;description:string;amount:number;occurredAt:string})=>{
    setBusy(true);setError(null)
    try{
      const result=await db.from('control_cash_entries').insert({
        user_id:userId,kind:input.kind,category:input.category,description:input.description,
        amount:input.amount,occurred_at:input.occurredAt
      })
      if(result.error)throw result.error
      await load()
    }finally{setBusy(false)}
  },[load,userId])

  const updateSettings=useCallback(async(patch:Partial<Pick<ControlSettings,'business_name'|'initial_cash'|'stock_alert_days'|'onboarding_completed'>>)=>{
    setBusy(true);setError(null)
    try{
      const result=await db.from('control_settings').update(patch).eq('user_id',userId).select('*').single()
      if(result.error)throw result.error
      setSettings(result.data as ControlSettings)
    }finally{setBusy(false)}
  },[userId])

  const updateProduct=useCallback(async(productId:string,patch:Partial<Product>)=>{
    setBusy(true);setError(null)
    try{
      const allowed:any={}
      for(const key of ['name','category','brand','model','condition','sku','source','seller_name','listed_price','minimum_price','status','notes']){
        if(key in patch)allowed[key]=(patch as any)[key]
      }
      const result=await db.from('control_products').update(allowed).eq('id',productId)
      if(result.error)throw result.error
      await load()
    }finally{setBusy(false)}
  },[load])

  const createCustomer=useCallback(async(name:string,phone?:string)=>{
    const result=await db.from('control_customers').insert({user_id:userId,name:name.trim(),phone:phone?.trim()||null}).select('*').single()
    if(result.error)throw result.error
    await load()
    return result.data as Customer
  },[load,userId])

  const grouped=useMemo(()=>{
    const photosByProduct=new Map<string,ProductPhoto[]>()
    for(const photo of photos)photosByProduct.set(photo.product_id,[...(photosByProduct.get(photo.product_id)||[]),photo])
    const expensesByProduct=new Map<string,ProductExpense[]>()
    for(const expense of expenses)expensesByProduct.set(expense.product_id,[...(expensesByProduct.get(expense.product_id)||[]),expense])
    const itemsBySale=new Map<string,SaleItem[]>()
    for(const item of saleItems)itemsBySale.set(item.sale_id,[...(itemsBySale.get(item.sale_id)||[]),item])
    return{photosByProduct,expensesByProduct,itemsBySale}
  },[expenses,photos,saleItems])

  return{
    settings,products,photos,expenses,sales,saleItems,cashEntries,customers,grouped,
    loading,busy,error,load,createProduct,registerSale,addExpense,addCashEntry,updateSettings,updateProduct,createCustomer
  }
}

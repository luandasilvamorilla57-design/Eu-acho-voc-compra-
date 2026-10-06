import {useCallback,useEffect,useMemo,useState} from 'react'
import {supabase} from '../lib/supabase'
import type {
  AddExpenseInput,CashEntry,ControlSettings,Customer,Goal,GoalInput,MonthClosure,
  ListingCheckin,NewProductInput,Product,ProductExpense,ProductPhoto,Receivable,ReceivableInstallment,
  RegisterSaleInput,Sale,SaleItem,Supplier
} from './types'

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
  const [suppliers,setSuppliers]=useState<Supplier[]>([])
  const [receivables,setReceivables]=useState<Receivable[]>([])
  const [installments,setInstallments]=useState<ReceivableInstallment[]>([])
  const [goals,setGoals]=useState<Goal[]>([])
  const [closures,setClosures]=useState<MonthClosure[]>([])
  const [listingCheckins,setListingCheckins]=useState<ListingCheckin[]>([])
  const [isAdmin,setIsAdmin]=useState(false)
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

      const adminResult=await db.from('control_admins').select('role,enabled').eq('user_id',userId).maybeSingle()
      if(adminResult.error)throw adminResult.error
      setIsAdmin(Boolean(adminResult.data?.enabled&&adminResult.data?.role==='super_admin'))

      const [p,ph,e,s,si,c,cu,su,r,i,g,cl,lc]=await Promise.all([
        db.from('control_products').select('*').eq('user_id',userId).order('created_at',{ascending:false}),
        db.from('control_product_photos').select('*').eq('user_id',userId).order('position',{ascending:true}),
        db.from('control_product_expenses').select('*').eq('user_id',userId).order('occurred_at',{ascending:false}),
        db.from('control_sales').select('*').eq('user_id',userId).order('sale_date',{ascending:false}).order('created_at',{ascending:false}),
        db.from('control_sale_items').select('*').eq('user_id',userId).order('created_at',{ascending:false}),
        db.from('control_cash_entries').select('*').eq('user_id',userId).order('occurred_at',{ascending:false}).order('created_at',{ascending:false}),
        db.from('control_customers').select('*').eq('user_id',userId).order('name',{ascending:true}),
        db.from('control_suppliers').select('*').eq('user_id',userId).order('name',{ascending:true}),
        db.from('control_receivables').select('*').eq('user_id',userId).order('due_date',{ascending:true}),
        db.from('control_receivable_installments').select('*').eq('user_id',userId).order('due_date',{ascending:true}),
        db.from('control_goals').select('*').eq('user_id',userId).order('period_month',{ascending:false}),
        db.from('control_month_closures').select('*').eq('user_id',userId).order('period_month',{ascending:false}),
        db.from('control_listing_checkins').select('*').eq('user_id',userId).order('checkin_date',{ascending:false}).order('created_at',{ascending:false})
      ])
      for(const result of [p,ph,e,s,si,c,cu,su,r,i,g,cl,lc])if(result.error)throw result.error

      const rawPhotos=(ph.data||[]) as ProductPhoto[]
      const signed=await Promise.all(rawPhotos.map(async photo=>{
        const result=await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(photo.storage_path,3600)
        return {...photo,signed_url:result.data?.signedUrl||null}
      }))

      setProducts(asNumber((p.data||[]) as Product[],['purchase_unit_cost','listed_price','minimum_price']))
      setPhotos(signed)
      setExpenses(asNumber((e.data||[]) as ProductExpense[],['amount']))
      setSales((s.data||[]) as Sale[])
      setSaleItems(asNumber((si.data||[]) as SaleItem[],['unit_price','unit_cost_snapshot']))
      setCashEntries(asNumber((c.data||[]) as CashEntry[],['amount']))
      setCustomers((cu.data||[]) as Customer[])
      setSuppliers((su.data||[]) as Supplier[])
      setReceivables(asNumber((r.data||[]) as Receivable[],['total_amount','paid_amount']))
      setInstallments(asNumber((i.data||[]) as ReceivableInstallment[],['amount']))
      setGoals(asNumber((g.data||[]) as Goal[],['revenue_target','profit_target','purchase_budget']))
      setClosures(asNumber((cl.data||[]) as MonthClosure[],[
        'revenue','cost_of_goods','general_expenses','gross_profit','net_profit',
        'stock_value','cash_balance','receivables_open'
      ]))
      setListingCheckins(asNumber((lc.data||[]) as ListingCheckin[],['previous_price','new_price']))
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
      const selectedFiles=files.slice(0,8)
      for(const file of selectedFiles){
        if(file.size>10*1024*1024)throw new Error('Cada foto pode ter no máximo 10 MB.')
      }

      const rpc=await db.rpc('control_create_product_v3',{
        p_name:input.name,
        p_purchase_unit_cost:input.purchaseUnitCost,
        p_quantity:input.quantity,
        p_purchase_date:input.purchaseDate,
        p_category:input.category||null,
        p_source:input.source||null,
        p_supplier_id:input.supplierId||null,
        p_listed_price:input.listedPrice??null,
        p_minimum_price:input.minimumPrice??null,
        p_notes:input.notes||null,
        p_acquisition_type:input.acquisitionType||'purchase',
        p_cost_basis_known:input.costBasisKnown??true,
        p_listing_status:input.listingStatus||'not_listed',
        p_listing_channels:input.listingChannels||[],
        p_listing_started_at:input.listingStartedAt||null
      })
      if(rpc.error)throw rpc.error
      const productId=String(rpc.data)

      const uploadResults=await Promise.allSettled(selectedFiles.map(async(file,index)=>{
        const ext=(file.name.split('.').pop()||'jpg').toLowerCase()
        const safeExt=['jpg','jpeg','png','webp','heic','heif'].includes(ext)?ext:'jpg'
        const path=`${userId}/${productId}/${crypto.randomUUID()}.${safeExt}`

        const uploaded=await supabase.storage.from(PHOTO_BUCKET).upload(path,file,{
          cacheControl:'3600',
          upsert:false
        })
        if(uploaded.error)throw uploaded.error

        const photo=await db.from('control_product_photos').insert({
          user_id:userId,
          product_id:productId,
          storage_path:path,
          stage:'purchase',
          position:index
        }).select('*').single()

        if(photo.error){
          await supabase.storage.from(PHOTO_BUCKET).remove([path])
          throw photo.error
        }
        return photo.data as ProductPhoto
      }))

      const savedPhotos=uploadResults
        .filter((result):result is PromiseFulfilledResult<ProductPhoto>=>result.status==='fulfilled')
        .map(result=>result.value)
      const photoFailures=uploadResults.length-savedPhotos.length

      const [productResult,cashResult]=await Promise.all([
        db.from('control_products').select('*').eq('id',productId).single(),
        db.from('control_cash_entries').select('*').eq('product_id',productId).order('created_at',{ascending:false})
      ])
      if(productResult.error)throw productResult.error
      if(cashResult.error)throw cashResult.error

      const signedPhotos=await Promise.all(savedPhotos.map(async photo=>{
        const signed=await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(photo.storage_path,3600)
        return {...photo,signed_url:signed.data?.signedUrl||null}
      }))

      const freshProduct=asNumber([productResult.data as Product],['purchase_unit_cost','listed_price','minimum_price'])[0]
      const freshCash=asNumber((cashResult.data||[]) as CashEntry[],['amount'])

      setProducts(current=>[freshProduct,...current.filter(item=>item.id!==productId)])
      setPhotos(current=>[...signedPhotos,...current.filter(item=>item.product_id!==productId)])
      if(freshCash.length){
        const freshIds=new Set(freshCash.map(item=>item.id))
        setCashEntries(current=>[...freshCash,...current.filter(item=>!freshIds.has(item.id))])
      }

      if(photoFailures>0){
        setError(`Produto salvo. ${photoFailures} foto(s) não conseguiram ser enviadas.`)
      }

      return productId
    }finally{setBusy(false)}
  },[userId])

  const registerSale=useCallback(async(input:RegisterSaleInput)=>{
    setBusy(true);setError(null)
    try{
      const result=await db.rpc('control_register_sale_v2',{
        p_product_id:input.productId,
        p_quantity:input.quantity,
        p_unit_price:input.unitPrice,
        p_sale_date:input.saleDate,
        p_payment_method:input.paymentMethod,
        p_customer_id:input.customerId||null,
        p_notes:input.notes||null,
        p_payment_mode:input.paymentMode,
        p_installment_count:input.installmentCount||1,
        p_first_due_date:input.firstDueDate||null
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
      for(const key of ['name','category','brand','model','condition','sku','source','supplier_id','seller_name','listed_price','minimum_price','status','notes','acquisition_type','cost_basis_known','listing_status','listing_channels','listing_started_at','listing_last_checkin_at','listing_next_checkin_at','listing_refresh_count']){
        if(key in patch)allowed[key]=(patch as any)[key]
      }
      const result=await db.from('control_products').update(allowed).eq('id',productId).eq('user_id',userId)
      if(result.error)throw result.error
      await load()
    }finally{setBusy(false)}
  },[load,userId])

  const createCustomer=useCallback(async(name:string,phone?:string,notes?:string)=>{
    const result=await db.from('control_customers').insert({
      user_id:userId,name:name.trim(),phone:phone?.trim()||null,notes:notes?.trim()||null
    }).select('*').single()
    if(result.error)throw result.error
    await load()
    return result.data as Customer
  },[load,userId])

  const updateCustomer=useCallback(async(id:string,patch:Pick<Customer,'name'|'phone'|'notes'>)=>{
    setBusy(true);setError(null)
    try{
      const result=await db.from('control_customers').update({
        name:patch.name.trim(),phone:patch.phone?.trim()||null,notes:patch.notes?.trim()||null
      }).eq('id',id)
      if(result.error)throw result.error
      await load()
    }finally{setBusy(false)}
  },[load])

  const createSupplier=useCallback(async(name:string,phone?:string,source?:string,notes?:string)=>{
    const result=await db.from('control_suppliers').insert({
      user_id:userId,name:name.trim(),phone:phone?.trim()||null,
      source:source?.trim()||null,notes:notes?.trim()||null
    }).select('*').single()
    if(result.error)throw result.error
    await load()
    return result.data as Supplier
  },[load,userId])

  const updateSupplier=useCallback(async(id:string,patch:Pick<Supplier,'name'|'phone'|'source'|'notes'>)=>{
    setBusy(true);setError(null)
    try{
      const result=await db.from('control_suppliers').update({
        name:patch.name.trim(),phone:patch.phone?.trim()||null,
        source:patch.source?.trim()||null,notes:patch.notes?.trim()||null
      }).eq('id',id)
      if(result.error)throw result.error
      await load()
    }finally{setBusy(false)}
  },[load])

  const payInstallment=useCallback(async(id:string,paidAt:string,paymentMethod:string)=>{
    setBusy(true);setError(null)
    try{
      const result=await db.rpc('control_pay_installment',{
        p_installment_id:id,p_paid_at:paidAt,p_payment_method:paymentMethod
      })
      if(result.error)throw result.error
      await load()
    }finally{setBusy(false)}
  },[load])

  const recordListingCheckin=useCallback(async(input:{productId:string;result:'good'|'keep'|'refreshed'|'price_lowered';newPrice?:number|null;note?:string})=>{
    setBusy(true);setError(null)
    try{
      const result=await db.rpc('control_record_listing_checkin',{
        p_product_id:input.productId,
        p_result:input.result,
        p_new_price:input.newPrice??null,
        p_note:input.note||null
      })
      if(result.error)throw result.error
      await load()
      return String(result.data)
    }finally{setBusy(false)}
  },[load])

  const saveGoal=useCallback(async(input:GoalInput)=>{
    setBusy(true);setError(null)
    try{
      const month=input.periodMonth.length===7?input.periodMonth+'-01':input.periodMonth
      const result=await db.from('control_goals').upsert({
        user_id:userId,period_month:month,
        revenue_target:input.revenueTarget,profit_target:input.profitTarget,
        sales_target:input.salesTarget,purchase_budget:input.purchaseBudget
      },{onConflict:'user_id,period_month'})
      if(result.error)throw result.error
      await load()
    }finally{setBusy(false)}
  },[load,userId])

  const closeMonth=useCallback(async(periodMonth:string,notes?:string)=>{
    setBusy(true);setError(null)
    try{
      const month=periodMonth.length===7?periodMonth+'-01':periodMonth
      const result=await db.rpc('control_close_month',{p_month:month,p_notes:notes||null})
      if(result.error)throw result.error
      await load()
      return String(result.data)
    }finally{setBusy(false)}
  },[load])

  const grouped=useMemo(()=>{
    const photosByProduct=new Map<string,ProductPhoto[]>()
    for(const photo of photos)photosByProduct.set(photo.product_id,[...(photosByProduct.get(photo.product_id)||[]),photo])
    const expensesByProduct=new Map<string,ProductExpense[]>()
    for(const expense of expenses)expensesByProduct.set(expense.product_id,[...(expensesByProduct.get(expense.product_id)||[]),expense])
    const itemsBySale=new Map<string,SaleItem[]>()
    for(const item of saleItems)itemsBySale.set(item.sale_id,[...(itemsBySale.get(item.sale_id)||[]),item])
    const installmentsByReceivable=new Map<string,ReceivableInstallment[]>()
    for(const item of installments)installmentsByReceivable.set(item.receivable_id,[...(installmentsByReceivable.get(item.receivable_id)||[]),item])
    const customerById=new Map(customers.map(item=>[item.id,item]))
    const supplierById=new Map(suppliers.map(item=>[item.id,item]))
    const saleById=new Map(sales.map(item=>[item.id,item]))
    const listingCheckinsByProduct=new Map<string,ListingCheckin[]>()
    for(const item of listingCheckins)listingCheckinsByProduct.set(item.product_id,[...(listingCheckinsByProduct.get(item.product_id)||[]),item])
    return{photosByProduct,expensesByProduct,itemsBySale,installmentsByReceivable,customerById,supplierById,saleById,listingCheckinsByProduct}
  },[customers,expenses,installments,listingCheckins,photos,saleItems,sales,suppliers])

  return{
    settings,products,photos,expenses,sales,saleItems,cashEntries,customers,suppliers,
    receivables,installments,goals,closures,listingCheckins,grouped,
    loading,busy,error,load,createProduct,registerSale,addExpense,addCashEntry,updateSettings,
    updateProduct,createCustomer,updateCustomer,createSupplier,updateSupplier,payInstallment,
    recordListingCheckin,saveGoal,closeMonth
  }
}

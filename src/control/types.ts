export type ControlView='home'|'stock'|'sales'|'cash'

export type ControlSettings={
  user_id:string
  business_name:string
  initial_cash:number
  stock_alert_days:number
  onboarding_completed:boolean
  created_at:string
  updated_at:string
}

export type Product={
  id:string
  user_id:string
  name:string
  category:string|null
  brand:string|null
  model:string|null
  condition:string
  sku:string|null
  quantity_initial:number
  quantity_available:number
  purchase_unit_cost:number
  purchase_date:string
  source:string|null
  supplier_id:string|null
  seller_name:string|null
  listed_price:number|null
  minimum_price:number|null
  status:'in_stock'|'reserved'|'sold'|'archived'
  notes:string|null
  created_at:string
  updated_at:string
}

export type ProductPhoto={
  id:string
  user_id:string
  product_id:string
  storage_path:string
  stage:'purchase'|'preparation'|'listing'|'receipt'
  position:number
  created_at:string
  signed_url?:string|null
}

export type ProductExpense={
  id:string
  user_id:string
  product_id:string
  expense_type:string
  description:string|null
  amount:number
  occurred_at:string
  created_at:string
}

export type Customer={
  id:string
  user_id:string
  name:string
  phone:string|null
  notes:string|null
  created_at:string
  updated_at:string
}

export type Sale={
  id:string
  user_id:string
  customer_id:string|null
  sale_date:string
  payment_method:string
  status:'completed'|'cancelled'
  notes:string|null
  created_at:string
}

export type SaleItem={
  id:string
  user_id:string
  sale_id:string
  product_id:string
  quantity:number
  unit_price:number
  created_at:string
}

export type CashEntry={
  id:string
  user_id:string
  kind:'income'|'expense'
  category:string
  description:string
  amount:number
  occurred_at:string
  product_id:string|null
  sale_id:string|null
  created_at:string
}

export type NewProductInput={
  name:string
  category?:string
  quantity:number
  purchaseUnitCost:number
  purchaseDate:string
  source?:string
  listedPrice?:number|null
  minimumPrice?:number|null
  notes?:string
}

export type RegisterSaleInput={
  productId:string
  quantity:number
  unitPrice:number
  saleDate:string
  paymentMethod:string
  customerId?:string|null
  notes?:string
}

export type AddExpenseInput={
  productId:string
  amount:number
  expenseType:string
  description?:string
  occurredAt:string
}

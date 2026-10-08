export type ControlView=
  |'home'|'stock'|'sales'|'cash'|'manage'
  |'receivables'|'reports'|'people'|'goals'|'backup'|'closures'|'guide'|'ranking'|'admin'

export type ControlAccount={
  user_id:string
  email:string|null
  registered_at:string
  updated_at:string
}

export type ControlAdmin={
  user_id:string
  role:'super_admin'
  enabled:boolean
  created_at:string
}

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
  legacy_purchase_id:string|null
  acquisition_type:'purchase'|'owned'
  cost_basis_known:boolean
  listing_status:'not_listed'|'listed'|'paused'|'sold'
  listing_channels:string[]
  listing_started_at:string|null
  listing_last_checkin_at:string|null
  listing_next_checkin_at:string|null
  listing_refresh_count:number
  created_at:string
  updated_at:string
}

export type ListingCheckin={
  id:string
  user_id:string
  product_id:string
  checkin_date:string
  result:'good'|'keep'|'refreshed'|'price_lowered'
  previous_price:number|null
  new_price:number|null
  note:string|null
  created_at:string
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

export type Supplier={
  id:string
  user_id:string
  name:string
  phone:string|null
  source:string|null
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
  payment_mode:'paid'|'receivable'
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
  unit_cost_snapshot:number
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

export type Receivable={
  id:string
  user_id:string
  sale_id:string
  customer_id:string
  description:string
  total_amount:number
  paid_amount:number
  due_date:string
  status:'open'|'partial'|'paid'|'cancelled'
  notes:string|null
  created_at:string
  updated_at:string
}

export type ReceivableInstallment={
  id:string
  user_id:string
  receivable_id:string
  installment_number:number
  amount:number
  due_date:string
  paid_at:string|null
  payment_method:string|null
  status:'open'|'paid'|'cancelled'
  notes:string|null
  created_at:string
}

export type Goal={
  id:string
  user_id:string
  period_month:string
  revenue_target:number
  profit_target:number
  sales_target:number
  purchase_budget:number
  created_at:string
  updated_at:string
}

export type MonthClosure={
  id:string
  user_id:string
  period_month:string
  revenue:number
  cost_of_goods:number
  general_expenses:number
  gross_profit:number
  net_profit:number
  sales_count:number
  stock_value:number
  cash_balance:number
  receivables_open:number
  notes:string|null
  closed_at:string
}

export type NewProductInput={
  name:string
  category?:string
  quantity:number
  purchaseUnitCost:number
  purchaseDate:string
  source?:string
  supplierId?:string|null
  listedPrice?:number|null
  minimumPrice?:number|null
  notes?:string
  acquisitionType?:'purchase'|'owned'
  costBasisKnown?:boolean
  listingStatus?:'not_listed'|'listed'|'paused'
  listingChannels?:string[]
  listingStartedAt?:string|null
}

export type RegisterSaleInput={
  productId:string
  quantity:number
  unitPrice:number
  saleDate:string
  paymentMethod:string
  paymentMode:'paid'|'receivable'
  customerId?:string|null
  installmentCount?:number
  firstDueDate?:string|null
  notes?:string
}

export type AddExpenseInput={
  productId:string
  amount:number
  expenseType:string
  description?:string
  occurredAt:string
}

export type GoalInput={
  periodMonth:string
  revenueTarget:number
  profitTarget:number
  salesTarget:number
  purchaseBudget:number
}

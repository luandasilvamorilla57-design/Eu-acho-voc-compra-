export const PASSWORD_MIN_LENGTH=8

export type PasswordChecks={
  length:boolean
  upper:boolean
  lower:boolean
  number:boolean
  symbol:boolean
}

export function passwordChecks(value:string):PasswordChecks{
  return {
    length:value.length>=PASSWORD_MIN_LENGTH,
    upper:/[A-ZÀ-Ý]/.test(value),
    lower:/[a-zà-ÿ]/.test(value),
    number:/[0-9]/.test(value),
    symbol:/[^A-Za-zÀ-ÿ0-9\s]/.test(value),
  }
}

export function isStrongPassword(value:string){
  const checks=passwordChecks(value)
  return Object.values(checks).every(Boolean)
}

export function passwordError(value:string){
  const checks=passwordChecks(value)
  if(!checks.length)return `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`
  if(!checks.upper)return 'Adicione pelo menos uma letra maiúscula.'
  if(!checks.lower)return 'Adicione pelo menos uma letra minúscula.'
  if(!checks.number)return 'Adicione pelo menos um número.'
  if(!checks.symbol)return 'Adicione pelo menos um caractere especial.'
  return ''
}

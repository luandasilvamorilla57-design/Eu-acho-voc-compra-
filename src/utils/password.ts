export const PASSWORD_MIN_LENGTH=10

export function passwordError(value:string){
  if(value.length<PASSWORD_MIN_LENGTH)return `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`
  if(!/[A-Za-zÀ-ÿ]/.test(value)||!/[0-9]/.test(value))return 'Use pelo menos uma letra e um número.'
  if(/^\s+$/.test(value))return 'Escolha uma senha válida.'
  return ''
}

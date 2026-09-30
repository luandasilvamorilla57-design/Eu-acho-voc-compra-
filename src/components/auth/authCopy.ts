export type AuthMode = 'login' | 'register' | 'recover' | 'reset'
export type AuthCopy = { eyebrow:string; title:string; subtitle:string; button:string }
export const authCopy: Record<AuthMode, AuthCopy> = {
  login: {
    eyebrow: 'ACESSO SEGURO',
    title: 'Entre para continuar no radar.',
    subtitle: 'Acesse suas análises salvas, histórico de compra e venda e a próxima oportunidade de lucro.',
    button: 'Entrar no BRIKE RADAR',
  },
  register: {
    eyebrow: 'CRIAR CONTA',
    title: 'Pare de perder margem por falta de informação.',
    subtitle: 'Crie sua conta, confirme seu e-mail e escolha o plano ideal para começar a usar o Radar do Brique.',
    button: 'Criar conta e escolher plano',
  },
  recover: {
    eyebrow: 'RECUPERAR ACESSO',
    title: 'Recupere sua conta em poucos minutos.',
    subtitle: 'Digite seu e-mail e receba um link seguro para redefinir sua senha.',
    button: 'Receber link seguro',
  },
  reset: {
    eyebrow: 'NOVA SENHA',
    title: 'Defina sua nova senha.',
    subtitle: 'Crie uma nova senha para voltar ao seu radar.',
    button: 'Salvar nova senha',
  },
}

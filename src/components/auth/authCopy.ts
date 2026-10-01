export type AuthMode = 'login' | 'register' | 'recover' | 'reset'
export type AuthCopy = { eyebrow:string; title:string; subtitle:string; button:string }

export const authCopy: Record<AuthMode, AuthCopy> = {
  login: {
    eyebrow: 'ACESSO SEGURO',
    title: 'Entre para continuar no BRIKE RADAR.',
    subtitle: 'Retome suas análises, compras, ações pendentes e oportunidades exatamente de onde parou.',
    button: 'Entrar no BRIKE RADAR',
  },
  register: {
    eyebrow: 'CRIAR CONTA',
    title: 'Transforme garimpo em operação.',
    subtitle: 'Crie sua conta para analisar anúncios, acompanhar compras e vendas e construir seu histórico de oportunidades.',
    button: 'Criar conta e escolher plano',
  },
  recover: {
    eyebrow: 'RECUPERAR ACESSO',
    title: 'Redefina sua senha e volte para o radar.',
    subtitle: 'Informe seu e-mail para receber um link seguro de recuperação de acesso.',
    button: 'Enviar link de recuperação',
  },
  reset: {
    eyebrow: 'NOVA SENHA',
    title: 'Crie uma nova senha segura.',
    subtitle: 'Defina sua nova senha para retomar sua operação no BRIKE RADAR.',
    button: 'Salvar nova senha',
  },
}

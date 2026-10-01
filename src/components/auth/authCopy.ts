export type AuthMode = 'login' | 'register' | 'recover' | 'reset'
export type AuthCopy = { eyebrow:string; title:string; subtitle:string; button:string }

export const authCopy: Record<AuthMode, AuthCopy> = {
  login: {
    eyebrow: 'ACESSO SEGURO',
    title: 'Bem-vindo de volta.',
    subtitle: 'Entre para continuar suas análises, compras, ações pendentes e histórico de revenda.',
    button: 'Entrar no BRIKE RADAR',
  },
  register: {
    eyebrow: 'CRIE SUA CONTA',
    title: 'Comece a comprar com mais critério.',
    subtitle: 'Crie sua conta para transformar garimpo em processo: descobrir o que procurar, analisar antes de pagar e acompanhar até a revenda.',
    button: 'Criar conta e ver meus planos',
  },
  recover: {
    eyebrow: 'RECUPERAR ACESSO',
    title: 'Recupere sua conta.',
    subtitle: 'Informe seu e-mail e enviaremos um link seguro para você definir uma nova senha.',
    button: 'Enviar link de recuperação',
  },
  reset: {
    eyebrow: 'NOVA SENHA',
    title: 'Defina sua nova senha.',
    subtitle: 'Crie uma senha forte para voltar à sua conta e continuar de onde parou.',
    button: 'Salvar nova senha',
  },
}

# BRIKE RADAR

Aplicação web para analisar oportunidades de compra e revenda com Supabase + Gemini.

## Stack
- React + TypeScript + Vite
- Tailwind CSS
- Supabase Auth + PostgreSQL + RLS
- Supabase Edge Functions
- Google Gemini API
- Recharts
- Vercel

## Segurança
- A chave `GEMINI_API_KEY` fica somente nos Secrets das Edge Functions do Supabase.
- O frontend usa apenas a publishable key do Supabase.
- As análises são protegidas por RLS por usuário.

## Funcionalidades
- Login, cadastro e recuperação de senha
- Dashboard responsivo
- Nova análise de anúncio com IA
- Score de oportunidade, ROI, margem e lucro potencial
- Riscos, checklist e estratégias de negociação
- Histórico de análises
- Registro de compra e venda
- Dark mode e interface mobile-first

<!-- vercel redeploy retry -->

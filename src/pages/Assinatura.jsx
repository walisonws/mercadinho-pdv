/**
 * Tela de Plano de Assinatura
 *
 * TODO (para comercializar):
 * 1. Crie uma conta em https://stripe.com ou https://pagar.me
 * 2. Configure VITE_STRIPE_PUBLIC_KEY no Vercel
 * 3. Crie uma Vercel Function em api/criar-checkout.js para gerar sessões Stripe
 * 4. Crie um webhook em api/stripe-webhook.js para atualizar pdv_assinaturas no Supabase
 * 5. Substitua handleAssinar() para chamar a API de checkout
 *
 * SQL necessário no Supabase:
 * create table pdv_assinaturas (
 *   id uuid primary key default gen_random_uuid(),
 *   loja_id text not null unique,
 *   status text default 'trial', -- 'trial' | 'ativo' | 'cancelado' | 'expirado'
 *   plano text default 'basico',
 *   trial_ate timestamp with time zone,
 *   valido_ate timestamp with time zone,
 *   stripe_customer_id text,
 *   stripe_subscription_id text,
 *   criado_em timestamp with time zone default now()
 * );
 */

import { CheckCircle, Zap, Crown, AlertCircle } from 'lucide-react'

const planos = [
  {
    id: 'basico',
    nome: 'Básico',
    preco: 'R$ 49',
    periodo: '/mês',
    cor: 'border-gray-200',
    destaque: false,
    recursos: [
      'PDV com leitor de código de barras',
      'Controle de estoque',
      'Histórico de vendas',
      'Dashboard de faturamento',
      'Lista de reposição inteligente',
      'Sync entre dispositivos',
      'Suporte por WhatsApp',
    ],
  },
  {
    id: 'pro',
    nome: 'Pro',
    preco: 'R$ 79',
    periodo: '/mês',
    cor: 'border-green-500',
    destaque: true,
    recursos: [
      'Tudo do Básico',
      'Nota IA (leitura de notas fiscais)',
      'Relatório de lucro por produto',
      'Múltiplos operadores/caixas',
      'Exportação CSV',
      'Impressão de cupom 58mm',
      'Suporte prioritário',
    ],
  },
]

export default function Assinatura() {
  function handleAssinar(plano) {
    // TODO: integrar Stripe/Pagar.me aqui
    alert(`Integração de pagamento ainda não configurada.\n\nQuando integrado, abrirá o checkout para o plano ${plano.nome}.`)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="text-center pt-4">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-yellow-100 rounded-2xl mb-4">
          <Crown size={28} className="text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Plano de assinatura</h1>
        <p className="text-gray-500 mt-2">Escolha o plano ideal para o seu mercadinho</p>
      </div>

      {/* Banner trial */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex items-start gap-3">
        <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Você está no período gratuito</p>
          <p className="text-sm text-blue-700 mt-0.5">Aproveite 14 dias grátis para testar todas as funcionalidades.</p>
        </div>
      </div>

      {/* Cards de planos */}
      <div className="space-y-4">
        {planos.map(plano => (
          <div key={plano.id} className={`bg-white rounded-2xl border-2 shadow-sm p-6 ${plano.cor} ${plano.destaque ? 'shadow-green-100' : ''}`}>
            {plano.destaque && (
              <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold mb-3">
                <Zap size={13} /> MAIS POPULAR
              </div>
            )}
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">{plano.nome}</h2>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-800">{plano.preco}</span>
                <span className="text-gray-400 text-sm">{plano.periodo}</span>
              </div>
            </div>

            <ul className="space-y-2.5 mb-5">
              {plano.recursos.map(r => (
                <li key={r} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle size={15} className="text-green-500 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleAssinar(plano)}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                plano.destaque
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Assinar plano {plano.nome}
            </button>
          </div>
        ))}
      </div>

      {/* Nota técnica visível só em dev */}
      {import.meta.env.DEV && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800 space-y-2">
          <p className="font-bold">⚠️ Integração de pagamento pendente (apenas visível em dev)</p>
          <p>Para ativar assinaturas, siga os TODOs no início de <code className="bg-amber-100 px-1 rounded">src/pages/Assinatura.jsx</code>.</p>
          <p>Você precisará de uma conta Stripe e criar as Vercel Functions de checkout e webhook.</p>
        </div>
      )}
    </div>
  )
}

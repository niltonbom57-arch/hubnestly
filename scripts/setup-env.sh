#!/bin/bash
# Script de configuração do ambiente CleanBookFL

set -e

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║   CleanBookFL — Configuração do Env   ║"
echo "╚═══════════════════════════════════════╝"
echo ""

ENV_FILE=".env.local"

if [ -f "$ENV_FILE" ]; then
  read -p "⚠️  $ENV_FILE já existe. Sobrescrever? (s/N): " overwrite
  if [[ ! "$overwrite" =~ ^[sS]$ ]]; then
    echo "Abortado."
    exit 0
  fi
fi

echo ""
echo "━━━ 1/4 BANCO DE DADOS (Supabase) ━━━━━━━━━━━━━━━━━━━━━━━"
echo "Acesse: https://supabase.com → Project Settings → Database → URI"
echo ""
read -p "Cole a DATABASE_URL: " DATABASE_URL

echo ""
echo "━━━ 2/4 STRIPE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Acesse: https://dashboard.stripe.com → Developers → API keys"
echo ""
read -p "Secret key (sk_test_...): " STRIPE_SECRET_KEY
read -p "Publishable key (pk_test_...): " STRIPE_PUBLISHABLE_KEY
read -p "Webhook secret (whsec_... — Enter para pular por enquanto): " STRIPE_WEBHOOK_SECRET
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET:-"whsec_placeholder"}

echo ""
echo "━━━ 3/4 GOOGLE OAUTH (opcional — Enter para pular) ━━━━━━━"
echo "Acesse: https://console.cloud.google.com → APIs → Credentials"
echo ""
read -p "Google Client ID (Enter para pular): " GOOGLE_CLIENT_ID
read -p "Google Client Secret (Enter para pular): " GOOGLE_CLIENT_SECRET

echo ""
echo "━━━ 4/4 NEXTAUTH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "✅ NEXTAUTH_SECRET gerado automaticamente"

read -p "URL da aplicação (Enter para http://localhost:3000): " NEXTAUTH_URL
NEXTAUTH_URL=${NEXTAUTH_URL:-"http://localhost:3000"}

# Escrever .env.local (usado pelo Next.js em runtime)
cat > "$ENV_FILE" << EOF
# Banco de Dados
DATABASE_URL="${DATABASE_URL}"

# NextAuth
NEXTAUTH_URL="${NEXTAUTH_URL}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# Google OAuth
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET}"

# Stripe
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY}"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${STRIPE_PUBLISHABLE_KEY}"
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET}"
EOF

# Escrever .env (usado pelo Prisma CLI para migrate/seed)
cat > ".env" << EOF
# Usado pelo Prisma CLI (migrate, seed)
DATABASE_URL="${DATABASE_URL}"
EOF

echo ""
echo "✅ $ENV_FILE criado!"
echo "✅ .env criado (para Prisma CLI)"
echo ""
echo "━━━ PRÓXIMOS PASSOS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  1. Rodar migration:"
echo "     npx prisma migrate dev --name init"
echo ""
echo "  2. Popular banco com dados de teste:"
echo "     npm run db:seed"
echo ""
echo "  3. Iniciar servidor:"
echo "     npm run dev"
echo ""
echo "  4. Acesse http://localhost:3000"
echo "     Admin: admin@cleanbookfl.com / admin123!"
echo "     Cliente: maria@exemplo.com / cliente123!"
echo ""

read -p "Rodar migration agora? (s/N): " run_migrate
if [[ "$run_migrate" =~ ^[sS]$ ]]; then
  echo ""
  echo "Rodando migration..."
  npx prisma migrate dev --name init

  read -p "Popular banco com seed? (s/N): " run_seed
  if [[ "$run_seed" =~ ^[sS]$ ]]; then
    echo ""
    echo "Rodando seed..."
    npm run db:seed
    echo ""
    echo "✅ Banco configurado! Rode: npm run dev"
  fi
fi

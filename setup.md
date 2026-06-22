# Guia de Configuração — CleanBookFL

## 1. Supabase (Banco de Dados)

1. Acesse https://supabase.com e crie uma conta
2. Crie um novo projeto (escolha região "US East")
3. Vá em **Project Settings → Database → Connection string → URI**
4. Copie a string no formato:
   ```
   postgresql://postgres:[SUA-SENHA]@db.[ID-PROJETO].supabase.co:5432/postgres
   ```

## 2. Stripe (Pagamentos)

1. Acesse https://dashboard.stripe.com
2. Vá em **Developers → API keys**
3. Copie:
   - **Publishable key** (começa com `pk_test_...`)
   - **Secret key** (começa com `sk_test_...`)
4. Para o webhook (pode configurar depois do deploy):
   - Vá em **Developers → Webhooks → Add endpoint**
   - URL: `https://SEU-DOMINIO/api/stripe/webhook`
   - Evento: `checkout.session.completed`

## 3. Google OAuth (Opcional)

1. Acesse https://console.cloud.google.com
2. Crie um projeto ou use um existente
3. Vá em **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
4. Tipo: Web application
5. Redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copie Client ID e Client Secret

## 4. Preencher o .env.local

Execute:
```bash
cp .env.example .env.local
# Edite o arquivo com suas credenciais
```

## 5. Rodar Migration e Seed

```bash
npx prisma migrate dev --name init
npm run db:seed
```

## 6. Iniciar o servidor

```bash
npm run dev
```

Acesse: http://localhost:3000
Admin: admin@cleanbookfl.com / admin123!

# Mercado Pago — CONNECT

A tela **Loja > Pacote CONNECT** usa assinaturas recorrentes para liberar buscas ilimitadas.

## Secrets no Supabase

No projeto `trrakyybnvxpdhxwgjrz`, abra **Edge Functions → Secrets** e cadastre:

- `MERCADOPAGO_ACCESS_TOKEN`: Access Token da aplicação Mercado Pago (comece com credenciais de teste).
- `MERCADOPAGO_WEBHOOK_SECRET`: Assinatura secreta exibida em Mercado Pago → Sua integração → Webhooks.
- `CONNECT_SITE_URL` (opcional): URL pública canônica do CONNECT, sem barra final.

Nunca coloque esses valores em arquivos versionados, no frontend ou em mensagens.

## Webhook no Mercado Pago

Configure a URL HTTPS:

`https://trrakyybnvxpdhxwgjrz.supabase.co/functions/v1/mercadopago-webhook`

Ative notificações de **Assinaturas** e **Pagamentos**. O endpoint valida o cabeçalho `x-signature` com HMAC-SHA256 e consulta o recurso diretamente na API do Mercado Pago antes de atualizar o banco.

## Planos

Os registros `connect-monthly` e `connect-annual` já foram criados no banco como inativos, para não cobrar um valor fictício. Antes de vender, defina o preço em reais e marque cada plano como ativo na tabela `public.connect_plans`.

- Mensal: `billing_interval = 'month'`
- Anual: `billing_interval = 'year'` (renovação a cada 12 meses)

O CONNECT só libera buscas ilimitadas depois de receber e validar uma notificação de pagamento aprovado. O cancelamento interrompe renovações; o acesso permanece até o fim do período pago quando a data de término estiver disponível.

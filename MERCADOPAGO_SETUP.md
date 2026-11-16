# Mercado Pago — CONNECT

A tela **Loja > Pacote CONNECT** oferece cartão com renovação automática e Pix com pagamento único para liberar buscas ilimitadas.

## Secrets no Supabase

No projeto `trrakyybnvxpdhxwgjrz`, abra **Edge Functions → Secrets** e cadastre:

- `MERCADOPAGO_ACCESS_TOKEN`: Access Token da aplicação Mercado Pago (comece com credenciais de teste).
- `MERCADOPAGO_PUBLIC_KEY`: Public Key da mesma aplicação; é diferente do Access Token e é usada pelo SDK oficial para tokenizar o cartão.
- `MERCADOPAGO_WEBHOOK_SECRET`: Assinatura secreta exibida em Mercado Pago → Sua integração → Webhooks.
- `CONNECT_SITE_URL` (opcional): URL pública canônica do CONNECT, sem barra final.
- `CONNECT_DEMO_USERNAME` e `CONNECT_DEMO_PASSWORD` (opcionais): credenciais privadas do acesso de demonstração. Sem esses secrets, o login de demonstração fica desativado.

Nunca coloque esses valores em arquivos versionados, no frontend ou em mensagens. Não use credenciais reais de produção em ambientes de teste.

## Webhook no Mercado Pago

Configure a URL HTTPS:

`https://trrakyybnvxpdhxwgjrz.supabase.co/functions/v1/mercadopago-webhook`

Ative notificações de **Assinaturas** e **Pagamentos**. O endpoint valida o cabeçalho `x-signature` com HMAC-SHA256 e consulta o recurso diretamente na API do Mercado Pago antes de atualizar o banco.

## Planos

Os registros `connect-monthly` e `connect-annual` já foram criados no banco como inativos, para não cobrar um valor fictício. Antes de vender, defina o preço em reais e marque cada plano como ativo na tabela `public.connect_plans`.

- Mensal: `billing_interval = 'month'`
- Anual: `billing_interval = 'year'` (renovação a cada 12 meses no cartão; Pix libera 365 dias sem renovação automática)

No Pix, o QR Code tem validade de 30 minutos; o pacote mensal libera 30 dias e o anual libera 365 dias, sem renovação automática. O CONNECT só libera buscas ilimitadas depois de receber e validar uma notificação de pagamento aprovado. O cancelamento interrompe renovações; o acesso permanece até o fim do período pago quando a data de término estiver disponível.

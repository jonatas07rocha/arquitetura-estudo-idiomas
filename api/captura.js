const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  // Configuração de cabeçalhos CORS e JSON
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas aceita método POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: 'Método não permitido. Utilize o método POST.'
    });
  }

  try {
    // Normalização do corpo da requisição (JSON ou objeto já parseado pelo runtime Vercel)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: 'Formato de requisição inválido. Envie um JSON válido.'
        });
      }
    }

    const email = body?.email ? String(body.email).trim().toLowerCase() : '';

    // Validação de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, informe um endereço de e-mail válido.'
      });
    }

    const { EMAIL_USER, EMAIL_PASS, EMAIL_TO } = process.env;

    // Se as credenciais ainda não foram configuradas no painel da Vercel
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn('[AVISO] EMAIL_USER ou EMAIL_PASS não estão configuradas no ambiente.');
      return res.status(200).json({
        success: true,
        message: 'Lead recebido com sucesso (modo de contingência: variáveis de e-mail não configuradas no servidor).'
      });
    }

    // Criação do transportador SMTP com Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const destinatario = EMAIL_TO || EMAIL_USER;
    const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const mailOptions = {
      from: `"Arquitetura de Estudos" <${EMAIL_USER}>`,
      to: destinatario,
      replyTo: email,
      subject: `[Novo Lead] Prompt Gratuito - ${email}`,
      text: `Novo lead capturado na página do Prompt Gratuito:\n\nE-mail: ${email}\nData e Hora: ${dataHora}\nOrigem: Lead Magnet (/prompt-gratuito)\n`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #DCDAD1; border-radius: 6px; background-color: #F5F4F0; color: #1C1B19;">
          <div style="border-bottom: 2px solid #1C1B19; padding-bottom: 12px; margin-bottom: 20px;">
            <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #646158;">Arquitetura de Estudos de Idiomas</span>
            <h2 style="font-size: 20px; font-weight: 600; margin: 6px 0 0 0; color: #1C1B19;">Novo Lead Capturado</h2>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #262522; margin-bottom: 18px;">
            Um visitante acabou de desbloquear o <strong>Protocolo de Diagnóstico Ativo (Prompt Gratuito)</strong>:
          </p>

          <div style="background-color: #FFFFFF; border: 1px solid #DCDAD1; border-radius: 4px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #646158; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">E-mail do Lead</p>
            <p style="margin: 4px 0 12px 0; font-size: 16px; font-weight: 600; font-family: monospace; color: #1A365D;">${email}</p>

            <p style="margin: 0; font-size: 13px; color: #646158; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Data e Hora</p>
            <p style="margin: 4px 0 12px 0; font-size: 14px; color: #262522;">${dataHora}</p>

            <p style="margin: 0; font-size: 13px; color: #646158; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Página de Origem</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; font-family: monospace; color: #262522;">/prompt-gratuito</p>
          </div>

          <p style="font-size: 11px; color: #9A978C; margin: 0; text-align: center;">
            Disparo automático via Vercel Serverless Function.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: 'Lead capturado e notificado com sucesso.'
    });
  } catch (error) {
    console.error('Erro na função serverless de captura:', error);
    return res.status(500).json({
      success: false,
      error: 'Ocorreu um erro interno ao processar seu cadastro. Por favor, tente novamente.'
    });
  }
};

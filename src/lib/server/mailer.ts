'use server';

import "server-only";
import nodemailer from "nodemailer";

type MailerConfig = {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
};

let cachedTransporter: nodemailer.Transporter | null = null;

function getMailerConfig(): MailerConfig {
  return {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
    from: process.env.MAILER_FROM,
  };
}

function createTransporter(config: MailerConfig) {
  if (!config.host || !config.port || !config.user || !config.pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

async function ensureTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const transporter = createTransporter(getMailerConfig());
  if (!transporter) return null;
  cachedTransporter = transporter;
  return transporter;
}

type OwnerCodeEmailParams = {
  to: string;
  code: string;
  ownerName: string;
  expiresAt: Date;
};

type SendResult =
  | { delivered: true }
  | { delivered: false; simulated: true; previewCode: string };

export async function sendOwnerAccessCodeEmail(params: OwnerCodeEmailParams): Promise<SendResult> {
  const config = getMailerConfig();
  const transporter = await ensureTransporter();
  const subject = "Seu codigo de acesso para o painel da doceria";
  const text = [
    `Oi, ${params.ownerName}!`,
    "",
    `Seu codigo de acesso e: ${params.code}`,
    `Ele expira em ${params.expiresAt.toLocaleTimeString()}.`,
    "",
    "Use-o imediatamente para entrar no painel.",
  ].join("\n");
  const html = `<p>Oi, ${params.ownerName}!</p>
  <p><strong>Seu codigo de acesso:</strong></p>
  <p style="font-size: 24px; font-weight: bold; letter-spacing: 6px;">${params.code}</p>
  <p>O codigo expira em <strong>${params.expiresAt.toLocaleTimeString()}</strong>. Utilize-o imediatamente para entrar no painel.</p>
  <p>Se voce nao solicitou este acesso, basta ignorar este email.</p>`;

  if (!transporter) {
    console.warn(
      "[mailer] SMTP nao configurado. Codigo enviado apenas no console para testes:",
      params.code,
    );
    return { delivered: false, simulated: true, previewCode: params.code };
  }

  try {
    await transporter.sendMail({
      from: config.from ?? config.user,
      to: params.to,
      subject,
      text,
      html,
    });
    return { delivered: true };
  } catch (error) {
    console.warn(
      "[mailer] Falha ao enviar via SMTP. Exibindo codigo localmente.",
      (error as Error).message,
    );
    return { delivered: false, simulated: true, previewCode: params.code };
  }
}

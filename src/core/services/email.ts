import { Resend } from "resend";

import { env } from "@/core/env";

const resend = new Resend(env.RESEND_API_KEY);
const DEFAULT_FROM = env.RESEND_FROM || "no-reply@pegasus.local";

type SendInvitationParams = {
  to: string;
  token: string;
};

export async function sendInvitationEmail({ to, token }: SendInvitationParams) {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY não configurada");
  }

  const inviteUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/invite?token=${encodeURIComponent(
    token
  )}`;

  const { error } = await resend.emails.send({
    from: DEFAULT_FROM,
    to,
    subject: "Convite para o Pegasus",
    text: `Você foi convidado para o Pegasus. Acesse: ${inviteUrl}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif;">
        <h2>Convite para o Pegasus</h2>
        <p>Você foi convidado para o Pegasus.</p>
        <p>
          <a href="${inviteUrl}" target="_blank" rel="noreferrer" style="display:inline-block;padding:10px 16px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;">
            Aceitar convite
          </a>
        </p>
        <p>Ou copie e cole esta URL no navegador: <br />
          <a href="${inviteUrl}">${inviteUrl}</a>
        </p>
      </div>
    `,
  });

  if (error) {
    throw error;
  }
}

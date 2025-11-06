import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Resend SDK
const sendMock = vi.fn(async () => ({ id: "email_123" }));
class ResendMock {
  emails = { send: sendMock } as const;
  constructor(_apiKey?: string) {}
}

vi.mock("resend", () => ({ Resend: ResendMock }));

// Mock env module para isolar validação real
vi.mock("../../src/core/env", () => ({
  env: {
    RESEND_API_KEY: "test_key",
    RESEND_FROM: "no-reply@test.local",
  },
}));

describe("emailService - sendInvitationEmail", () => {
  beforeEach(() => {
    sendMock.mockClear();
  });

  it("deve chamar resend.emails.send com os parâmetros corretos", async () => {
    const { sendInvitationEmail } = await import(
      "../../src/core/services/email"
    );
    await sendInvitationEmail({ to: "user@example.com", token: "abc123" });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const args = sendMock.mock.calls[0][0] as Record<string, unknown>;
    expect(args.from).toBe("no-reply@test.local");
    expect(args.to).toBe("user@example.com");
    expect(String(args.subject)).toContain("Convite");
    // Deve conter link com token no HTML ou texto
    const serialized = `${args.html ?? ""}${args.text ?? ""}`;
    expect(serialized).toContain("abc123");
  });
});

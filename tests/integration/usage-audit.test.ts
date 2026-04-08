import { describe, expect, it, vi } from "vitest";

import { checkQuota } from "@/modules/usage/quota-service";
import { writeAuditLog } from "@/modules/usage/audit-service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    usageQuota: {
      upsert: vi.fn().mockResolvedValue({
        dailyUsed: 0,
        dailyLimit: 5,
        perStudentUsed: 0,
        perStudentLimit: 2,
      }),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "log_1" }),
    },
  },
}));

describe("Usage quota and audit", () => {
  it("allows evaluation when within limits", async () => {
    const result = await checkQuota({
      ownerType: "TEACHER",
      ownerId: "teacher_1",
      dailyLimit: 5,
      perStudentLimit: 2,
    });

    expect(result.allowed).toBe(true);
  });

  it("writes audit logs", async () => {
    const output = await writeAuditLog({
      action: "writing_evaluation",
      targetType: "WritingSubmission",
      status: "success",
    });

    expect(output.id).toBe("log_1");
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });
});

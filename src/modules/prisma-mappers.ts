import {
  KeySource,
  Mode,
  OwnerType,
  ProviderType,
  Skill,
  WritingStatus,
} from "@prisma/client";

import type {
  Mode as DomainMode,
  Skill as DomainSkill,
  WritingStatus as DomainWritingStatus,
} from "@/modules/types";

const DOMAIN_TO_PRISMA_SKILL: Record<DomainSkill, Skill> = {
  reading: Skill.READING,
  listening: Skill.LISTENING,
  usee: Skill.USEE,
  writing: Skill.WRITING,
};

const PRISMA_TO_DOMAIN_SKILL: Record<Skill, DomainSkill> = {
  [Skill.READING]: "reading",
  [Skill.LISTENING]: "listening",
  [Skill.USEE]: "usee",
  [Skill.WRITING]: "writing",
};

export function toPrismaSkill(skill: DomainSkill): Skill {
  return DOMAIN_TO_PRISMA_SKILL[skill];
}

export function toDomainSkill(skill: Skill): DomainSkill {
  return PRISMA_TO_DOMAIN_SKILL[skill];
}

export function toPrismaMode(mode: DomainMode): Mode {
  return mode === "short" ? Mode.SHORT : Mode.FULL;
}

export function toDomainMode(mode: Mode): DomainMode {
  return mode === Mode.SHORT ? "short" : "full";
}

export function toPrismaWritingStatus(status: DomainWritingStatus): WritingStatus {
  switch (status) {
    case "pending":
      return WritingStatus.PENDING;
    case "evaluating":
      return WritingStatus.EVALUATING;
    case "completed":
      return WritingStatus.COMPLETED;
    case "failed":
      return WritingStatus.FAILED;
  }
}

export function toDomainWritingStatus(status: WritingStatus): DomainWritingStatus {
  switch (status) {
    case WritingStatus.PENDING:
      return "pending";
    case WritingStatus.EVALUATING:
      return "evaluating";
    case WritingStatus.COMPLETED:
      return "completed";
    case WritingStatus.FAILED:
      return "failed";
  }
}

export function toPrismaProviderType(value: string): ProviderType {
  if (value.toLowerCase() === "ollama") {
    return ProviderType.OLLAMA;
  }

  if (value.toLowerCase() === "custom") {
    return ProviderType.CUSTOM;
  }

  return ProviderType.OPENAI;
}

export function toPrismaKeySource(value: string): KeySource {
  if (value.toLowerCase() === "student") {
    return KeySource.STUDENT;
  }

  if (value.toLowerCase() === "local") {
    return KeySource.LOCAL;
  }

  return KeySource.TEACHER;
}

export function toPrismaOwnerType(value: "teacher" | "student"): OwnerType {
  return value === "teacher" ? OwnerType.TEACHER : OwnerType.STUDENT;
}

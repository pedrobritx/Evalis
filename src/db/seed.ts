import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

async function seedUsers() {
  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher@evalis.dev" },
    update: {},
    create: {
      email: "teacher@evalis.dev",
      role: Role.TEACHER,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "student@evalis.dev" },
    update: {},
    create: {
      email: "student@evalis.dev",
      role: Role.STUDENT,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      org: "Evalis Demo School",
    },
  });

  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {
      teacherId: teacher.id,
    },
    create: {
      userId: studentUser.id,
      teacherId: teacher.id,
    },
  });
}

async function seedItems() {
  const items = [
    {
      id: "read_b1_001",
      skill: "READING",
      subskill: "inference",
      level: "B1",
      difficulty: 0,
      type: "multiple_choice",
      question: "Why did the writer decide to delay the launch?",
      options: ["Budget", "Weather", "Team feedback"],
      answer: "Team feedback",
      explanation: "The text states the feedback required adjustments.",
    },
    {
      id: "listen_b1_001",
      skill: "LISTENING",
      subskill: "gist",
      level: "B1",
      difficulty: -0.1,
      type: "multiple_choice",
      question: "What is the main purpose of the announcement?",
      options: ["Promote a sale", "Share schedule changes", "Introduce staff"],
      answer: "Share schedule changes",
      explanation: "The speaker lists new timings.",
    },
    {
      id: "usee_b1_001",
      skill: "USEE",
      subskill: "cloze",
      level: "B1",
      difficulty: 0,
      type: "cloze",
      question: "If I ____ enough time, I would join the workshop.",
      options: ["have", "had", "will have"],
      answer: "had",
      explanation: "Second conditional structure.",
    },
    {
      id: "writ_b1_001",
      skill: "WRITING",
      subskill: "task_achievement",
      level: "B1",
      difficulty: 0,
      type: "prompt",
      question: "Write 50-120 words describing a learning challenge and how you solved it.",
      options: null,
      answer: "open_response",
      explanation: "Teacher rubric + optional AI evaluation.",
    },
  ] as const;

  for (const item of items) {
    const optionsValue = item.options ? [...item.options] : Prisma.JsonNull;

    await prisma.item.upsert({
      where: { id: item.id },
      update: {
        skill: item.skill,
        subskill: item.subskill,
        level: item.level,
        difficulty: item.difficulty,
        type: item.type,
        question: item.question,
        options: optionsValue,
        answer: item.answer,
        explanation: item.explanation,
        active: true,
      },
      create: {
        id: item.id,
        skill: item.skill,
        subskill: item.subskill,
        level: item.level,
        difficulty: item.difficulty,
        type: item.type,
        question: item.question,
        options: optionsValue,
        answer: item.answer,
        explanation: item.explanation,
        active: true,
      },
    });
  }
}

async function main() {
  await seedUsers();
  await seedItems();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

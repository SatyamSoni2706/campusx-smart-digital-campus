import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});
const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((value) => value.toLowerCase()),
  studentId: z.string().trim().min(3).max(32),
  password: z.string().min(10).max(128),
});
const studentProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  studentId: z.string().trim().min(3).max(32),
});

export const currentUserFn = createServerFn({ method: "GET" }).handler(async () => {
  const { currentCampusUser } = await import("./server/auth.server");
  return currentCampusUser();
});

export const loginFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => loginSchema.parse(input))
  .handler(async ({ data }) => {
    const { loginCampusUser } = await import("./server/auth.server");
    return loginCampusUser(data);
  });

export const registerStudentFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => registerSchema.parse(input))
  .handler(async ({ data }) => {
    const { registerCampusStudent } = await import("./server/auth.server");
    return registerCampusStudent(data);
  });

export const updateStudentProfileFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => studentProfileSchema.parse(input))
  .handler(async ({ data }) => {
    const { updateCampusStudentProfile } = await import("./server/auth.server");
    return updateCampusStudentProfile(data);
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const { logoutCampusUser } = await import("./server/auth.server");
  return logoutCampusUser();
});

import { customAlphabet } from "nanoid";

const makeCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export function newRoomCode(): string {
  return makeCode();
}

export function newId(): string {
  return customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16)();
}

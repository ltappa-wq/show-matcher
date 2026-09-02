const keyFor = (roomCode: string) => `tw.member.${roomCode.toUpperCase()}`;

export function readMemberId(roomCode: string): string | null {
  try {
    return localStorage.getItem(keyFor(roomCode));
  } catch {
    return null;
  }
}

export function writeMemberId(roomCode: string, memberId: string): void {
  try {
    localStorage.setItem(keyFor(roomCode), memberId);
  } catch {
    /* ignore quota */
  }
}

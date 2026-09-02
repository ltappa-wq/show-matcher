import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { Clapperboard } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { ThemeModeSwitch } from "../components/ThemeModeSwitch";
import { useCreateRoom, useJoinRoom } from "../helpers/useRoom";
import { readMemberId, writeMemberId } from "../helpers/memberSession";
import styles from "./_index.module.css";

export default function HomePage() {
  const navigate = useNavigate();
  const createRoom = useCreateRoom();
  const joinRoom = useJoinRoom();
  const [displayName, setDisplayName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const goToRoom = (roomCode: string, memberId: string) => {
    writeMemberId(roomCode, memberId);
    navigate(`/r/${roomCode}`);
  };

  const onCreate = async () => {
    setError(null);
    const name = displayName.trim();
    if (!name) {
      setError("Put your name on the ticket.");
      return;
    }
    try {
      const room = await createRoom.mutateAsync({ displayName: name, name: roomName.trim() || undefined });
      goToRoom(room.code, room.memberId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open a room.");
    }
  };

  const onJoin = async () => {
    setError(null);
    const name = displayName.trim();
    const roomCode = code.trim().toUpperCase();
    if (!name || !roomCode) {
      setError("Name and room code.");
      return;
    }
    try {
      const room = await joinRoom.mutateAsync({
        code: roomCode,
        displayName: name,
        memberId: readMemberId(roomCode) ?? undefined,
      });
      goToRoom(room.code, room.memberId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join.");
    }
  };

  return (
    <>
      <Helmet>
        <title>TogetherWatch</title>
        <meta name="description" content="A room for however many people. Pick titles. See what overlaps." />
      </Helmet>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <Clapperboard size={22} />
            <div>
              <p className={styles.kicker}>Open seating</p>
              <h1 className={styles.title}>TogetherWatch</h1>
            </div>
          </div>
          <ThemeModeSwitch />
        </header>
        <section className={styles.lobby}>
          <p className={styles.lede}>
            Open a room. Send the code. As many people as you want pick titles. Matches rank by how many said yes.
          </p>
          <label className={styles.field}>
            Your name
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Alex" />
          </label>
          <label className={styles.field}>
            Room name <span>(optional)</span>
            <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Friday night" />
          </label>
          <Button onClick={onCreate} disabled={createRoom.isPending}>
            {createRoom.isPending ? "Opening…" : "Open a room"}
          </Button>
          <div className={styles.split}>or join</div>
          <label className={styles.field}>
            Room code
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="K7M2PQ" />
          </label>
          <Button variant="outline" onClick={onJoin} disabled={joinRoom.isPending}>
            {joinRoom.isPending ? "Joining…" : "Join room"}
          </Button>
          {error ? <p className={styles.hint}>{error}</p> : null}
        </section>
      </div>
    </>
  );
}

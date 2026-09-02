import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";
import { Clapperboard, Heart, Search, Users } from "lucide-react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Skeleton } from "../components/Skeleton";
import { ThemeModeSwitch } from "../components/ThemeModeSwitch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/Tabs";
import { useTitles } from "../helpers/useTitles";
import { useTitleSearch } from "../helpers/useTitleSearch";
import { useRoom, useRoomPicks, useToggleRoomPick, useJoinRoom } from "../helpers/useRoom";
import { readMemberId, writeMemberId } from "../helpers/memberSession";
import type { TitleCard } from "../helpers/titleTypes";
import { posterUrl } from "../helpers/titleTypes";
import styles from "./_index.module.css";

export default function RoomPage() {
  const { roomCode = "" } = useParams();
  const code = roomCode.toUpperCase();
  const roomQuery = useRoom(code);
  const room = roomQuery.data;
  const picksQuery = useRoomPicks(room?.roomId);
  const togglePick = useToggleRoomPick(room?.roomId);
  const joinRoom = useJoinRoom();
  const titlesQuery = useTitles();
  const remoteSearch = useTitleSearch();

  const [query, setQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [memberId, setMemberId] = useState(() => readMemberId(code));
  const members = picksQuery.data?.members ?? room?.members ?? [];
  const picks = picksQuery.data?.picks ?? room?.picks ?? [];
  const inRoom = Boolean(memberId && members.some((m) => m.id === memberId));

  const catalog = titlesQuery.data?.titles ?? [];
  const showingSearch = Boolean(activeSearch) && Boolean(remoteSearch.data?.titles);
  const titles = showingSearch ? remoteSearch.data?.titles ?? catalog : catalog;
  const warning = showingSearch ? remoteSearch.data?.warning ?? null : titlesQuery.data?.warning ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (showingSearch && activeSearch.toLowerCase() === q) return titles;
    if (!q) return catalog;
    return catalog.filter((t) => t.name.toLowerCase().includes(q) || String(t.year).includes(q));
  }, [query, titles, catalog, showingSearch, activeSearch]);

  const pickCountByTitle = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const pick of picks) {
      const list = map.get(pick.titleId) ?? [];
      list.push(pick.memberId);
      map.set(pick.titleId, list);
    }
    return map;
  }, [picks]);

  const matchPool = useMemo(() => {
    const map = new Map(catalog.map((t) => [t.id, t]));
    for (const t of titles) map.set(t.id, t);
    return [...map.values()];
  }, [catalog, titles]);

  const rankedMatches = useMemo(() => {
    return matchPool
      .map((title) => {
        const who = pickCountByTitle.get(title.id) ?? [];
        return { title, count: who.length, who };
      })
      .filter((row) => row.count >= 2)
      .sort((a, b) => b.count - a.count || a.title.name.localeCompare(b.title.name));
  }, [matchPool, pickCountByTitle]);

  const myPicks = useMemo(
    () => new Set(picks.filter((p) => p.memberId === memberId).map((p) => p.titleId)),
    [picks, memberId],
  );

  const onSearch = () => {
    const q = query.trim();
    if (!q) {
      setActiveSearch("");
      return;
    }
    setActiveSearch(q);
    remoteSearch.mutate(q);
  };

  const onToggle = (title: TitleCard) => {
    if (!room || !memberId || !inRoom) return;
    togglePick.mutate({ roomId: room.roomId, memberId, titleId: title.id, picked: !myPicks.has(title.id) });
  };

  const onJoin = async () => {
    setJoinError(null);
    const name = joinName.trim();
    if (!name) {
      setJoinError("Name first.");
      return;
    }
    try {
      const joined = await joinRoom.mutateAsync({ code, displayName: name, memberId: memberId ?? undefined });
      writeMemberId(code, joined.memberId);
      setMemberId(joined.memberId);
      await roomQuery.refetch();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Could not join.");
    }
  };

  const loading = roomQuery.isFetching && !room;

  return (
    <>
      <Helmet>
        <title>{room ? `${room.name} · ${code}` : "TogetherWatch"}</title>
      </Helmet>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <Clapperboard size={22} />
            <div>
              <p className={styles.kicker}>
                <Link to="/">TogetherWatch</Link> · {code}
              </p>
              <h1 className={styles.title}>{room?.name ?? "Room"}</h1>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Badge variant="secondary">{members.length} in room</Badge>
            <ThemeModeSwitch />
          </div>
        </header>
        {loading ? <Skeleton style={{ height: 80 }} /> : null}
        {roomQuery.isError ? <p className={styles.hint}>No room with that code. <Link to="/">Open a new one</Link>.</p> : null}
        {room && !inRoom ? (
          <section className={styles.lobby}>
            <p className={styles.lede}>This room is open. Put a name on a seat and start picking.</p>
            <label className={styles.field}>
              Your name
              <Input value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Alex" />
            </label>
            <Button onClick={onJoin} disabled={joinRoom.isPending}>
              {joinRoom.isPending ? "Joining…" : "Take a seat"}
            </Button>
            {joinError ? <p className={styles.hint}>{joinError}</p> : null}
          </section>
        ) : null}
        {room && inRoom ? (
          <>
            <p className={styles.members}>
              {members.map((m) => (
                <Badge key={m.id} variant={m.id === memberId ? "primary" : "secondary"}>{m.displayName}</Badge>
              ))}
            </p>
            <section className={styles.toolbar}>
              <div className={styles.searchWrap}>
                <Search size={16} className={styles.searchIcon} />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (!e.target.value.trim()) setActiveSearch("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSearch();
                  }}
                  placeholder="Search catalog or TMDB"
                  aria-label="Search titles"
                />
              </div>
              <Button size="sm" onClick={onSearch} disabled={remoteSearch.isPending}>
                {remoteSearch.isPending ? "Searching" : "Search TMDB"}
              </Button>
            </section>
            {warning ? <p className={styles.hint}>{warning}</p> : null}
            <Tabs defaultValue="catalog" className={styles.tabs}>
              <TabsList>
                <TabsTrigger value="catalog">Catalog</TabsTrigger>
                <TabsTrigger value="matches">Matches</TabsTrigger>
              </TabsList>
              <TabsContent value="catalog">
                <p className={styles.hint}>Your picks stay yours. Matches need at least two people on the same title.</p>
                <div className={styles.grid}>
                  {filtered.map((title) => {
                    const mine = myPicks.has(title.id);
                    const count = pickCountByTitle.get(title.id)?.length ?? 0;
                    const art = posterUrl(title.posterPath);
                    return (
                      <article key={title.id} className={`${styles.card} ${mine ? styles.cardPicked : ""}`}>
                        {art ? <img className={styles.poster} src={art} alt="" /> : <div className={styles.posterFallback} />}
                        <div className={styles.cardTop}>
                          <Badge variant={title.kind === "tv" ? "secondary" : "outline"}>{title.kind}</Badge>
                          {count >= 2 ? <Badge variant="success">{count} picked</Badge> : count === 1 ? <Badge variant="outline">1 picked</Badge> : null}
                        </div>
                        <h2 className={styles.cardTitle}>{title.name}</h2>
                        <p className={styles.meta}>
                          <span className={styles.year}>{title.year || "—"}</span>
                          <span>{title.source}</span>
                        </p>
                        <p className={styles.overview}>{title.overview}</p>
                        <Button size="sm" variant={mine ? "primary" : "outline"} onClick={() => onToggle(title)}>
                          <Heart size={14} /> {mine ? "Picked" : "Pick"}
                        </Button>
                      </article>
                    );
                  })}
                </div>
              </TabsContent>
              <TabsContent value="matches">
                {rankedMatches.length === 0 ? (
                  <div className={styles.empty}>
                    <Users size={28} />
                    <p>No overlap yet. Need two or more people on the same title.</p>
                  </div>
                ) : (
                  <div className={styles.grid}>
                    {rankedMatches.map(({ title, count, who }) => {
                      const names = who.map((id) => members.find((m) => m.id === id)?.displayName).filter(Boolean);
                      const allIn = members.length > 0 && count === members.length;
                      const art = posterUrl(title.posterPath);
                      return (
                        <article key={title.id} className={`${styles.card} ${styles.cardPicked}`}>
                          {art ? <img className={styles.poster} src={art} alt="" /> : <div className={styles.posterFallback} />}
                          <div className={styles.cardTop}>
                            <Badge variant="success">{allIn ? "everyone" : `${count}/${members.length}`}</Badge>
                          </div>
                          <h2 className={styles.cardTitle}>{title.name}</h2>
                          <p className={styles.meta}>
                            <span className={styles.year}>{title.year || "—"}</span>
                            <span>{title.kind}</span>
                          </p>
                          <p className={styles.overview}>{names.join(", ")}</p>
                        </article>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>
    </>
  );
}

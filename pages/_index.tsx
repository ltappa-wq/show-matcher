import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Clapperboard, Heart, Search, Users } from "lucide-react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Skeleton } from "../components/Skeleton";
import { ThemeModeSwitch } from "../components/ThemeModeSwitch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/Tabs";
import { useTitles } from "../helpers/useTitles";
import { usePicks, useTogglePick } from "../helpers/usePicks";
import { useTitleSearch } from "../helpers/useTitleSearch";
import type { TitleCard } from "../helpers/titleTypes";
import styles from "./_index.module.css";

type Seat = "a" | "b";

export default function TogetherWatchPage() {
  const [query, setQuery] = useState("");
  const [seat, setSeat] = useState<Seat>("a");
  const titlesQuery = useTitles();
  const picksQuery = usePicks();
  const togglePick = useTogglePick();
  const remoteSearch = useTitleSearch();

  const titles = remoteSearch.data?.titles ?? titlesQuery.data?.titles ?? [];
  const warning = remoteSearch.data?.warning ?? titlesQuery.data?.warning ?? null;
  const picks = picksQuery.data ?? { a: [], b: [] };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return titles;
    return titles.filter((t) => t.name.toLowerCase().includes(q) || String(t.year).includes(q));
  }, [query, titles]);

  const matches = useMemo(() => {
    const setB = new Set(picks.b);
    return titles.filter((t) => picks.a.includes(t.id) && setB.has(t.id));
  }, [picks, titles]);

  const onSearch = () => {
    const q = query.trim();
    if (q) remoteSearch.mutate(q);
  };

  const onToggle = (title: TitleCard) => {
    const mine = picks[seat].includes(title.id);
    togglePick.mutate({ seat, titleId: title.id, picked: !mine });
  };

  const loading = titlesQuery.isFetching && !titles.length;

  return (
    <>
      <Helmet>
        <title>TogetherWatch</title>
        <meta name="description" content="Two people. One list. Shows you both actually want to watch." />
      </Helmet>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <Clapperboard size={22} />
            <div>
              <p className={styles.kicker}>Box office for two</p>
              <h1 className={styles.title}>TogetherWatch</h1>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Badge variant="secondary">{matches.length} matches</Badge>
            <ThemeModeSwitch />
          </div>
        </header>
        <section className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
          <div className={styles.seats}>
            <Button variant={seat === "a" ? "primary" : "outline"} size="sm" onClick={() => setSeat("a")}>
              Seat A · {picks.a.length}
            </Button>
            <Button variant={seat === "b" ? "primary" : "outline"} size="sm" onClick={() => setSeat("b")}>
              Seat B · {picks.b.length}
            </Button>
          </div>
        </section>
        {warning ? <p className={styles.hint}>{warning}</p> : null}
        <Tabs defaultValue="catalog" className={styles.tabs}>
          <TabsList>
            <TabsTrigger value="catalog">Catalog</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
          </TabsList>
          <TabsContent value="catalog">
            <p className={styles.hint}>
              Picking as <strong>Seat {seat.toUpperCase()}</strong>. Tap a title to add or drop it.
            </p>
            {loading ? (
              <div className={styles.grid}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} style={{ height: 180 }} />
                ))}
              </div>
            ) : (
              <div className={styles.grid}>
                {filtered.map((title) => {
                  const mine = picks[seat].includes(title.id);
                  const both = picks.a.includes(title.id) && picks.b.includes(title.id);
                  return (
                    <article key={title.id} className={`${styles.card} ${mine ? styles.cardPicked : ""}`}>
                      <div className={styles.cardTop}>
                        <Badge variant={title.kind === "tv" ? "secondary" : "outline"}>{title.kind}</Badge>
                        {both ? <Badge variant="success">match</Badge> : null}
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
            )}
          </TabsContent>
          <TabsContent value="matches">
            {matches.length === 0 ? (
              <div className={styles.empty}>
                <Users size={28} />
                <p>No overlap yet. Both seats need the same title.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {matches.map((title) => (
                  <article key={title.id} className={`${styles.card} ${styles.cardPicked}`}>
                    <div className={styles.cardTop}>
                      <Badge variant="success">both picked</Badge>
                    </div>
                    <h2 className={styles.cardTitle}>{title.name}</h2>
                    <p className={styles.meta}>
                      <span className={styles.year}>{title.year || "—"}</span>
                      <span>{title.kind}</span>
                    </p>
                    <p className={styles.overview}>{title.overview}</p>
                  </article>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

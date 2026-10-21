import { colors, fonts } from "@/constants/theme";
import { Action, Banner, Frame, PageTitle, Screen, Status, Tag, breakWord } from "@/components/ui";
import { fetchStrainJobs, requestStrainJob, useIsAdmin, type StrainJobKind } from "@/lib/admin";
import { fetchAdminQueues, loadStrainMeta } from "@/lib/strainIndex";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Stack, router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type Queue<T = unknown> = { total: number; items: T[] };
type Queues = {
  built: string;
  images_missing: Queue<string>;
  images_failed: Queue<{ slug: string; name: string; error: string | null }>;
  missing_sources: Queue<string>;
  incomplete: Queue<string>;
  duplicates: Queue<{ slug: string; name: string; duplicates: string[] }>;
  lineage_conflicts: Queue<{ slug: string; name: string; claims: { parents: string[]; count: number }[] }>;
  broken_links: Queue<{ slug: string; url: string; link: string }>;
  medical_outdated: Queue<{ slug: string; name: string; period: string; review_after: string }>;
  jobs: { stage: string; ran_at: string; [k: string]: unknown }[];
};

const muted = { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 18 } as const;
const body = { fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 19 } as const;

function SlugLink({ slug, label }: { slug: string; label?: string }) {
  return (
    <Link href={`/strain/${slug}`} asChild>
      <Pressable accessibilityRole="link">
        <Text style={[body, breakWord, { color: colors.phosphor, textDecorationLine: "underline" }]}>{label ?? slug}</Text>
      </Pressable>
    </Link>
  );
}

function QueueFrame<T>({ title, code, tone, queue, render, limit = 8 }: { title: string; code: string; tone: "red" | "amber" | "cyan" | "purple" | "phosphor"; queue: Queue<T>; render: (item: T) => React.ReactNode; limit?: number }) {
  const [more, setMore] = useState(false);
  const items = queue.items.slice(0, more ? queue.items.length : limit);
  return (
    <Frame title={`${title} · ${queue.total.toLocaleString()}`} code={code} tone={tone}>
      {queue.total === 0 ? <Status>Queue empty.</Status> : null}
      {items.map((item, i) => (
        <View key={i} style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 4 }}>
          {render(item)}
        </View>
      ))}
      {queue.items.length > limit ? <Action label={more ? "Show fewer" : `Show ${queue.items.length - limit} more of the first ${queue.items.length}`} tone="cyan" onPress={() => setMore((v) => !v)} /> : null}
    </Frame>
  );
}

export default function StrainAdmin() {
  const gate = useIsAdmin();
  const client = useQueryClient();
  const queues = useQuery({ queryKey: ["strain-admin-queues"], queryFn: () => fetchAdminQueues() as Promise<Queues>, enabled: gate.isAdmin });
  const meta = useQuery({ queryKey: ["strain-meta"], queryFn: loadStrainMeta, enabled: gate.isAdmin });
  const jobs = useQuery({ queryKey: ["strain-jobs"], queryFn: fetchStrainJobs, enabled: gate.isAdmin });
  const request = useMutation({
    mutationFn: ({ kind, slug, payload }: { kind: StrainJobKind; slug: string; payload?: Record<string, unknown> }) => requestStrainJob(kind, slug, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: ["strain-jobs"] }),
  });

  if (!gate.configured) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Strain maintenance" }} />
        <PageTitle tone="red">ADMIN GATE</PageTitle>
        <Banner>Sign-in is not configured on this build, so no one can be verified as an administrator. Maintenance tools stay locked.</Banner>
      </Screen>
    );
  }
  if (gate.loading) {
    return (
      <Screen>
        <Status>Checking access…</Status>
      </Screen>
    );
  }
  if (!gate.user) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Strain maintenance" }} />
        <PageTitle tone="red">ADMIN GATE</PageTitle>
        <Banner>Sign in with an administrator account first.</Banner>
        <Action label="Sign in" onPress={() => router.push("/auth")} />
      </Screen>
    );
  }
  if (!gate.isAdmin) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Strain maintenance" }} />
        <PageTitle tone="red">ADMIN GATE</PageTitle>
        <Banner>You are signed in but not an administrator. The admin role is sealed to the founding operator.</Banner>
      </Screen>
    );
  }

  const q = queues.data;
  const counts = meta.data?.counts;
  const ask = (kind: StrainJobKind, slug: string, payload?: Record<string, unknown>) => request.mutate({ kind, slug, payload });

  return (
    <Screen>
      <Stack.Screen options={{ title: "Strain maintenance" }} />
      <PageTitle>STRAIN MAINTENANCE</PageTitle>
      <Text style={muted}>
        Requests are written to the strain_jobs table, which only administrators can insert into. The offline pipeline (scripts/strains/sync-jobs.mjs) runs them with a server-side key and republishes the index. Nothing here edits a file directly.
      </Text>
      {request.error ? <Banner>{request.error instanceof Error ? request.error.message : "Request failed."}</Banner> : null}
      {request.isSuccess ? <Banner tone="phosphor">Job queued.</Banner> : null}
      {counts ? (
        <Frame title={`ARCHIVE · BUILT ${meta.data?.built}`} code="CNT">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <Tag>{`${counts.records.toLocaleString()} records`}</Tag>
            <Tag tone="phosphor">{`${counts.status.documented.toLocaleString()} documented`}</Tag>
            <Tag tone="amber">{`${counts.status.partial.toLocaleString()} partial`}</Tag>
            <Tag tone="red">{`${counts.status.needs_research.toLocaleString()} need research`}</Tag>
            <Tag tone="cyan">{`${counts.image_stored.toLocaleString()} stored images`}</Tag>
            <Tag tone="cyan">{`${counts.image_on_device.toLocaleString()} device renders`}</Tag>
            <Tag tone="red">{`${counts.image_failed.toLocaleString()} image failures`}</Tag>
          </View>
        </Frame>
      ) : null}
      {queues.isLoading ? <Status>Loading queues…</Status> : null}
      {queues.error ? <Banner>Queues could not be read.</Banner> : null}
      {q ? (
        <>
          <QueueFrame title="IMAGE FAILURES" code="IMG!" tone="red" queue={q.images_failed} render={(item) => (
            <View style={{ gap: 4 }}>
              <SlugLink slug={item.slug} label={item.name} />
              <Text style={muted}>{item.error ?? "unknown error"}</Text>
              <Action label="Queue regeneration" tone="amber" onPress={() => ask("regen_image", item.slug)} />
            </View>
          )} />
          <QueueFrame title="AWAITING STORED IMAGE" code="IMG" tone="cyan" queue={q.images_missing} render={(slug) => (
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 6 }}>
              <SlugLink slug={slug} />
              <Pressable accessibilityRole="button" onPress={() => ask("regen_image", slug)}>
                <Text style={{ fontFamily: fonts.body, color: colors.amber, fontSize: 12, paddingVertical: 4 }}>queue render</Text>
              </Pressable>
            </View>
          )} />
          <QueueFrame title="SUSPECTED DUPLICATES" code="DUP" tone="red" queue={q.duplicates} render={(item) => (
            <View style={{ gap: 4 }}>
              <SlugLink slug={item.slug} label={item.name} />
              {item.duplicates.map((d) => (
                <View key={d} style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <Text style={muted}>≈</Text>
                  <SlugLink slug={d} />
                  <Pressable accessibilityRole="button" onPress={() => ask("not_duplicate", item.slug, { other: d })}>
                    <Text style={{ fontFamily: fonts.body, color: colors.cyan, fontSize: 12, paddingVertical: 4 }}>mark distinct</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )} />
          <QueueFrame title="CONFLICTING LINEAGE" code="LIN" tone="purple" queue={q.lineage_conflicts} render={(item) => (
            <View style={{ gap: 2 }}>
              <SlugLink slug={item.slug} label={item.name} />
              {item.claims.slice(0, 4).map((c, i) => <Text key={i} style={[muted, breakWord]}>{c.parents.join(" × ")} · {c.count}</Text>)}
            </View>
          )} />
          <QueueFrame title="NO SUPPORTING SOURCE" code="SRC" tone="amber" queue={q.missing_sources} render={(slug) => <SlugLink slug={slug} />} />
          <QueueFrame title="NEEDS RESEARCH" code="RES" tone="amber" queue={q.incomplete} render={(slug) => (
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 6 }}>
              <SlugLink slug={slug} />
              <Pressable accessibilityRole="button" onPress={() => ask("research", slug)}>
                <Text style={{ fontFamily: fonts.body, color: colors.amber, fontSize: 12, paddingVertical: 4 }}>re-check sources</Text>
              </Pressable>
            </View>
          )} />
          <QueueFrame title="BROKEN LINKS" code="URL" tone="red" queue={q.broken_links} render={(item) => (
            <View style={{ gap: 2 }}>
              <SlugLink slug={item.slug} />
              <Text style={[muted, breakWord]}>{item.url} · {item.link}</Text>
            </View>
          )} />
          <QueueFrame title="MEDICAL REFERENCES TO REVIEW" code="RX" tone="amber" queue={q.medical_outdated} render={(item) => (
            <View style={{ gap: 2 }}>
              <SlugLink slug={item.slug} label={item.name} />
              <Text style={muted}>{item.period} · review after {item.review_after}</Text>
            </View>
          )} />
          <Frame title="PIPELINE RUNS" code="JOB" tone="cyan">
            {q.jobs.slice().reverse().slice(0, 12).map((run, i) => (
              <Text key={i} style={[muted, breakWord]}>
                {run.ran_at.slice(0, 16).replace("T", " ")} · {run.stage} · {JSON.stringify(Object.fromEntries(Object.entries(run).filter(([k]) => k !== "stage" && k !== "ran_at"))).slice(0, 220)}
              </Text>
            ))}
          </Frame>
        </>
      ) : null}
      <Frame title="REQUESTED JOBS" code="REQ" tone="amber">
        {jobs.isLoading ? <Status>Loading…</Status> : null}
        {jobs.error ? <Banner>{jobs.error instanceof Error ? jobs.error.message : "Jobs could not be read."}</Banner> : null}
        {(jobs.data ?? []).length === 0 && !jobs.isLoading ? <Status>No requests yet.</Status> : null}
        {(jobs.data ?? []).map((job) => (
          <Text key={job.id} style={[muted, breakWord]}>
            {job.created_at.slice(0, 16).replace("T", " ")} · {job.kind} · {job.slug} · <Text style={{ color: job.status === "failed" ? colors.red : job.status === "done" ? colors.phosphor : colors.amber }}>{job.status}</Text>
            {job.error ? ` · ${job.error}` : ""}
          </Text>
        ))}
      </Frame>
    </Screen>
  );
}

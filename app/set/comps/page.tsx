import { Panel, SectionTitle } from "@/components/ui/Panel";
import { CompList } from "@/components/set/CompList";
import { loadComps } from "@/lib/comps";
import { itemLookup, requireSetData, traitLookup, unitLookup } from "@/lib/set-data";
import { loadTiers, ranksById } from "@/lib/tiers";
import { loadMeta } from "@/lib/meta";
import { MetaExplorer } from "@/components/set/MetaExplorer";
import { compsChangesStamp } from "@/lib/comps-changes";
import { loadCompsChanges } from "@/lib/comps-changes-server";
import { compsFreshness } from "@/lib/live-patch";

export const metadata = {
  title: "Comps tier list",
  description: "The best Teamfight Tactics comps this patch, ranked S to C, each with positioning on the board, carries and items, flexible units, augments and how to play it.",
};

export default function CompsPage() {
  const data = requireSetData();
  const file = loadComps();
  const meta = loadMeta();
  if (!file) {
    return (
      <><MetaExplorer meta={meta} champions={data.champions} items={data.items}/><Panel>
        <SectionTitle kicker="Comps">No comps for this set yet</SectionTitle>
        <p className="text-sm text-dim">Add content/sets/&lt;n&gt;/comps.json (see the README runbook).</p>
      </Panel></>
    );
  }
  const tiers = loadTiers();
  const traitNames = Object.fromEntries(Object.values(traitLookup()).map((t) => [t.id, t.name]));
  const augments = Object.fromEntries(data.augments.map((a) => [a.id, { id: a.id, name: a.name, icon: a.icon, tier: a.tier, desc: a.desc }]));
  const fresh = compsFreshness();
  // An augment Riot renamed or removed mid-set is skipped rather than shown as a raw id (the validator warns about it).
  const known = { ...file, comps: file.comps.map((c) => ({ ...c, augments: c.augments.filter((a) => a.augmentId in augments) })) };
  return (
    <div>
      <MetaExplorer meta={meta} champions={data.champions} items={data.items}/>
      <p className="mb-4 max-w-2xl text-sm text-dim">
        The lines worth learning this patch, ordered by tier. Each card opens into the full guide: default positioning on the real board, carries with their best items, flexible and late-game units, best augments and how to play it. Open any board in the team planner to
        simulate it against a lobby board.
      </p>
      <CompList
        file={known}
        freshness={{ curatedPatch: fresh.curatedPatch, livePatch: fresh.live.label, stale: fresh.stale, publishedAt: fresh.live.publishedAt, notesHref: fresh.live.notesHref }}
        changes={loadCompsChanges()}
        changesStamp={compsChangesStamp(loadCompsChanges())}
        meta={null}
        live={{}}
        units={unitLookup()}
        items={itemLookup()}
        traitNames={traitNames}
        traits={Object.fromEntries(data.traits.map((t) => [t.id, { id: t.id, name: t.name, icon: t.icon, breakpoints: t.breakpoints.map((b) => ({ units: b.units, style: b.style })) }]))}
        augments={augments}
        itemRanks={ranksById(data.items, tiers?.items)}
        augmentRanks={ranksById(data.augments, tiers?.augments)}
      />
    </div>
  );
}

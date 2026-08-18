/*
 * The UI kit.
 *
 * Screens compose these rather than authoring markup. Every piece takes its
 * colour, radius, elevation, motion and type size from the tokens in index.css,
 * so a screen built from the kit follows a change of theme without being touched,
 * and no screen has to carry a literal colour to look right.
 *
 * Start from `Screen`: it takes an archetype and arranges the header band, the
 * create rail and the content for you.
 */
export { default as Screen } from "./Screen";
export { default as AuthFrame } from "./AuthFrame";
export { default as ActionCard } from "./ActionCard";
export { default as PageHeader } from "./PageHeader";
export { default as SectionHeading } from "./SectionHeading";
export { default as StatRow } from "./StatRow";
export { default as InlineCreateForm } from "./InlineCreateForm";
export { default as RecordList } from "./RecordList";
export { default as RecordCard } from "./RecordCard";
export { default as DataTable } from "./DataTable";
export { default as RankedTable } from "./RankedTable";
export { default as EmptyState } from "./EmptyState";
export { default as Field } from "./Field";
export { default as Toggle } from "./Toggle";
export { default as PrimaryButton } from "./PrimaryButton";

export { useCollection } from "./useCollection";
export {
  formatDate,
  formatDuration,
  formatMoney,
  formatNumber,
  formatPercent,
  today,
} from "./format";

export type * from "./types";

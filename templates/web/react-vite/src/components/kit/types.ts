import type { ReactNode } from "react";

/*
 * The kit's public surface, in one file.
 *
 * Components import their props from here rather than declaring them inline, so
 * that this file alone is enough to compose a screen without reading any
 * implementation. Anything exported from the kit that a page can pass is
 * described here; anything not here is internal and may change.
 */

/**
 * The shape of a screen, not its subject.
 *
 * Reaching for a layout by name is the point. Given a blank canvas, a screen ends
 * up as a centred column of equal-weight bordered boxes every time, whatever it is
 * about, and that sameness is what makes an application look automatically
 * produced. An archetype fixes the composition up front and leaves only the
 * content to decide.
 *
 * - `ledger`     dense table beside a create rail, under a figures band. Money.
 * - `tracker`    one headline figure, then entries. Habits, training, streaks.
 * - `board`      a wide grid of cards. Things you scan, not things you total.
 * - `roster`     a ranked table. Standings, leaderboards, directories.
 * - `feed`       a narrow reading column, newest first. Posts, notes, updates.
 * - `dashboard`  stat band over a split of two related collections.
 */
export type Archetype =
  "ledger" | "tracker" | "board" | "roster" | "feed" | "dashboard";

export interface ScreenProps {
  archetype: Archetype;
  title: string;
  /** One short line under the title. */
  tagline?: string;
  /** Controls that belong beside the title: a filter, a link, a secondary action. */
  actions?: ReactNode;
  /**
   * Figures for the header band, normally a `<StatRow>`. Banded archetypes render
   * their header in brand colour whether or not this is present.
   */
  band?: ReactNode;
  /**
   * The secondary panel, normally an `<InlineCreateForm>`. Where it lands depends
   * on the archetype: a rail beside the content, or a view of its own above it.
   */
  aside?: ReactNode;
  children: ReactNode;
}

export interface PageHeaderProps {
  title: string;
  tagline?: string;
  actions?: ReactNode;
  /** Set on a brand-coloured band so the type flips to the band's ink. */
  onBand?: boolean;
  /** Screen picks this from the archetype. `display` at most once per page. */
  size?: "title" | "display";
}

export interface SectionHeadingProps {
  children: ReactNode;
  /** Right-hand side of the rule: a count, a total, a link. */
  trailing?: ReactNode;
}

export type StatFormat =
  | "number"
  | "currency"
  | "percent"
  /** Minutes, rounded, as "1h 20m". Wrong unit for anything under an hour. */
  | "duration"
  /** Seconds as a clock: "4:15", "1:17:15". Use this for times people race. */
  | "clock"
  | "plain";

export interface Stat {
  label: string;
  /** Numbers count up on first paint; strings are shown as given. */
  value: number | string;
  format?: StatFormat;
  /** A short qualifier under the figure: "this month", "since April". */
  hint?: string;
}

export interface StatRowProps {
  items: Stat[];
  /** Currency code for `currency` stats. Defaults to USD. */
  currency?: string;
  /** Set on a brand-coloured band. */
  onBand?: boolean;
  /**
   * Renders the first item as the hero figure: a filled panel, half again the
   * size of the others. On by default, because a row of equal figures tells the
   * reader nothing about which one the screen is for. Pass `false` only when the
   * figures genuinely rank equally.
   */
  lead?: boolean;
}

export type Tone = "neutral" | "accent" | "positive" | "warn" | "negative";

export interface BadgeProps {
  children: ReactNode;
  /** Reads from the kit's colour roles, never from a literal colour. */
  tone?: Tone;
  /** A filled dot before the label, for a status rather than a category. */
  dot?: boolean;
}

export type FieldType =
  "text" | "textarea" | "number" | "currency" | "date" | "select" | "checkbox";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldSpec {
  /** Matches the API field name; it is the key in the submitted values. */
  name: string;
  label: string;
  /** Defaults to `text`. */
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  /** Required for `select`. */
  options?: FieldOption[];
  /** A short note under the control. */
  hint?: string;
  /** `date` fields accept the literal "today". */
  defaultValue?: string | number | boolean;
  /** Keeps its value after a successful submit, for repeated entry. */
  sticky?: boolean;
  /** How many grid columns the field spans. Defaults to 1. */
  span?: 1 | 2 | 3;
}

export type FieldValue = string | number | boolean;
export type FieldValues = Record<string, FieldValue>;

export interface FieldProps {
  field: FieldSpec;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  disabled?: boolean;
}

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  disabled?: boolean;
}

export interface PrimaryButtonProps {
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  /** `quiet` is the secondary action; `onBand` sits on brand colour. */
  variant?: "primary" | "quiet" | "onBand";
  busy?: boolean;
  /** Replaces the label while `busy`. */
  busyLabel?: string;
  disabled?: boolean;
  full?: boolean;
}

export interface InlineCreateFormProps {
  /** Written in the subject's voice: "Post an entry", not "Create record". */
  title: string;
  fields: FieldSpec[];
  onSubmit: (values: FieldValues) => Promise<unknown>;
  submitLabel: string;
  busyLabel?: string;
  /** Fields per row at desktop width. Defaults to 1, which suits a rail. */
  columns?: 1 | 2 | 3;
  /**
   * Hides the form and shows `note` instead. Pass the negation of a role check so
   * that people who cannot post are not given a form that will be refused.
   */
  locked?: boolean;
  note?: string;
}

export type LoadState = "loading" | "ready" | "error";

export interface EmptyStateProps {
  title: string;
  body?: string;
  action?: ReactNode;
}

export interface RecordListProps {
  state: LoadState;
  error?: string | null;
  /** Shown when the collection loaded and is empty. */
  empty: EmptyStateProps;
  /** `grid` for cards, `rows` for a stacked list. Defaults to `grid`. */
  layout?: "grid" | "rows";
  columns?: 1 | 2 | 3;
  children: ReactNode;
}

export interface RecordCardProps {
  title: string;
  /** A short chip: a category, a grade, a status. */
  badge?: string;
  /** Colour role for the chip. Defaults to neutral. */
  badgeTone?: Tone;
  /** The number this record is about, already formatted. Right-aligned. */
  figure?: string;
  /** Whether the figure reads as a gain or a loss. */
  tone?: "neutral" | "positive" | "negative";
  /** A line of context under the title: a date, an author, a place. */
  meta?: string;
  body?: ReactNode;
  footer?: ReactNode;
}

export interface Column<T> {
  /** Identifies the column; used as the React key. */
  key: string;
  label: string;
  /** Figures belong on the right, in tabular figures. */
  align?: "left" | "right";
  /** Renders the cell. Return a string for plain text. */
  render: (row: T) => ReactNode;
  /** Hidden below the `lg` breakpoint, for columns that are not essential. */
  secondary?: boolean;
  /**
   * The column carrying the answer. Set on one column at most: a table of
   * figures where every column is the same weight makes the reader find the one
   * that matters, which is work the table should have done.
   */
  lead?: boolean;
  /** Dims the column, for a raw input next to the figure derived from it. */
  quiet?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  /** A totals row, keyed by column key. */
  footer?: Record<string, ReactNode>;
  state?: LoadState;
  error?: string | null;
  empty?: EmptyStateProps;
}

export interface RankedTableProps<T> extends DataTableProps<T> {
  /** Column head for the rank. Defaults to "#". */
  rankLabel?: string;
}

export interface AuthFrameProps {
  /** The application's name, set at display size. */
  title: string;
  /** One or two sentences on what this is for. */
  pitch: string;
  /** Three short lines at most: what someone can actually do here. */
  points?: string[];
  /** The sign-in screens. Rendered once, unchanged. */
  children: ReactNode;
}

/*
 * The layout classes a screen is allowed to use.
 *
 * Everything else about a page's geometry belongs to `Screen` and to the theme,
 * the gutter, the content width, where the content sits, how wide a column may
 * be. These three are the exception, for the cases where a screen genuinely has
 * a handful of things to lay out and no collection component owns them.
 *
 * Use them instead of naming a column count. `sm:grid-cols-2 xl:grid-cols-3`
 * reads as harmless and is not: how many columns fit is the one thing each look
 * was given to differ on, so a page that fixes it renders identically in every
 * look and switching the look does nothing on that screen.
 *
 *   auto-grid    a collection: as many columns as fit, at the theme's own
 *                minimum width, and every card the same width however many
 *                there are
 *   auto-grid-3  the same, tighter, for small cards
 *   auto-row     a known, small set, the two or three tiles on a landing
 *                screen, sharing the width between them rather than lining up
 *                at the left of a row sized for more
 *   stack        one column, at the theme's own gap
 */
export type LayoutClass = "auto-grid" | "auto-grid-3" | "auto-row" | "stack";

export interface ActionCardProps {
  /** A route path, e.g. "/claims". */
  to: string;
  title: string;
  body?: string;
  /** A figure or count worth showing on the card. */
  figure?: string;
  /**
   * A glyph for the card, normally a lucide icon element. A route someone picks
   * from a landing screen is recognised by shape long before it is read.
   */
  icon?: ReactNode;
}

export interface UseCollectionOptions {
  /**
   * Refetch every this many milliseconds, and whenever the window is looked at
   * again. Off by default, and off is right for a collection only its owner
   * edits. Turn it on where more than one person is looking at the same records
   * and a stale screen would mislead them: a shared list, a thread, a rota. A few
   * seconds reads as live to a group of a dozen, and costs one request each,
   * which is the whole reason not to reach for a socket server.
   */
  live?: number | false;
}

export interface UseCollection<T> {
  records: T[];
  state: LoadState;
  error: string | null;
  /** Posts, and shows the new record immediately. Rolls back if the post fails. */
  create: (values: FieldValues) => Promise<T>;
  creating: boolean;
  /** Fetches again from the start, loading state and all. For a retry button. */
  reload: () => void;
  /**
   * Fetches again underneath the reader: no loading state, no error cleared, and
   * a record still being created is kept. `live` calls this for you; call it
   * directly after something you know changed the collection on the server.
   */
  refresh: () => void;
}

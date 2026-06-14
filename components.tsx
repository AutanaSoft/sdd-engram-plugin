/** @jsxImportSource @opentui/solid */
import type { ActiveProfileState, BadgeDisplayMode } from "./src/types";
import { formatContext } from "./src/utils";

export function formatActiveModelBadgeText(
  profile: ActiveProfileState | null | undefined,
  displayMode: BadgeDisplayMode = "model",
): string {
  if (!profile) return "No SDD model active";
  const profileName =
    typeof profile.profileName === "string" ? profile.profileName.trim() : "";
  const useProfileLabel = displayMode === "profile" && profileName.length > 0;
  const label = useProfileLabel ? profileName : profile.modelName;
  const effortLabel = typeof profile.reasoningEffort === "string" && profile.reasoningEffort.trim()
    ? ` · effort: ${profile.reasoningEffort.trim()}`
    : "";
  return `${label} · ${formatContext(profile.contextLimit)}${effortLabel}`;
}

// Style primitives resolved once at setup time. Solid's JSX prop bindings
// are reactive; writing fg/attributes after the host TextBuffer is recreated
// (e.g. on terminal resize) can crash the renderer.
export function resolveActiveModelBadgeStyle(
  profile: ActiveProfileState | null | undefined,
  theme: any,
): { iconFg: string; iconAttributes: number; labelFg: string } {
  const iconFg = profile
    ? theme?.primary || "#00ff00"
    : theme?.textMuted || "#888";
  const iconAttributes = profile ? 1 : 0;
  const labelFg = theme?.text || "inherit";
  return { iconFg, iconAttributes, labelFg };
}

/**
 * UI Badge component that displays information about the active SDD model
 *
 * @param props.profile - The currently active profile state
 * @param props.theme - The current UI theme configuration
 * @param props.displayMode - "model" (default) shows model info; "profile" shows profile name
 */
export function ActiveModelBadge(props: {
  profile: ActiveProfileState | null | undefined;
  theme: any;
  displayMode?: BadgeDisplayMode;
}) {
  const { iconFg, iconAttributes, labelFg } = resolveActiveModelBadgeStyle(
    props.profile,
    props.theme,
  );

  return (
    <box flexDirection="row" alignItems="center" paddingLeft={1} paddingRight={1}>
      <text fg={iconFg} attributes={iconAttributes}>
        {props.profile ? "󰚩 " : "󱚧 "}
      </text>
      <text fg={labelFg}>
        {formatActiveModelBadgeText(props.profile, props.displayMode)}
      </text>
    </box>
  );
}

/** @jsxImportSource @opentui/solid */
import { formatContext } from "./src/utils";

export function formatActiveModelBadgeText(profile: any): string {
  if (!profile) return "No SDD model active";
  const effortLabel = typeof profile.reasoningEffort === "string" && profile.reasoningEffort.trim()
    ? ` · effort: ${profile.reasoningEffort.trim()}`
    : "";
  return `${profile.modelName} · ${formatContext(profile.contextLimit)}${effortLabel}`;
}

/**
 * UI Badge component that displays information about the active SDD model
 * 
 * @param props.profile - The currently active profile state
 * @param props.theme - The current UI theme configuration
 */
export function ActiveModelBadge(props: { profile: any; theme: any }) {
  const text = formatActiveModelBadgeText(props.profile);

  const color = props.profile
    ? (props.theme?.primary || "#00ff00") 
    : (props.theme?.textMuted || "#888");

  const icon = props.profile ? "󰚩 " : "󱚧 ";
  const bold = Boolean(props.profile);
  const textColor = props.theme?.text || "inherit";

  return (
    <box flexDirection="row" alignItems="center" paddingLeft={1} paddingRight={1}>
      <text fg={color} attributes={bold ? 1 : 0}>
        {icon}
      </text>
      <text fg={textColor}>
        {text}
      </text>
    </box>
  );
}

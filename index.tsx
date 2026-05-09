/** @jsxImportSource @opentui/solid */
/**
 * SDD Model Select Plugin Entry Point
 *
 * This plugin allows users to manage and switch between different SDD profiles,
 * providing a visual badge for the active model and project-specific memory management.
 */

import * as fs from "node:fs";
import type { TuiPlugin, TuiPluginModule } from "@opencode-ai/plugin/tui";
import { createEffect, createRoot } from "solid-js";
import { ActiveModelBadge } from "./components";
import { resolvePaths } from "./src/config";
import {
	registerDialogCallbacks,
	showProfileDetail,
	showProfileList,
	showProfilesMenu,
	showProjectMemoriesMenu,
} from "./src/dialogs";
import { getOrchestratorPolicy } from "./src/orchestrator";
import { migrateProfilesForRuntimePolicy } from "./src/profiles";
import { createLogger } from "./src/logger";
// Direct imports to avoid barrel resolution issues in some environments
import { activeProfile, setActiveProfile } from "./src/state";
import {
	parseActiveProfileFromRaw,
	resolveSessionActiveModel,
} from "./src/utils";

// -- Plugin Initialization ---------------------------------------------------

const log = createLogger("tui");

/**
 * Initializes dialog callbacks to resolve circular dependencies between different UI views.
 */
function initializeDialogs() {
	registerDialogCallbacks({
		showProfilesMenu,
		showProfileList,
		showProfileDetail,
		showProjectMemoriesMenu,
	});
}

/**
 * Reads the currently active profile from the local configuration file.
 *
 * @param api - The TUI API instance
 * @returns The active profile state or null if not found/invalid
 */
function readActiveProfile(api: any) {
	const { configPath } = resolvePaths();
	try {
		if (!fs.existsSync(configPath)) return null;
		const raw = fs.readFileSync(configPath, "utf-8");
		return parseActiveProfileFromRaw(raw, api);
	} catch (error) {
		log.warn(`readActiveProfile: failed to read ${configPath}`, error);
		return null;
	}
}

function resolveDisplayedModel(api: any, sessionId?: string) {
	return resolveSessionActiveModel(api, sessionId) || activeProfile();
}

function registerProfilesCommand(api: any) {
	createRoot((disposeRoot) => {
		api.lifecycle.onDispose(disposeRoot);

		const disposeLayer = api.keymap.registerLayer({
			priority: 100,
			commands: [
				{
					name: "sdd-model",
					title: "󰓅 SDD Profiles",
					desc: "Manage SDD profiles",
					category: "SDD",
					run: () => {
						showProfilesMenu(api);
						return true;
					},
				},
			],
			bindings: [
				{ key: "alt+k", cmd: "sdd-model" },
				{ key: "super+k", cmd: "sdd-model" },
			],
		});

		api.lifecycle.onDispose(disposeLayer);
	});
}

function renderSlot(api: any, render: () => any) {
	return createRoot((dispose) => {
		api.lifecycle.onDispose(dispose);
		return render();
	});
}

function registerSlots(api: any) {
	createRoot((dispose) => {
		api.lifecycle.onDispose(dispose);

		api.slots.register({
			slots: {
				home_bottom(ctx: any) {
					return renderSlot(api, () => {
						const route = api.route.current;
						const sessionId =
							route.name === "session" ? route.params?.sessionID : undefined;
						return (
							<ActiveModelBadge
								profile={resolveDisplayedModel(api, sessionId)}
								theme={ctx.theme.current}
							/>
						);
					});
				},
				sidebar_content(ctx: any) {
					return renderSlot(api, () => (
						<ActiveModelBadge
							profile={resolveDisplayedModel(api, ctx.session_id)}
							theme={ctx.theme.current}
						/>
					));
				},
			},
		});
	});
}

// -- Plugin Entry ------------------------------------------------------------

const id = "sdd-model-select";

/**
 * Main TUI plugin entry function
 * Registers commands and UI slots for the plugin
 */
const tui: TuiPlugin = async (api) => {
	// Initialize dialog callbacks
	initializeDialogs();

	const runtimePolicy = getOrchestratorPolicy(
		Object.keys(api?.state?.config?.agent || {}),
		api?.state?.config?.default_agent,
	);
	migrateProfilesForRuntimePolicy(runtimePolicy);

	// Load and set the active profile in the global state
	const profile = readActiveProfile(api);
	setActiveProfile(profile);

	// Keep the active profile in sync with global config changes.
	createRoot((dispose) => {
		api.lifecycle.onDispose(dispose);
		createEffect(() => {
			const currentConfig = api.state.config;
			if (currentConfig) {
				setActiveProfile(
					parseActiveProfileFromRaw(JSON.stringify(currentConfig), api),
				);
			}
		});
	});

	// Register the main command using the current OpenCode TUI keymap API.
	registerProfilesCommand(api);

	// Register UI slots inside a Solid root because the host slot plugin creates cleanups.
	registerSlots(api);
};

const plugin: TuiPluginModule & { id: string } = { id, tui };
export default plugin;

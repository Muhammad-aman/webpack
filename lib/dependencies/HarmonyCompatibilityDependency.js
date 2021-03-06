/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const InitFragment = require("../InitFragment");
const RuntimeGlobals = require("../RuntimeGlobals");
const makeSerializable = require("../util/makeSerializable");
const NullDependency = require("./NullDependency");

/** @typedef {import("webpack-sources").ReplaceSource} ReplaceSource */
/** @typedef {import("../Dependency")} Dependency */
/** @typedef {import("../DependencyTemplate").DependencyTemplateContext} DependencyTemplateContext */
/** @typedef {import("../Module")} Module */

class HarmonyCompatibilityDependency extends NullDependency {
	get type() {
		return "harmony export header";
	}
}

makeSerializable(
	HarmonyCompatibilityDependency,
	"webpack/lib/dependencies/HarmonyCompatibilityDependency"
);

HarmonyCompatibilityDependency.Template = class HarmonyExportDependencyTemplate extends NullDependency.Template {
	/**
	 * @param {Dependency} dependency the dependency for which the template should be applied
	 * @param {ReplaceSource} source the current replace source which can be modified
	 * @param {DependencyTemplateContext} templateContext the context object
	 * @returns {void}
	 */
	apply(
		dependency,
		source,
		{ module, runtimeTemplate, moduleGraph, initFragments, runtimeRequirements }
	) {
		// TODO avoid getUsedExports
		const usedExports = moduleGraph.getUsedExports(module);
		if (usedExports === true || usedExports === null) {
			const content = runtimeTemplate.defineEsModuleFlagStatement({
				exportsArgument: module.exportsArgument,
				runtimeRequirements
			});
			initFragments.push(
				new InitFragment(
					content,
					InitFragment.STAGE_HARMONY_EXPORTS,
					0,
					"harmony compatibility"
				)
			);
		}
		if (moduleGraph.isAsync(module)) {
			runtimeRequirements.add(RuntimeGlobals.module);
			if (usedExports !== false)
				runtimeRequirements.add(RuntimeGlobals.exports);
			initFragments.push(
				new InitFragment(
					`${module.moduleArgument}.exports = (async () => {\n`,
					InitFragment.STAGE_ASYNC_BOUNDARY,
					0,
					undefined,
					usedExports !== false
						? `\nreturn ${module.exportsArgument};\n})();`
						: "\n})();"
				)
			);
		}
	}
};

module.exports = HarmonyCompatibilityDependency;

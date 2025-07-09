/**
 * Module Import Patterns & ES Module Setup
 * Standardize ES module imports across the codebase
 */

import { Logger } from './logger.js';

/**
 * Import organization rules
 */
export const IMPORT_RULES = {
	// Import order
	order: [
		'node-builtin',      // Node.js built-in modules
		'external',          // External npm packages
		'internal-absolute', // Internal absolute imports
		'internal-relative', // Internal relative imports
		'types'             // Type imports (TypeScript)
	],
	
	// Group spacing
	groupSpacing: true,
	
	// Sort alphabetically within groups
	alphabeticalSort: true,
	
	// Max line length for imports
	maxLineLength: 100,
	
	// Prefer named imports
	preferNamed: true,
	
	// Avoid default exports
	avoidDefault: false
};

/**
 * Module pattern analyzer
 */
export class ModuleAnalyzer {
	constructor(options = {}) {
		this.logger = options.logger || null;
		this.rules = { ...IMPORT_RULES, ...options.rules };
		this.issues = [];
		this.suggestions = [];
	}

	/**
	 * Analyze import statement
	 * @param {string} importStatement - Import statement
	 * @returns {Object} Analysis result
	 */
	analyzeImport(importStatement) {
		const analysis = {
			type: null,
			source: null,
			specifiers: [],
			isDefault: false,
			isNamespace: false,
			isNamed: false,
			isDynamic: false,
			issues: []
		};

		// Dynamic import
		if (importStatement.includes('import(')) {
			analysis.isDynamic = true;
			const match = importStatement.match(/import\(['"`](.+?)['"`]\)/);
			if (match) {
				analysis.source = match[1];
			}
			return analysis;
		}

		// Static import
		const importRegex = /^import\s+(.+?)\s+from\s+['"`](.+?)['"`]/;
		const match = importStatement.match(importRegex);
		
		if (!match) {
			analysis.issues.push('Invalid import syntax');
			return analysis;
		}

		const [, specifiersPart, source] = match;
		analysis.source = source;

		// Determine import type
		if (source.startsWith('.')) {
			analysis.type = 'internal-relative';
		} else if (source.startsWith('@/') || source.startsWith('~/')) {
			analysis.type = 'internal-absolute';
		} else if (this.isBuiltinModule(source)) {
			analysis.type = 'node-builtin';
		} else {
			analysis.type = 'external';
		}

		// Parse specifiers
		this.parseSpecifiers(specifiersPart, analysis);

		// Check rules
		this.checkRules(analysis);

		return analysis;
	}

	/**
	 * Parse import specifiers
	 * @param {string} specifiersPart - Specifiers part of import
	 * @param {Object} analysis - Analysis object
	 */
	parseSpecifiers(specifiersPart, analysis) {
		// Default import
		if (specifiersPart.match(/^\w+$/)) {
			analysis.isDefault = true;
			analysis.specifiers.push({
				type: 'default',
				local: specifiersPart.trim()
			});
			return;
		}

		// Namespace import
		if (specifiersPart.includes('* as')) {
			analysis.isNamespace = true;
			const match = specifiersPart.match(/\*\s+as\s+(\w+)/);
			if (match) {
				analysis.specifiers.push({
					type: 'namespace',
					local: match[1]
				});
			}
			return;
		}

		// Named imports
		const namedMatch = specifiersPart.match(/\{(.+?)\}/);
		if (namedMatch) {
			analysis.isNamed = true;
			const named = namedMatch[1].split(',').map(spec => {
				const parts = spec.trim().split(/\s+as\s+/);
				return {
					type: 'named',
					imported: parts[0].trim(),
					local: parts[1]?.trim() || parts[0].trim()
				};
			});
			analysis.specifiers.push(...named);
		}

		// Mixed default and named
		const mixedMatch = specifiersPart.match(/(\w+),\s*\{(.+?)\}/);
		if (mixedMatch) {
			analysis.isDefault = true;
			analysis.isNamed = true;
			
			// Default
			analysis.specifiers.push({
				type: 'default',
				local: mixedMatch[1].trim()
			});
			
			// Named
			const named = mixedMatch[2].split(',').map(spec => {
				const parts = spec.trim().split(/\s+as\s+/);
				return {
					type: 'named',
					imported: parts[0].trim(),
					local: parts[1]?.trim() || parts[0].trim()
				};
			});
			analysis.specifiers.push(...named);
		}
	}

	/**
	 * Check if module is Node.js built-in
	 * @param {string} source - Module source
	 * @returns {boolean} Is built-in
	 */
	isBuiltinModule(source) {
		const builtins = [
			'fs', 'path', 'http', 'https', 'crypto', 'stream',
			'util', 'url', 'querystring', 'child_process', 'cluster',
			'os', 'buffer', 'events', 'assert', 'zlib', 'readline'
		];
		return builtins.includes(source.split('/')[0]);
	}

	/**
	 * Check import against rules
	 * @param {Object} analysis - Import analysis
	 */
	checkRules(analysis) {
		// Check prefer named
		if (this.rules.preferNamed && analysis.isDefault && !analysis.isNamed) {
			analysis.issues.push('Prefer named imports over default imports');
		}

		// Check avoid default
		if (this.rules.avoidDefault && analysis.isDefault) {
			analysis.issues.push('Avoid default exports/imports');
		}

		// Check line length
		const importLength = `import ${analysis.specifiers.map(s => s.local).join(', ')} from '${analysis.source}'`.length;
		if (importLength > this.rules.maxLineLength) {
			analysis.issues.push(`Import exceeds max line length (${importLength} > ${this.rules.maxLineLength})`);
		}
	}

	/**
	 * Analyze file imports
	 * @param {string} fileContent - File content
	 * @returns {Object} File analysis
	 */
	analyzeFile(fileContent) {
		const lines = fileContent.split('\n');
		const imports = [];
		const importGroups = {};
		let lastImportLine = -1;
		let hasIssues = false;

		// Extract imports
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			
			if (line.startsWith('import ')) {
				const analysis = this.analyzeImport(line);
				analysis.lineNumber = i + 1;
				imports.push(analysis);
				
				if (analysis.issues.length > 0) {
					hasIssues = true;
				}

				// Group imports
				if (!importGroups[analysis.type]) {
					importGroups[analysis.type] = [];
				}
				importGroups[analysis.type].push(analysis);
				
				lastImportLine = i;
			} else if (line && lastImportLine >= 0 && i > lastImportLine + 1) {
				// Non-import code found
				break;
			}
		}

		// Check import order
		const actualOrder = Object.keys(importGroups);
		const expectedOrder = this.rules.order.filter(type => actualOrder.includes(type));
		
		if (JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) {
			hasIssues = true;
			this.issues.push({
				type: 'import-order',
				message: 'Imports are not properly ordered',
				actual: actualOrder,
				expected: expectedOrder
			});
		}

		// Check alphabetical sorting within groups
		if (this.rules.alphabeticalSort) {
			for (const [type, group] of Object.entries(importGroups)) {
				const sources = group.map(imp => imp.source);
				const sorted = [...sources].sort();
				
				if (JSON.stringify(sources) !== JSON.stringify(sorted)) {
					hasIssues = true;
					this.issues.push({
						type: 'alphabetical-sort',
						message: `Imports in ${type} group are not alphabetically sorted`,
						group: type
					});
				}
			}
		}

		// Check group spacing
		if (this.rules.groupSpacing && Object.keys(importGroups).length > 1) {
			// This would require more complex line analysis
			// Simplified check here
		}

		return {
			imports,
			importGroups,
			hasIssues,
			issues: this.issues,
			suggestions: this.generateSuggestions(imports, importGroups)
		};
	}

	/**
	 * Generate improvement suggestions
	 * @param {Array} imports - Import analyses
	 * @param {Object} importGroups - Grouped imports
	 * @returns {Array} Suggestions
	 */
	generateSuggestions(imports, importGroups) {
		const suggestions = [];

		// Suggest combining imports from same source
		const sourceMap = {};
		imports.forEach(imp => {
			if (!sourceMap[imp.source]) {
				sourceMap[imp.source] = [];
			}
			sourceMap[imp.source].push(imp);
		});

		for (const [source, imps] of Object.entries(sourceMap)) {
			if (imps.length > 1) {
				suggestions.push({
					type: 'combine-imports',
					message: `Combine multiple imports from '${source}'`,
					imports: imps.map(imp => imp.lineNumber)
				});
			}
		}

		// Suggest converting to named imports
		imports.forEach(imp => {
			if (imp.isDefault && !imp.isNamed && this.rules.preferNamed) {
				suggestions.push({
					type: 'use-named-import',
					message: `Convert default import to named import for '${imp.source}'`,
					lineNumber: imp.lineNumber
				});
			}
		});

		return suggestions;
	}

	/**
	 * Generate organized imports
	 * @param {Array} imports - Import analyses
	 * @returns {string} Organized imports
	 */
	generateOrganizedImports(imports) {
		const groups = {};
		
		// Group imports
		imports.forEach(imp => {
			if (!groups[imp.type]) {
				groups[imp.type] = [];
			}
			groups[imp.type].push(imp);
		});

		// Sort within groups
		if (this.rules.alphabeticalSort) {
			for (const group of Object.values(groups)) {
				group.sort((a, b) => a.source.localeCompare(b.source));
			}
		}

		// Generate import statements
		const importStatements = [];
		
		for (const type of this.rules.order) {
			if (!groups[type]) continue;
			
			if (importStatements.length > 0 && this.rules.groupSpacing) {
				importStatements.push(''); // Empty line between groups
			}

			for (const imp of groups[type]) {
				const statement = this.generateImportStatement(imp);
				importStatements.push(statement);
			}
		}

		return importStatements.join('\n');
	}

	/**
	 * Generate import statement from analysis
	 * @param {Object} analysis - Import analysis
	 * @returns {string} Import statement
	 */
	generateImportStatement(analysis) {
		if (analysis.isDynamic) {
			return `const ${analysis.specifiers[0]?.local || 'module'} = await import('${analysis.source}')`;
		}

		const specifiers = analysis.specifiers;
		let specifierStr = '';

		// Group by type
		const defaultSpec = specifiers.find(s => s.type === 'default');
		const namespaceSpec = specifiers.find(s => s.type === 'namespace');
		const namedSpecs = specifiers.filter(s => s.type === 'named');

		if (defaultSpec) {
			specifierStr = defaultSpec.local;
			if (namedSpecs.length > 0) {
				specifierStr += ', ';
			}
		}

		if (namespaceSpec) {
			specifierStr = `* as ${namespaceSpec.local}`;
		}

		if (namedSpecs.length > 0) {
			const namedStr = namedSpecs.map(spec => {
				if (spec.imported === spec.local) {
					return spec.imported;
				}
				return `${spec.imported} as ${spec.local}`;
			}).join(', ');
			
			specifierStr += `{ ${namedStr} }`;
		}

		const statement = `import ${specifierStr} from '${analysis.source}';`;
		
		// Check line length and format if needed
		if (statement.length > this.rules.maxLineLength && namedSpecs.length > 1) {
			const formattedNamed = namedSpecs.map(spec => {
				if (spec.imported === spec.local) {
					return `  ${spec.imported}`;
				}
				return `  ${spec.imported} as ${spec.local}`;
			}).join(',\n');
			
			if (defaultSpec) {
				return `import ${defaultSpec.local}, {\n${formattedNamed}\n} from '${analysis.source}';`;
			}
			return `import {\n${formattedNamed}\n} from '${analysis.source}';`;
		}

		return statement;
	}
}

/**
 * Module export patterns
 */
export const EXPORT_PATTERNS = {
	// Named exports
	named: {
		syntax: 'export { name }',
		reexport: 'export { name } from "./module"',
		renamed: 'export { name as alias }'
	},
	
	// Default exports
	default: {
		syntax: 'export default value',
		expression: 'export default expression'
	},
	
	// Declaration exports
	declaration: {
		function: 'export function name() {}',
		class: 'export class Name {}',
		const: 'export const name = value'
	},
	
	// Namespace exports
	namespace: {
		all: 'export * from "./module"',
		allAsNamespace: 'export * as namespace from "./module"'
	}
};

/**
 * Create module pattern context
 * @param {Object} options - Options
 * @returns {Object} Module pattern utilities
 */
export function createModulePatternContext(options = {}) {
	const logger = options.logger || null;
	const analyzer = new ModuleAnalyzer({ logger, rules: options.rules });

	return {
		analyzer,
		
		// Analysis functions
		analyzeImport: (statement) => analyzer.analyzeImport(statement),
		analyzeFile: (content) => analyzer.analyzeFile(content),
		
		// Organization functions
		organizeImports: (imports) => analyzer.generateOrganizedImports(imports),
		
		// Pattern references
		patterns: {
			imports: IMPORT_RULES,
			exports: EXPORT_PATTERNS
		},
		
		// Utilities
		utils: {
			isESModule: (content) => {
				return content.includes('import ') || 
					   content.includes('export ') ||
					   content.includes('import.meta');
			},
			
			hasDefaultExport: (content) => {
				return content.includes('export default') ||
					   content.includes('module.exports =');
			},
			
			convertCommonJSToES: (statement) => {
				// Simple conversion examples
				if (statement.includes('require(')) {
					return statement
						.replace(/const (\w+) = require\(['"`](.+?)['"`]\)/, 'import $1 from "$2"')
						.replace(/const \{(.+?)\} = require\(['"`](.+?)['"`]\)/, 'import { $1 } from "$2"');
				}
				if (statement.includes('module.exports')) {
					return statement
						.replace(/module\.exports = (\w+)/, 'export default $1')
						.replace(/module\.exports = \{(.+?)\}/, 'export { $1 }')
						.replace(/exports\.(\w+) = (.+)/, 'export const $1 = $2');
				}
				return statement;
			}
		}
	};
}
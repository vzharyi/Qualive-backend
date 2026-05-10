import { Injectable, Logger } from '@nestjs/common';
import { ESLint } from 'eslint';
import { DefectSeverity } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sonarjs = require('eslint-plugin-sonarjs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const _unicorn = require('eslint-plugin-unicorn');
// eslint-plugin-unicorn v63 — чистый ESM, require() отдаёт { default: plugin }
const unicorn = _unicorn.default ?? _unicorn;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const security = require('eslint-plugin-security');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pluginPromise = require('eslint-plugin-promise');


export interface DefectInfo {
    filename: string;
    line: number;
    column: number;
    severity: DefectSeverity;
    ruleId: string;
    message: string;
}

@Injectable()
export class EslintService {
    private readonly logger = new Logger(EslintService.name);
    private eslint: ESLint;

    constructor() {
        this.eslint = new ESLint({
            overrideConfigFile: true, // ESLint v9 — игнорируем локальный eslint.config.js
            overrideConfig: [
                {
                    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
                    languageOptions: {
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
                        parser: require('@typescript-eslint/parser'),
                        parserOptions: {
                            ecmaVersion: 'latest',
                            sourceType: 'module',
                        },
                    },
                    plugins: {
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
                        '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
                        sonarjs,
                        unicorn,
                        security,
                        promise: pluginPromise,
                    },
                    rules: {
                        // ── Базовые JS/TS правила ─────────────────────────
                        'no-unused-vars': 'off',
                        '@typescript-eslint/no-unused-vars': 'warn',
                        'no-console': 'warn',
                        'no-debugger': 'error',
                        'eqeqeq': 'warn',
                        'curly': 'warn',
                        'prefer-const': 'warn',
                        'no-var': 'error',
                        // async-функции без await — бесполезный overhead
                        'require-await': 'warn', // стандартное правило работает без type-information
                        '@typescript-eslint/require-await': 'off',
                        '@typescript-eslint/no-floating-promises': 'off',
                        '@typescript-eslint/no-misused-promises': 'off',
                        // ── SonarJS: когнитивная сложность и дубликаты ───
                        'sonarjs/cognitive-complexity': ['error', 15],
                        'sonarjs/no-duplicate-string': ['warn', { threshold: 3 }],
                        'sonarjs/no-identical-functions': 'warn',
                        'sonarjs/no-collapsible-if': 'warn',
                        'sonarjs/no-redundant-boolean': 'warn',
                        'sonarjs/prefer-immediate-return': 'warn',

                        // ── Unicorn: современный и лаконичный код ────────
                        'unicorn/prefer-module': 'warn',
                        'unicorn/prefer-ternary': 'warn',
                        'unicorn/no-array-for-each': 'warn',
                        'unicorn/no-for-loop': 'warn',
                        'unicorn/prefer-array-find': 'warn',
                        'unicorn/prefer-includes': 'warn',
                        'unicorn/prefer-string-slice': 'warn',
                        'unicorn/throw-new-error': 'error',
                        'unicorn/no-useless-undefined': 'warn',
                        // Отключаем правила с высоким шумом / паранойей
                        'unicorn/prevent-abbreviations': 'off',
                        'unicorn/no-null': 'off',
                        'unicorn/prefer-top-level-await': 'off',
                        'unicorn/no-process-exit': 'off',
                        'unicorn/filename-case': 'off',

                        // ── Security: уязвимости Node.js ─────────────────
                        'security/detect-object-injection': 'warn',
                        'security/detect-non-literal-regexp': 'warn',
                        'security/detect-unsafe-regex': 'error',
                        'security/detect-eval-with-expression': 'error',
                        'security/detect-non-literal-fs-filename': 'warn',
                        'security/detect-possible-timing-attacks': 'warn',

                        // ── Promise: ошибки в асинхронном коде ───────────
                        'promise/always-return': 'warn',
                        'promise/no-return-wrap': 'warn',
                        'promise/param-names': 'warn',
                        'promise/catch-or-return': 'warn',
                        'promise/no-nesting': 'warn',
                        'promise/no-promise-in-callback': 'warn',
                        'promise/avoid-new': 'off',
                    },
                },
            ] as any,
        });

        this.logger.log(
            'ESLint service initialized: @typescript-eslint + sonarjs + unicorn + security + promise',
        );
    }

    /** Analyze code in memory without file system */
    async analyzeCode(filename: string, code: string): Promise<DefectInfo[]> {
        try {
            const results = await this.eslint.lintText(code, {
                filePath: filename,
            });

            const defects: DefectInfo[] = [];

            for (const result of results) {
                for (const message of result.messages) {
                    defects.push({
                        filename: result.filePath || filename,
                        line: message.line || 0,
                        column: message.column || 0,
                        severity: this.mapSeverity(message.severity),
                        ruleId: message.ruleId || 'unknown',
                        message: message.message,
                    });
                }
            }

            this.logger.log(
                `Analyzed ${filename}: found ${defects.length} defects`,
            );

            return defects;
        } catch (error) {
            this.logger.error(
                `ESLint analysis failed for ${filename}: ${error.message}`,
            );
            return [
                {
                    filename,
                    line: 1,
                    column: 1,
                    severity: DefectSeverity.ERROR,
                    ruleId: 'system/analyzer-crash',
                    message: `Не удалось проанализировать код. Ошибка парсера: ${error.message}`,
                },
            ];
        }
    }

    /** Map ESLint severity to our DefectSeverity model */
    private mapSeverity(severity: number): DefectSeverity {
        if (severity === 2) {
            return DefectSeverity.ERROR;
        }
        return DefectSeverity.WARNING;
    }
}

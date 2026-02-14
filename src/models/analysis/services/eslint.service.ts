import { Injectable, Logger } from '@nestjs/common';
import { ESLint } from 'eslint';
import { DefectSeverity } from '@prisma/client';

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
            // overrideConfigFile: true as any, // Removed to fix TS error
            // useEslintrc: false, // Removed invalid property
            overrideConfig: {
                languageOptions: {
                    parser: require('@typescript-eslint/parser'),
                    parserOptions: {
                        ecmaVersion: 2021,
                        sourceType: 'module',
                        project: false, // Explicitly disable project
                        projectService: false, // Explicitly disable project service
                        tsconfigRootDir: undefined, // Ensure no root dir is set
                    },
                },
                plugins: {
                    '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
                },
                rules: {
                    'no-unused-vars': 'off',
                    '@typescript-eslint/no-unused-vars': 'warn', // Downgraded to warn to avoid noise
                    'no-console': 'warn',
                    'no-debugger': 'error',
                },
            } as any,
        });

        this.logger.log('ESLint service initialized');
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
            return [];
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

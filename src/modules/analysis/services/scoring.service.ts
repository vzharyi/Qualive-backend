import { Injectable, Logger } from '@nestjs/common';
import { DefectSeverity, ReportDecision } from '@prisma/client';
import { DefectInfo } from './eslint.service';

@Injectable()
export class ScoringService {
    private readonly logger = new Logger(ScoringService.name);
    private readonly K = 10;

    /** Weight function w(type) - returns penalty points based on severity */
    private getWeight(severity: DefectSeverity): number {
        const weights = {
            [DefectSeverity.ERROR]: 10,
            [DefectSeverity.WARNING]: 5,
        };
        return weights[severity] || 0;
    }

    /**
     * Calculate Quality Score using formula:
     * Q(t) = max(0, 100 - (K / S_code) * Σw(type(d_j)))
     */
    calculateQualityScore(
        defects: DefectInfo[],
        linesOfCode: number,
    ): number {
        if (linesOfCode === 0 || linesOfCode < 1) {
            this.logger.warn('Lines of code is 0 or invalid, using default 100');
            linesOfCode = 100;
        }

        const M = defects.length;

        if (M === 0) {
            this.logger.log('No defects found, quality score = 100');
            return 100;
        }

        const sumWeights = defects.reduce((sum, defect) => {
            const weight = this.getWeight(defect.severity);
            return sum + weight;
        }, 0);

        this.logger.log(
            `Calculating score: M=${M}, sumWeights=${sumWeights}, LOC=${linesOfCode}, K=${this.K}`,
        );

        const penalty = (this.K / linesOfCode) * sumWeights;
        const score = Math.max(0, 100 - penalty);
        const roundedScore = Math.round(score * 100) / 100;

        this.logger.log(`Quality Score: ${roundedScore} (penalty: ${penalty})`);

        return roundedScore;
    }

    /** Determine decision status based on quality score */
    getDecision(score: number): ReportDecision {
        if (score >= 80) {
            return ReportDecision.APPROVED;
        }
        if (score >= 60) {
            return ReportDecision.PENDING;
        }
        return ReportDecision.REJECTED;
    }

    /** Calculate penalty points for individual defect */
    calculatePenaltyPoints(severity: DefectSeverity): number {
        return this.getWeight(severity);
    }
}

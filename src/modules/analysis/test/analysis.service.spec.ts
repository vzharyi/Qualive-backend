import { AnalysisService } from '../analysis.service';

jest.mock('../services/github.service', () => ({ GithubService: jest.fn() }));
jest.mock('../analysis.repository', () => ({ AnalysisRepository: jest.fn() }));
jest.mock('../../tasks/tasks.service', () => ({ TasksService: jest.fn() }));
jest.mock('../../repositories/repositories.service', () => ({ RepositoriesService: jest.fn() }));
jest.mock('../../github/github.service', () => ({ GithubAppService: jest.fn() }));

jest.mock('../services/eslint.service', () => ({
  EslintService: jest.fn().mockImplementation(() => ({
    analyzeCode: jest.fn(),
  })),
}));

jest.mock('../services/scoring.service', () => ({
  ScoringService: jest.fn().mockImplementation(() => ({
    calculateQualityScore: jest.fn(),
    getDecision: jest.fn(),
  })),
}));

describe('AnalysisService', () => {
  let analysisService: AnalysisService;
  let mockEslintService: any;
  let mockScoringService: any;

  beforeEach(() => {
    const { EslintService } = require('../services/eslint.service');
    const { ScoringService } = require('../services/scoring.service');

    mockEslintService = new EslintService();
    mockScoringService = new ScoringService();

    analysisService = new AnalysisService(
      null as any,
      mockEslintService,
      mockScoringService,
      null as any,
      null as any,
      null as any,
      null as any
    );
  });

  it('should correctly parse raw code, find ESLint violations and deduct points', async () => {
    const rawCodeSnippet = `
      const unusedVariable = 42; 
      eval('console.log("Security Risk")');
    `;

    mockEslintService.analyzeCode.mockResolvedValue([
      { ruleId: 'no-unused-vars', severity: 'WARNING', message: 'unused', line: 2, column: 7, filename: 'virtual-file.ts' },
      { ruleId: 'no-eval', severity: 'ERROR', message: 'eval', line: 3, column: 7, filename: 'virtual-file.ts' }
    ]);

    mockScoringService.calculateQualityScore.mockReturnValue(87.5);
    mockScoringService.getDecision.mockReturnValue('APPROVED');

    const analysisResult = await analysisService.analyzeRawCode(rawCodeSnippet);

    expect(analysisResult.defects.length).toBe(2);

    const defectRules = analysisResult.defects.map(d => d.ruleId);
    expect(defectRules).toContain('no-unused-vars');
    expect(defectRules).toContain('no-eval');

    expect(analysisResult.qualityScore).toBe(88);
  });
});

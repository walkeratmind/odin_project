export interface AiAnalysis {
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  recommendedAction: string;
}

export interface AiProvider {
  analyse(input: {
    title: string;
    description: string;
  }): Promise<AiAnalysis>;
}

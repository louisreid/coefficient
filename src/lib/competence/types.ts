export type ScenarioTemplate = {
  id: string;
  prompt: string;
  choices: [string, string, string, string];
  correctIndex: number;
  rationale: string;
  tags: string[];
  criticalFail: boolean;
};

export type Scenario = {
  idHash: string;
  templateId: string;
  prompt: string;
  choices: [string, string, string, string];
  correctIndex: number;
  correctAnswer: string;
  rationale: string;
  tags: string[];
  criticalFail: boolean;
  skillTag: string;
  difficulty: number;
};

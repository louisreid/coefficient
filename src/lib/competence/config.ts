import type { ScenarioTemplate } from "./types";

export const ROV_PRE_DIVE_GO_NO_GO = "ROV_PRE_DIVE_GO_NO_GO" as const;
export const COMPETENCE_UNITS = [ROV_PRE_DIVE_GO_NO_GO] as const;
export type CompetenceUnitId = (typeof COMPETENCE_UNITS)[number];

export const UNIT_LABELS: Record<CompetenceUnitId, string> = {
  [ROV_PRE_DIVE_GO_NO_GO]: "ROV: Pre-Dive / Pre-Launch Go/No-Go & Safety Checks",
};

/** Scoring thresholds (used by scoring.ts) */
export const SCORING = {
  FAIL_ACCURACY_PCT: 60,
  PASS_ACCURACY_PCT: 75,
  /** Trainee is at risk if wrong count >= this in last 7 days */
  AT_RISK_WRONG_THRESHOLD: 5,
} as const;

/** Scenario templates for ROV Pre-Dive Go/No-Go. At least 20 for deterministic pick. */
export const ROV_PRE_DIVE_TEMPLATES: ScenarioTemplate[] = [
  {
    id: "rov-01",
    prompt:
      "Pre-dive checklist: tether continuity check shows an open circuit. What do you do next?",
    choices: [
      "Sign off and proceed to launch (tether check is optional).",
      "Stop, tag out, and report to supervisor; do not launch until cleared.",
      "Retest once; if it passes, proceed.",
      "Bypass and log for post-dive repair.",
    ],
    correctIndex: 1,
    rationale: "Tether continuity is safety-critical; open circuit means no-go until resolved.",
    tags: ["UNSAFE_GO", "SKIPPED_CHECK"],
    criticalFail: true,
  },
  {
    id: "rov-02",
    prompt:
      "Pre-launch: one thruster fails the spin-up test. No spare on deck. What do you do?",
    choices: [
      "Launch with reduced thrust; pilot can compensate.",
      "No-go: document, report, and do not launch until thruster is replaced or cleared.",
      "Retest the thruster; if it spins once, proceed.",
      "Launch and test thrusters in water.",
    ],
    correctIndex: 1,
    rationale: "Launching with known thruster failure risks loss of vehicle control.",
    tags: ["UNSAFE_GO", "NO_ESCALATION"],
    criticalFail: true,
  },
  {
    id: "rov-03",
    prompt:
      "Before launch, the pilot requests to skip the camera white-balance check to save time. Your role is deck crew. What do you do?",
    choices: [
      "Allow it; white balance can be done in water.",
      "Refuse and complete the check; it is on the pre-launch checklist.",
      "Defer to the pilot's judgment.",
      "Do a quick manual check only.",
    ],
    correctIndex: 1,
    rationale: "Checklist items are not optional; skipping undermines go/no-go discipline.",
    tags: ["SKIPPED_CHECK", "WRONG_SEQUENCE"],
    criticalFail: false,
  },
  {
    id: "rov-04",
    prompt:
      "Pre-dive briefing is complete. Someone notices the umbilical has a small abrasion. What is the correct next step?",
    choices: [
      "Launch; monitor the abrasion during the dive.",
      "No-go: tag the umbilical, report, and do not launch until assessed by responsible person.",
      "Wrap the spot with tape and proceed.",
      "Only launch if the dive is short.",
    ],
    correctIndex: 1,
    rationale: "Umbilical damage can lead to loss of comms or power; must be formally assessed.",
    tags: ["UNSAFE_GO", "NO_ESCALATION"],
    criticalFail: true,
  },
  {
    id: "rov-05",
    prompt:
      "In what order should you perform: (1) tether connection, (2) power-on, (3) thruster spin-up?",
    choices: [
      "Power-on, then tether, then thruster spin-up.",
      "Tether, then power-on, then thruster spin-up.",
      "Thruster spin-up first to warm up, then tether and power.",
      "Order does not matter as long as all are done.",
    ],
    correctIndex: 1,
    rationale: "Correct sequence: tether secured first, then power, then thruster checks.",
    tags: ["WRONG_SEQUENCE"],
    criticalFail: false,
  },
  {
    id: "rov-06",
    prompt:
      "Pre-launch checklist says 'Confirm LARS (Launch and Recovery System) ready.' You have not checked the LARS. What do you do?",
    choices: [
      "Sign off; LARS is the crane operator's responsibility.",
      "Do not sign off; perform the LARS check before signing.",
      "Sign off and check LARS while the ROV is descending.",
      "Skip this item if time is short.",
    ],
    correctIndex: 1,
    rationale: "Every checklist item must be verified before sign-off; no exceptions.",
    tags: ["SKIPPED_CHECK", "WRONG_SEQUENCE"],
    criticalFail: false,
  },
  {
    id: "rov-07",
    prompt:
      "Weather is worsening. The dive plan allows launch up to Sea State 4. Current sea state is 4 with rising trend. What do you do?",
    choices: [
      "Launch now; we are still within limit.",
      "No-go or escalate: do not launch if conditions are trending worse than plan.",
      "Launch but shorten the dive.",
      "Launch only if the client approves.",
    ],
    correctIndex: 1,
    rationale: "Launching when conditions are degrading risks recovery and personnel.",
    tags: ["UNSAFE_GO", "NO_ESCALATION"],
    criticalFail: true,
  },
  {
    id: "rov-08",
    prompt:
      "Pilot reports the pan-and-tilt unit is stiff but moving. Pre-dive checklist does not list a stiffness check. What do you do?",
    choices: [
      "Proceed; it is not on the checklist.",
      "Stop and report; unlisted defects should be assessed before launch.",
      "Note it and proceed; assess in water.",
      "Only delay if the client complains.",
    ],
    correctIndex: 1,
    rationale: "Any anomaly should be raised and assessed; checklist is minimum, not exhaustive.",
    tags: ["SKIPPED_CHECK", "NO_ESCALATION"],
    criticalFail: false,
  },
  {
    id: "rov-09",
    prompt:
      "Before first launch of the day, should you verify the emergency disconnect and recovery procedure?",
    choices: [
      "No; that was done at system commissioning.",
      "Yes; verify or rehearse as per company/SMS requirements before launch.",
      "Only if the pilot asks.",
      "Only on the first dive of the campaign.",
    ],
    correctIndex: 1,
    rationale: "Emergency procedures should be confirmed at the start of operations.",
    tags: ["SKIPPED_CHECK", "WRONG_SEQUENCE"],
    criticalFail: false,
  },
  {
    id: "rov-10",
    prompt:
      "During pre-dive checks, you see a 'low voltage' warning on the surface power unit. What do you do?",
    choices: [
      "Ignore if it clears after a few seconds.",
      "No-go: investigate and resolve before launch.",
      "Proceed but log it for post-dive.",
      "Only stop if the ROV does not power up.",
    ],
    correctIndex: 1,
    rationale: "Low voltage can cause brownouts or loss of control; must be resolved before launch.",
    tags: ["UNSAFE_GO", "SKIPPED_CHECK"],
    criticalFail: true,
  },
  {
    id: "rov-11",
    prompt:
      "The client asks to launch in 10 minutes to meet a window. You have not finished the pre-dive checklist. What do you do?",
    choices: [
      "Skip non-critical items and launch.",
      "Complete the full checklist; do not launch until it is done and signed.",
      "Launch and complete the rest in water.",
      "Ask the client which items to skip.",
    ],
    correctIndex: 1,
    rationale: "Pressure to meet a window does not justify skipping checklist items.",
    tags: ["SKIPPED_CHECK", "WRONG_SEQUENCE"],
    criticalFail: false,
  },
  {
    id: "rov-12",
    prompt:
      "Pre-launch: the tether is connected and continuity is OK, but the tether guard is not yet fitted. What do you do?",
    choices: [
      "Launch; fit the guard at first opportunity.",
      "Do not launch until the tether guard is correctly fitted.",
      "Launch only in calm conditions.",
      "Fit a temporary guard and proceed.",
    ],
    correctIndex: 1,
    rationale: "Tether protection must be in place before launch to avoid damage.",
    tags: ["WRONG_SEQUENCE", "UNSAFE_GO"],
    criticalFail: false,
  },
  {
    id: "rov-13",
    prompt:
      "Who has authority to give the final 'go' for launch: pilot, deck lead, or vessel OIM/supervisor?",
    choices: [
      "Pilot only.",
      "As defined by the project/VMS; typically a designated person (e.g. deck lead or OIM) after checklist sign-off.",
      "Whoever is in a hurry.",
      "The client representative.",
    ],
    correctIndex: 1,
    rationale: "Final go must be by the authority defined in the management system.",
    tags: ["WRONG_SEQUENCE", "NO_ESCALATION"],
    criticalFail: false,
  },
  {
    id: "rov-14",
    prompt:
      "One of the two manipulator valves is leaking hydraulic fluid. Pre-dive checklist is otherwise complete. What do you do?",
    choices: [
      "Launch; one manipulator is enough for the task.",
      "No-go: do not launch with a hydraulic leak until it is fixed or formally risk-accepted.",
      "Launch and isolate the leaking valve.",
      "Only no-go if both manipulators are affected.",
    ],
    correctIndex: 1,
    rationale: "Hydraulic leaks are a hazard and can worsen; resolve before launch.",
    tags: ["UNSAFE_GO", "NO_ESCALATION"],
    criticalFail: true,
  },
  {
    id: "rov-15",
    prompt:
      "The checklist says 'Verify subsea positioning system (e.g. USBL) locked on.' You have not received a lock. What do you do?",
    choices: [
      "Proceed; positioning can be acquired in water.",
      "Do not launch until positioning is confirmed locked on and valid.",
      "Launch and acquire once the ROV is submerged.",
      "Only required for deep dives.",
    ],
    correctIndex: 1,
    rationale: "Launching without positioning can compromise navigation and recovery.",
    tags: ["SKIPPED_CHECK", "WRONG_SEQUENCE"],
    criticalFail: false,
  },
  {
    id: "rov-16",
    prompt:
      "Pre-dive: the pilot has not completed the control responsiveness check. What do you do?",
    choices: [
      "Assume it is OK; pilot knows the system.",
      "Do not sign off launch until the control check is done and satisfactory.",
      "Do it in water after launch.",
      "Only necessary for new pilots.",
    ],
    correctIndex: 1,
    rationale: "Control check is part of pre-launch; must be completed before go.",
    tags: ["SKIPPED_CHECK", "WRONG_SEQUENCE"],
    criticalFail: false,
  },
  {
    id: "rov-17",
    prompt:
      "You notice the ROV has not been through a full function test after yesterday's maintenance. What do you do?",
    choices: [
      "Launch; yesterday's work was signed off.",
      "Do not launch until a full function test is completed and signed off.",
      "Do a quick test only if time allows.",
      "Launch and test critical functions in water.",
    ],
    correctIndex: 1,
    rationale: "Post-maintenance, a full function test is required before operational use.",
    tags: ["SKIPPED_CHECK", "UNSAFE_GO"],
    criticalFail: true,
  },
  {
    id: "rov-18",
    prompt:
      "Before launch, should the deck crew confirm that the kill/crash recovery button is accessible and known to the pilot?",
    choices: [
      "No; that is the pilot's responsibility.",
      "Yes; confirm as part of pre-launch readiness.",
      "Only on the first dive of the day.",
      "Only if the pilot is trainee.",
    ],
    correctIndex: 1,
    rationale: "Emergency controls must be verified and understood before launch.",
    tags: ["SKIPPED_CHECK", "WRONG_SEQUENCE"],
    criticalFail: false,
  },
  {
    id: "rov-19",
    prompt:
      "Pre-launch briefing is done. A new team member has not been briefed on their role. What do you do?",
    choices: [
      "Proceed; they can follow the lead.",
      "Do not launch until the new member is briefed and understands their role.",
      "Brief them during the dive.",
      "Only brief if they are on the ROV team.",
    ],
    correctIndex: 1,
    rationale: "All involved personnel must be briefed before launch.",
    tags: ["WRONG_SEQUENCE", "NO_ESCALATION"],
    criticalFail: false,
  },
  {
    id: "rov-20",
    prompt:
      "The pre-dive checklist has a sign-off for 'Vehicle weight in water verified.' How should this be done?",
    choices: [
      "Assume neutral from last dive.",
      "Verify by actual test (e.g. in water or calibrated lift) as required by procedure.",
      "Use the design weight.",
      "Only verify if ballast was changed.",
    ],
    correctIndex: 1,
    rationale: "Weight in water must be verified per procedure, not assumed.",
    tags: ["SKIPPED_CHECK", "WRONG_SEQUENCE"],
    criticalFail: false,
  },
  {
    id: "rov-21",
    prompt:
      "Surface gas detection alarm has triggered in the hangar. Pre-dive checks are otherwise complete. What do you do?",
    choices: [
      "Ventilate and recheck; if clear, proceed to launch.",
      "No-go: do not launch until the alarm is explained, area is safe, and authority has cleared operations.",
      "Launch from a different area.",
      "Only no-go if the alarm is still sounding.",
    ],
    correctIndex: 1,
    rationale: "Gas alarm indicates a potential hazard; must be resolved before continuing.",
    tags: ["UNSAFE_GO", "NO_ESCALATION"],
    criticalFail: true,
  },
  {
    id: "rov-22",
    prompt:
      "The checklist requires two signatures: deck lead and pilot. The pilot has signed but the deck lead is busy. What do you do?",
    choices: [
      "Launch; one signature is enough.",
      "Do not launch until all required sign-offs are obtained.",
      "Get a verbal OK from the deck lead and launch.",
      "The pilot's signature is the only one that matters.",
    ],
    correctIndex: 1,
    rationale: "All required sign-offs must be in place before go.",
    tags: ["WRONG_SEQUENCE", "SKIPPED_CHECK"],
    criticalFail: false,
  },
];

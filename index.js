const express = require("express");
const app = express();

app.use(express.json());

// ======================
// [설정] 사후 조사 링크 (실제 링크로 변경해주세요)
// ======================
const POST_SURVEY_URL = "https://forms.gle/xurnS3cxRtRbQbnh7";

// ======================
// 1) PHQ-9 문항
// ======================
const PHQ9_QUESTIONS = [
  "1. 기분이 가라앉거나, 우울하거나, 희망이 없다고 느꼈다.",
  "2. 평소 하던 일에 대한 흥미가 없어지거나 즐거움을 느끼지 못했다.",
  "3. 잠들기가 어렵거나 자꾸 깼다/혹은 너무 많이 잤다.",
  "4. 평소보다 식욕이 줄었다/혹은 평소보다 많이 먹었다.",
  "5. 다른 사람들이 눈치 챌 정도로 평소보다 말과 행동이 느려졌다 / 혹은 너무 안절부절 못해서 가만히 앉아있을 수 없었다.",
  "6. 피곤하고 기운이 없었다.",
  "7. 내가 잘 못했거나, 실패했다는 생각이 들었다 / 혹은 자신과 가족을 실망시켰다고 생각했다.",
  "8. 신문을 읽거나 TV를 보는 것과 같은 일상적인 일에도 집중할 수가 없었다.",
  "9. 차라리 죽는 것이 더 낫겠다고 생각했다 / 혹은 자해할 생각을 했다."
];

const PHQ9_CHOICES = [
  { label: "전혀 아니다 (0점)", score: 0 },
  { label: "3-4일 정도 (1점)", score: 1 }, // 피드백 반영: 텍스트 수정
  { label: "일주일 이상 (2점)", score: 2 },
  { label: "거의 매일 (3점)", score: 3 }
];

// ======================
// 2) GAD-7 문항
// ======================
const GAD7_QUESTIONS = [
  "1. 초조하거나 불안하거나 조마조마하게 느낀다.",
  "2. 걱정하는 것을 멈추거나 조절할 수가 없다.",
  "3. 여러 가지 것들에 대해 걱정을 너무 많이 한다.",
  "4. 편하게 있기가 어렵다.",
  "5. 너무 안절부절 못해서 가만히 있기가 힘들다.",
  "6. 쉽게 짜증이 나거나 쉽게 성을 내게 된다.",
  "7. 마치 끔찍한 일이 생길 것처럼 두렵게 느껴진다."
];

const GAD7_CHOICES = [
  { label: "전혀 방해 받지 않았다. (0점)", score: 0 },
  { label: "며칠 동안 방해 받았다. (1점)", score: 1 },
  { label: "2주 중 절반이상 방해 받았다. (2점)", score: 2 },
  { label: "거의 매일 방해 받았다. (3점)", score: 3 }
];

// ======================
// 3) CES-D (한국판) 문항 (20문항)
// ======================
const CESD_QUESTIONS = [
  "01. 평소에는 아무렇지도 않던 일이 괴롭고 귀찮게 느껴졌다.",
  "02. 먹고 싶지 않았고 식욕이 없었다.",
  "03. 어느 누가 도와준다 하더라도, 나의 울적한 기분을 떨쳐버릴 수 없을 것 같았다.",
  "04. 무슨 일을 하던 정신을 집중하기가 어려웠다.",
  "05. 평소처럼 잘 지내기 어려웠다.", // 피드백 반영: 질문 반대로 변경
  "06. 상당히 우울했다.",
  "07. 모든 일들이 힘들게 느껴졌다.",
  "08. 앞일이 암담하게 느껴졌다.",
  "09. 지금까지의 내 인생은 실패작이라는 생각이 들었다.",
  "10. 다른 사람들에 비해 내 능력이 부족하다고 느꼈다.", // 피드백 반영: 질문 반대로 변경
  "11. 잠을 설쳤다(잠을 잘 이루지 못했다).",
  "12. 두려움을 느꼈다.",
  "13. 평소에 비해 말수가 적었다.",
  "14. 세상에 홀로 있는 듯한 외로움을 느꼈다.",
  "15. 내 생활에 불만이 많았다.", // 피드백 반영: 질문 반대로 변경
  "16. 사람들이 나에게 차갑게 대하는 것 같았다.",
  "17. 갑자기 울음이 나왔다.",
  "18. 마음이 슬펐다.",
  "19. 사람들이 나를 싫어하는 것 같았다.",
  "20. 도무지 뭘 해 나갈 엄두가 나지 않았다."
];

const CESD_CHOICES = [
  { label: "극히 드물게 (1일 이하) (0점)", score: 0 },
  { label: "가끔 (1-2일) (1점)", score: 1 },
  { label: "자주 (3-4일) (2점)", score: 2 },
  { label: "거의 대부분 (5-7일) (3점)", score: 3 }
];
// (피드백 반영) CESD_REVERSE_ITEMS 세트 및 역채점 로직은 제거되었습니다.

// ======================
// 4) CBI 기반 번아웃 문항
// ======================
const CBI_QUESTIONS = [
  "1. 나는 요즘 전반적으로 매우 지쳐 있다고 느낀다.",
  "2. 하루를 보내고 나면 기력이 거의 남아 있지 않다.",
  "3. 아침에 일어나 하루를 시작하는 것이 버겁게 느껴진다.",
  "4. 충분히 쉬어도 피로가 쉽게 회복되지 않는다.",
  "5. 신체적·정신적으로 탈진된 느낌이 자주 든다.",
  "6. 나의 일(학업/실습 포함) 때문에 지쳐 있다고 느낀다.",
  "7. 업무를 수행하는 동안 에너지가 빠르게 소진된다.",
  "8. 일을 생각하면 피로감이 먼저 떠오른다.",
  "9. 업무가 끝난 후에도 긴장이 쉽게 풀리지 않는다.",
  "10. 현재의 업무 강도가 나에게 과도하다고 느껴진다.",
  "11. 사람들을 상대하는 일이 예전보다 훨씬 힘들게 느껴진다.",
  "12. 타인의 요구나 감정에 지치거나 부담을 느낀다.",
  "13. 사람들과의 상호작용 후 정서적으로 소모된 느낌이 든다.",
  "14. 사람을 상대하는 상황을 가능하면 피하고 싶다."
];

const CBI_CHOICES = [
  { label: "전혀 그렇지 않다 (0점)", score: 0 },
  { label: "가끔 그렇다 (1점)", score: 1 },
  { label: "자주 그렇다 (2점)", score: 2 },
  { label: "대부분 그렇다 (3점)", score: 3 },
  { label: "거의 항상 그렇다 (4점)", score: 4 }
];

// ======================
// 5) 다중 사용자 세션 저장소 (메모리 기반)
// ======================
const sessions = Object.create(null);

function getUserId(body) {
  return (
    body?.userRequest?.user?.id ||
    body?.userRequest?.user?.properties?.plusfriendUserKey ||
    body?.userRequest?.user?.properties?.appUserId ||
    body?.userRequest?.user?.properties?.botUserKey ||
    "anonymous"
  );
}

function getOrCreateUserState(userId) {
  if (!sessions[userId]) {
    sessions[userId] = {
      phq9: { qIndex: 0, answers: [] },
      gad7: { qIndex: 0, answers: [] },
      cesd: { qIndex: 0, answers: [] },
      cbi: { qIndex: 0, answers: [] },
      updatedAt: Date.now()
    };
  }
  return sessions[userId];
}

function resetSurvey(userId, surveyKey) {
  const state = getOrCreateUserState(userId);
  state[surveyKey] = { qIndex: 0, answers: [] };
  state.updatedAt = Date.now();
  return state[surveyKey];
}

// ======================
// 6) 응답 빌더
// ======================

// 피드백 반영: 검사에 대한 간략한 설명(description)을 첫 문항에 띄웁니다.
function buildQuestionResponse({ title, description, qIndex, totalCount, questionText, choices, answerPrefix }) {
  let text = `${title} (${qIndex + 1}/${totalCount})\n`;
  if (qIndex === 0 && description) {
    text += `${description}\n\n`;
  }
  text += `${questionText}`;

  return {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: { text }
        }
      ],
      quickReplies: [
        ...choices.map((c) => ({
          label: c.label,
          action: "message",
          messageText: `${answerPrefix}${c.score}`
        })),
        { label: "중단(처음으로)", action: "message", messageText: "HOME" }
      ]
    }
  };
}

function buildPHQ9ResultResponse(total, q9Score) {
  let levelText = "";
  let adviceText = "";
  let isLowRisk = false;

  // 피드백 반영: 점수별 맞춤 멘트 적용
  if (total <= 4) {
    levelText = "최소 수준 (0–4점)";
    adviceText = "현재 우울 증상이 거의 없는 안정적인 상태입니다. 지금의 건강한 일상을 잘 유지해 주세요!";
    isLowRisk = true;
  } else if (total <= 9) {
    levelText = "가벼운 수준 (5–9점)";
    adviceText = "가벼운 우울감이 관찰됩니다. 일상에서 스트레스 관리에 조금 더 신경 써주시면 좋겠습니다.";
  } else if (total <= 14) {
    levelText = "중등도 수준 (10–14점)";
    adviceText = "중간 정도의 우울감이 있습니다. 충분한 휴식을 취하고, 필요하다면 전문상담 버튼을 눌러 상담을 진행해 보세요.";
  } else if (total <= 19) {
    levelText = "중등고도 수준 (15–19점)";
    adviceText = "다소 높은 수준의 우울감이 있습니다. 전문 상담 버튼을 눌러 상담을 진행해보실 것을 권고드립니다.";
  } else {
    levelText = "고도 수준 (20–27점)";
    adviceText = "심각한 수준의 우울감이 의심됩니다. 지체하지 마시고 반드시 아래 전문 상담 버튼을 눌러 상담을 받으시거나, 정신건강의학과의 도움을 받으시길 바랍니다.";
  }

  let safetyText = "";
  if (q9Score >= 1) {
    safetyText =
      "\n\n[🚨 안전 안내]\n자해/자살 관련 생각이 조금이라도 있었다면 혼자 두지 마세요.\n" +
      "지금 즉시 도움: 자살예방상담전화 1393, 정신건강위기상담 1577-0199";
  }

  let postSurveyText = isLowRisk 
    ? `\n\n[참여 부탁] 결과가 안정적이시네요! 아래 링크에서 짧은 사후 조사에 참여해 주시면 큰 도움이 됩니다.\n👉 ${POST_SURVEY_URL}` 
    : "";

  return {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: {
            text: `[PHQ-9 검사 결과]\n총점: ${total}점\n상태: ${levelText}\n\n${adviceText}${safetyText}${postSurveyText}`
          }
        }
      ],
      quickReplies: [
        { label: "상담 안내", action: "message", messageText: "HELP_LINK" },
        { label: "처음으로", action: "message", messageText: "HOME" }
      ]
    }
  };
}

function buildGAD7ResultResponse(total) {
  let levelText = "";
  let adviceText = "";
  let isLowRisk = false;

  if (total <= 4) {
    levelText = "최소 수준 (0–4점)";
    adviceText = "현재 불안 증상이 거의 없이 편안한 상태입니다. 앞으로도 긍정적인 마음가짐을 유지해 보세요.";
    isLowRisk = true;
  } else if (total <= 9) {
    levelText = "가벼운 수준 (5–9점)";
    adviceText = "일상적인 수준의 가벼운 불안감이 있습니다. 심호흡이나 명상 등 가벼운 이완 활동이 도움이 될 수 있습니다.";
  } else if (total <= 14) {
    levelText = "중등도 수준 (10–14점)";
    adviceText = "불안감으로 인해 일상생활에 다소 불편함이 있을 수 있습니다. 스스로 조절하기 어렵다면 전문가의 도움을 받아보세요.";
  } else {
    levelText = "중증 수준 (15–21점)";
    adviceText = "높은 수준의 불안감이 지속되고 있습니다. 마음의 안정을 위해 전문 상담 버튼을 눌러보시어 센터나 전문의를 찾아가 보시는 것을 권장합니다.";
  }

  let postSurveyText = isLowRisk 
    ? `\n\n[참여 부탁] 결과가 안정적이시네요! 아래 링크에서 짧은 사후 조사에 참여해 주시면 큰 도움이 됩니다.\n👉 ${POST_SURVEY_URL}` 
    : "";

  return {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: {
            text: `[GAD-7 검사 결과]\n총점: ${total}점\n상태: ${levelText}\n\n${adviceText}${postSurveyText}`
          }
        }
      ],
      quickReplies: [
        { label: "상담 안내", action: "message", messageText: "HELP_LINK" },
        { label: "처음으로", action: "message", messageText: "HOME" }
      ]
    }
  };
}

function buildCESDResultResponse(total) {
  let levelText = "";
  let adviceText = "";
  let isLowRisk = false;

  if (total < 16) {
    levelText = "정상 범위 (0–15점)";
    adviceText = "지난 1주일간 우울 증상이 거의 나타나지 않았습니다. 지금의 건강한 일상을 계속 이어가 주세요.";
    isLowRisk = true;
  } else if (total <= 20) {
    levelText = "경도 우울 (16-20점)";
    adviceText = "가벼운 우울감이 보입니다. 지친 마음을 달래줄 수 있는 취미 생활이나 휴식이 필요할 수 있습니다.";
  } else if (total <= 24) {
    levelText = "중등도 우울 (21-24점)";
    adviceText = "우울감이 다소 높은 편입니다. 일상에서 어려움이 지속된다면 주위에 고민을 나누거나 전문가의 도움을 고려해 보세요.";
  } else {
    levelText = "중증 우울 (25점 이상)";
    adviceText = "상당한 수준의 우울감이 확인됩니다. 마음의 고통을 혼자 견디지 마시고, 꼭 전문 상담 버튼을 누르시어 전문적인 상담과 진료를 받아보시길 바랍니다.";
  }

  let postSurveyText = isLowRisk 
    ? `\n\n[참여 부탁] 결과가 안정적이시네요! 아래 링크에서 짧은 사후 조사에 참여해 주시면 큰 도움이 됩니다.\n👉 ${POST_SURVEY_URL}` 
    : "";

  return {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: {
            text: `[CES-D 검사 결과]\n총점: ${total}점 (0–60)\n상태: ${levelText}\n\n${adviceText}${postSurveyText}`
          }
        }
      ],
      quickReplies: [
        { label: "상담 안내", action: "message", messageText: "HELP_LINK" },
        { label: "처음으로", action: "message", messageText: "HOME" }
      ]
    }
  };
}

function buildCBIResultResponse(total) {
  let levelText = "";
  let adviceText = "";
  let isLowRisk = false;

  if (total <= 18) {
    levelText = "번아웃 위험 낮음";
    adviceText = "학업이나 업무로 인한 탈진감이 낮은 상태입니다. 워라밸을 잘 유지하고 계신 것 같습니다!";
    isLowRisk = true;
  } else if (total <= 35) {
    levelText = "중등도 번아웃";
    adviceText = "어느 정도의 지침과 피로감이 누적되어 있습니다. 무리하지 마시고 잠시 쉬어가는 시간을 가지는 것이 좋습니다.";
  } else {
    levelText = "높은 번아웃 위험";
    adviceText = "심각한 수준의 번아웃이 의심됩니다. 신체적, 정신적 회복이 시급한 상태이니 일정을 조율하고 전문 상담 버튼을 누르시어 상담을 받아보세요.";
  }

  let postSurveyText = isLowRisk 
    ? `\n\n[참여 부탁] 결과가 안정적이시네요! 아래 링크에서 짧은 사후 조사에 참여해 주시면 큰 도움이 됩니다.\n👉 ${POST_SURVEY_URL}` 
    : "";

  return {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: {
            text: `[CBI 번아웃 결과]\n총점: ${total}점\n상태: ${levelText}\n\n${adviceText}${postSurveyText}`
          }
        }
      ],
      quickReplies: [
        { label: "상담 안내", action: "message", messageText: "HELP_LINK" },
        { label: "처음으로", action: "message", messageText: "HOME" }
      ]
    }
  };
}

function buildHelpResponse() {
  return {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: {
            text:
              "상담 및 전문가 도움 안내\n\n" +
              "📞 자살예방상담전화: 1393\n" +
              "📞 정신건강위기상담: 1577-0199\n" +
              "📞 보건복지상담센터: 129\n" +
              "📞 긴급신고: 112 / 119\n\n" +
              "도움이 필요하다면 언제든 위 번호로 연락해 주세요. 당신은 혼자가 아닙니다."
          }
        }
      ],
      quickReplies: [
        { label: "처음으로", action: "message", messageText: "HOME" }
      ]
    }
  };
}

// 피드백 반영: 초입 소개말 (목적, 방향, 가치) 추가
function buildHomeResponse() {
  return {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: {
            text: 
              "안녕하세요! 마음 건강을 점검해 볼 수 있는 챗봇입니다.\n\n" +
              "💡 [목적] 스스로의 심리 상태를 돌아보고, 필요시 적절한 도움을 받을 수 있도록 안내하기 위해 마련되었습니다.\n\n" +
              "📌 [진행 방향] 아래 버튼에서 원하시는 검사를 선택하시면 객관식 설문이 바로 진행됩니다.\n\n" +
              "🎁 [얻는 가치] 현재 나의 우울, 불안, 번아웃 정도를 객관적인 지표로 확인하고 맞춤형 피드백을 받아보실 수 있습니다.\n\n" +
              "원하시는 설문을 아래에서 선택해 주세요."
          }
        }
      ],
      quickReplies: [
        { label: "PHQ-9 (우울)", action: "message", messageText: "PHQ9_START" },
        { label: "GAD-7 (불안)", action: "message", messageText: "GAD7_START" },
        { label: "CES-D (일상우울)", action: "message", messageText: "CESD_START" },
        { label: "번아웃 (CBI)", action: "message", messageText: "CBI_START" },
        { label: "상담 안내", action: "message", messageText: "HELP_LINK" }
      ]
    }
  };
}

function buildFallbackResponse() {
  return {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: {
            text: "명령을 이해하지 못했습니다. 아래 버튼을 눌러 처음으로 돌아가 주세요."
          }
        }
      ],
      quickReplies: [
        { label: "처음으로", action: "message", messageText: "HOME" }
      ]
    }
  };
}

// ======================
// 7) 라우트 설정
// ======================
app.get("/health", (req, res) => res.status(200).send("ok"));

// --- PHQ-9 라우트 ---
app.post("/skill/phq9", (req, res) => {
  const utterance = req.body?.userRequest?.utterance || "";
  const userId = getUserId(req.body);
  const state = getOrCreateUserState(userId);
  state.updatedAt = Date.now();

  if (utterance === "PHQ9_START" || utterance === "PHQ-9" || utterance === "PHQ9") {
    const s = resetSurvey(userId, "phq9");
    return res.status(200).json(
      buildQuestionResponse({
        title: "PHQ-9",
        description: "💡 PHQ-9는 최근 2주간의 우울 증상을 점검하는 자가진단 검사입니다.",
        qIndex: s.qIndex,
        totalCount: PHQ9_QUESTIONS.length,
        questionText: PHQ9_QUESTIONS[s.qIndex],
        choices: PHQ9_CHOICES,
        answerPrefix: "PHQ9_A"
      })
    );
  }

  if (/^PHQ9_A[0-3]$/.test(utterance)) {
    const score = Number(utterance.replace("PHQ9_A", ""));
    const s = state.phq9;
    s.answers.push(score);
    s.qIndex += 1;
    state.updatedAt = Date.now();

    if (s.qIndex < PHQ9_QUESTIONS.length) {
      return res.status(200).json(
        buildQuestionResponse({
          title: "PHQ-9",
          qIndex: s.qIndex,
          totalCount: PHQ9_QUESTIONS.length,
          questionText: PHQ9_QUESTIONS[s.qIndex],
          choices: PHQ9_CHOICES,
          answerPrefix: "PHQ9_A"
        })
      );
    }
    const total = s.answers.reduce((a, b) => a + b, 0);
    const q9Score = s.answers[8] ?? 0;
    return res.status(200).json(buildPHQ9ResultResponse(total, q9Score));
  }

  if (utterance === "HELP_LINK") return res.status(200).json(buildHelpResponse());
  if (utterance === "HOME") return res.status(200).json(buildHomeResponse());
  return res.status(200).json(buildFallbackResponse());
});

// --- GAD-7 라우트 ---
app.post("/skill/gad7", (req, res) => {
  const utterance = req.body?.userRequest?.utterance || "";
  const userId = getUserId(req.body);
  const state = getOrCreateUserState(userId);
  state.updatedAt = Date.now();

  if (utterance === "GAD7_START" || utterance === "GAD-7" || utterance === "GAD7") {
    const s = resetSurvey(userId, "gad7");
    return res.status(200).json(
      buildQuestionResponse({
        title: "GAD-7",
        description: "💡 GAD-7은 최근 2주간의 불안 증상 정도를 점검하는 자가진단 검사입니다.",
        qIndex: s.qIndex,
        totalCount: GAD7_QUESTIONS.length,
        questionText: GAD7_QUESTIONS[s.qIndex],
        choices: GAD7_CHOICES,
        answerPrefix: "GAD7_A"
      })
    );
  }

  if (/^GAD7_A[0-3]$/.test(utterance)) {
    const score = Number(utterance.replace("GAD7_A", ""));
    const s = state.gad7;
    s.answers.push(score);
    s.qIndex += 1;
    state.updatedAt = Date.now();

    if (s.qIndex < GAD7_QUESTIONS.length) {
      return res.status(200).json(
        buildQuestionResponse({
          title: "GAD-7",
          qIndex: s.qIndex,
          totalCount: GAD7_QUESTIONS.length,
          questionText: GAD7_QUESTIONS[s.qIndex],
          choices: GAD7_CHOICES,
          answerPrefix: "GAD7_A"
        })
      );
    }
    const total = s.answers.reduce((a, b) => a + b, 0);
    return res.status(200).json(buildGAD7ResultResponse(total));
  }

  if (utterance === "HELP_LINK") return res.status(200).json(buildHelpResponse());
  if (utterance === "HOME") return res.status(200).json(buildHomeResponse());
  return res.status(200).json(buildFallbackResponse());
});

// --- CES-D 라우트 ---
app.post("/skill/cesd", (req, res) => {
  const utterance = req.body?.userRequest?.utterance || "";
  const userId = getUserId(req.body);
  const state = getOrCreateUserState(userId);
  state.updatedAt = Date.now();

  if (utterance === "CESD_START" || utterance === "CES-D" || utterance === "CESD") {
    const s = resetSurvey(userId, "cesd");
    return res.status(200).json(
      buildQuestionResponse({
        title: "CES-D",
        description: "💡 CES-D는 지난 1주일간 경험한 일상적인 우울감을 확인하는 검사입니다.",
        qIndex: s.qIndex,
        totalCount: CESD_QUESTIONS.length,
        questionText: CESD_QUESTIONS[s.qIndex],
        choices: CESD_CHOICES,
        answerPrefix: "CESD_A"
      })
    );
  }

  // 피드백 반영: 질문이 부정형으로 통일되었으므로 역채점 계산식을 완전히 제거하고 순수하게 더합니다.
  if (/^CESD_A[0-3]$/.test(utterance)) {
    const score = Number(utterance.replace("CESD_A", ""));
    const s = state.cesd;

    s.answers.push(score);
    s.qIndex += 1;
    state.updatedAt = Date.now();

    if (s.qIndex < CESD_QUESTIONS.length) {
      return res.status(200).json(
        buildQuestionResponse({
          title: "CES-D",
          qIndex: s.qIndex,
          totalCount: CESD_QUESTIONS.length,
          questionText: CESD_QUESTIONS[s.qIndex],
          choices: CESD_CHOICES,
          answerPrefix: "CESD_A"
        })
      );
    }

    const total = s.answers.reduce((a, b) => a + b, 0);
    return res.status(200).json(buildCESDResultResponse(total));
  }

  if (utterance === "HELP_LINK") return res.status(200).json(buildHelpResponse());
  if (utterance === "HOME") return res.status(200).json(buildHomeResponse());
  return res.status(200).json(buildFallbackResponse());
});

// --- CBI 라우트 ---
app.post("/skill/cbi", (req, res) => {
  const utterance = req.body?.userRequest?.utterance || "";
  const userId = getUserId(req.body);
  const state = getOrCreateUserState(userId);
  state.updatedAt = Date.now();

  if (utterance === "CBI_START") {
    const s = resetSurvey(userId, "cbi");
    return res.status(200).json(
      buildQuestionResponse({
        title: "번아웃 점검",
        description: "💡 CBI는 현재 업무나 학업으로 인한 번아웃(탈진) 상태를 점검하는 검사입니다.",
        qIndex: s.qIndex,
        totalCount: CBI_QUESTIONS.length,
        questionText: CBI_QUESTIONS[s.qIndex],
        choices: CBI_CHOICES,
        answerPrefix: "CBI_A"
      })
    );
  }

  if (/^CBI_A[0-4]$/.test(utterance)) {
    const score = Number(utterance.replace("CBI_A", ""));
    const s = state.cbi;
    s.answers.push(score);
    s.qIndex += 1;

    if (s.qIndex < CBI_QUESTIONS.length) {
      return res.status(200).json(
        buildQuestionResponse({
          title: "번아웃 점검",
          qIndex: s.qIndex,
          totalCount: CBI_QUESTIONS.length,
          questionText: CBI_QUESTIONS[s.qIndex],
          choices: CBI_CHOICES,
          answerPrefix: "CBI_A"
        })
      );
    }

    const total = s.answers.reduce((a, b) => a + b, 0);
    return res.status(200).json(buildCBIResultResponse(total));
  }

  if (utterance === "HELP_LINK") return res.status(200).json(buildHelpResponse());
  if (utterance === "HOME") return res.status(200).json(buildHomeResponse());
  return res.status(200).json(buildFallbackResponse());
});

// ======================
// 8) 세션 자동 정리
// ======================
setInterval(() => {
  const now = Date.now();
  const TTL_MS = 30 * 60 * 1000; // 30분
  for (const [uid, s] of Object.entries(sessions)) {
    if (!s?.updatedAt || now - s.updatedAt > TTL_MS) {
      delete sessions[uid];
    }
  }
}, 10 * 60 * 1000);

// ======================
// 9) 서버 실행
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

const express = require("express");
const app = express();

app.use(express.json());

// ======================
// 1) PHQ-9 문항 (사용자가 준 문장 그대로)
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

// 2) 공통 선택지 (0~3점)
const CHOICES = [
  { label: "전혀 아니다 (0점)", score: 0 },
  { label: "여러 날 동안 (1점)", score: 1 },
  { label: "일주일 이상 (2점)", score: 2 },
  { label: "거의 매일 (3점)", score: 3 }
];

// ======================
// 3) 다중 사용자 세션 저장소 (메모리 기반)
// - sessions[userId] = { qIndex, answers, updatedAt }
// ======================
const sessions = Object.create(null);

// 사용자 식별자 추출 (카카오 payload 구조가 환경/설정에 따라 달라질 수 있어 fallback을 여러 개 둠)
function getUserId(body) {
  return (
    body?.userRequest?.user?.id ||
    body?.userRequest?.user?.properties?.plusfriendUserKey ||
    body?.userRequest?.user?.properties?.appUserId ||
    body?.userRequest?.user?.properties?.botUserKey ||
    "anonymous"
  );
}

function getOrCreateSession(userId) {
  if (!sessions[userId]) {
    sessions[userId] = {
      qIndex: 0,
      answers: [],
      updatedAt: Date.now()
    };
  }
  return sessions[userId];
}

function resetSession(userId) {
  sessions[userId] = {
    qIndex: 0,
    answers: [],
    updatedAt: Date.now()
  };
  return sessions[userId];
}

// ======================
// 4) 응답 빌더
// ======================
function buildQuestionResponse(qIndex) {
  return {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: {
            text: `PHQ-9 (${qIndex + 1}/9)\n${PHQ9_QUESTIONS[qIndex]}`
          }
        }
      ],
      quickReplies: [
        ...CHOICES.map((c) => ({
          label: c.label,
          action: "message",
          messageText: `PHQ9_A${c.score}`
        })),
        { label: "중단(처음으로)", action: "message", messageText: "HOME" }
      ]
    }
  };
}

function buildResultResponse(total, q9Score) {
  let levelText = "";
  if (total <= 4) levelText = "최소 수준 (0–4점)";
  else if (total <= 9) levelText = "가벼운 수준 (5–9점)";
  else if (total <= 14) levelText = "중등도 수준 (10–14점)";
  else if (total <= 19) levelText = "중등고도 수준 (15–19점)";
  else levelText = "고도 수준 (20–27점)";

  let safetyText = "";
  if (q9Score >= 1) {
    safetyText =
      "\n\n[안전 안내]\n자해/자살 관련 생각이 조금이라도 있었다면 혼자 두지 마세요.\n" +
      "지금 도움: 자살예방상담전화 1393, 정신건강위기상담 1577-0199, 긴급 112/119";
  }

  return {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: {
            text:
              `PHQ-9 완료\n총점: ${total}점\n단계: ${levelText}\n\n` +
              `이 결과는 진단이 아니라 상태 점검용입니다.\n` +
              `최근 2주간 어려움이 지속되면 상담/전문가 도움을 고려해 주세요.` +
              safetyText
          }
        }
      ],
      quickReplies: [
        { label: "상담 안내", action: "message", messageText: "HELP_LINK" },
        { label: "PHQ-9 다시하기", action: "message", messageText: "PHQ9_START" },
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
              "상담/도움 안내\n" +
              "- 자살예방상담전화: 1393\n" +
              "- 정신건강위기상담: 1577-0199\n" +
              "- 보건복지상담: 129\n" +
              "- 긴급: 112/119\n\n" +
              "교내/기관 상담 링크는 운영 정책에 맞게 연결해 주세요."
          }
        }
      ],
      quickReplies: [
        { label: "PHQ-9 다시하기", action: "message", messageText: "PHQ9_START" },
        { label: "처음으로", action: "message", messageText: "HOME" }
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
            text: "명령을 이해하지 못했습니다. 'PHQ9_START'로 시작해 주세요."
          }
        }
      ],
      quickReplies: [
        { label: "PHQ-9 시작", action: "message", messageText: "PHQ9_START" },
        { label: "처음으로", action: "message", messageText: "HOME" }
      ]
    }
  };
}

// ======================
// 5) 라우트
// ======================

// Render 헬스체크용 (Render Settings에서 Health Check Path를 /health로 맞추세요)
app.get("/health", (req, res) => res.status(200).send("ok"));

app.post("/skill/phq9", (req, res) => {
  // 들어온 payload 로그 (문제 생길 때 확인용)
  console.log("=== skill payload ===");
  console.log(JSON.stringify(req.body, null, 2));

  const utterance = req.body?.userRequest?.utterance || "";
  const userId = getUserId(req.body);

  // 사용자별 세션 불러오기/생성
  let session = getOrCreateSession(userId);
  session.updatedAt = Date.now();

  // 시작: PHQ9_START 또는 실수로 들어올 수 있는 라벨도 허용
  if (utterance === "PHQ9_START" || utterance === "PHQ-9" || utterance === "PHQ9") {
    session = resetSession(userId);
    return res.status(200).json(buildQuestionResponse(session.qIndex));
  }

  // 답변: PHQ9_A0 ~ PHQ9_A3
  if (/^PHQ9_A[0-3]$/.test(utterance)) {
    const score = Number(utterance.replace("PHQ9_A", ""));
    session.answers.push(score);
    session.qIndex += 1;
    session.updatedAt = Date.now();

    // 다음 문항
    if (session.qIndex < PHQ9_QUESTIONS.length) {
      return res.status(200).json(buildQuestionResponse(session.qIndex));
    }

    // 완료: 결과 계산
    const total = session.answers.reduce((a, b) => a + b, 0);
    const q9Score = session.answers[8] ?? 0;
    return res.status(200).json(buildResultResponse(total, q9Score));
  }

  // 상담 안내
  if (utterance === "HELP_LINK") {
    session.updatedAt = Date.now();
    return res.status(200).json(buildHelpResponse());
  }

  // 처음으로(원하시면 여기서 세션 삭제도 가능)
  if (utterance === "HOME") {
    // HOME을 누르면 세션을 초기화하고 기본 안내를 반환
    resetSession(userId);
    return res.status(200).json({
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: "처음으로 돌아왔습니다. PHQ-9를 시작하려면 아래 버튼을 눌러주세요."
            }
          }
        ],
        quickReplies: [{ label: "PHQ-9 시작", action: "message", messageText: "PHQ9_START" }]
      }
    });
  }

  // 그 외
  return res.status(200).json(buildFallbackResponse());
});

// ======================
// 6) 세션 자동 정리 (메모리 누적 방지)
// - 30분 이상 미사용 세션 삭제
// ======================
setInterval(() => {
  const now = Date.now();
  const TTL_MS = 30 * 60 * 1000; // 30분
  for (const [uid, s] of Object.entries(sessions)) {
    if (!s?.updatedAt || now - s.updatedAt > TTL_MS) {
      delete sessions[uid];
    }
  }
}, 10 * 60 * 1000); // 10분마다 정리

// ======================
// 7) 서버 실행 (Render용 PORT 환경변수 대응)
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
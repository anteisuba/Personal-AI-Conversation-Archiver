import type { EnrichedConversation } from '../core/domain/conversation.js'

export function buildAnalysisPrompt(conv: EnrichedConversation, promptLang: 'auto' | 'zh' | 'en'): string {
  const lang = promptLang === 'auto' ? conv.language : promptLang
  const isZh = lang === 'zh' || lang === 'mixed'

  const messagesText = conv.messages
    .map((m) => `[${m.role}]: ${m.content}`)
    .join('\n\n')

  if (isZh) {
    return `分析以下 AI 对话并提取结构化知识。

对话标题: ${conv.title}
来源: ${conv.source}
消息数: ${conv.messageCount}

---对话内容---
${messagesText}
---对话结束---

请提取以下信息:
1. category: 将对话分类为以下之一: programming, project, career, language, ai-tools, life
2. tags: 提取 2-5 个相关标签（小写，用连字符分隔）
3. project: 如果对话与特定项目相关，提供项目名称；否则为 null
4. confidence: 你对分类准确性的信心（0-1）
5. summary: 用 2-3 句话总结对话的核心内容
6. keyPoints: 列出 3-5 个关键要点
7. actionItems: 列出所有可执行的行动项（如果有）
8. rewrittenNote: 将对话重写为结构化的知识笔记，去掉来回的问答格式，只保留有价值的信息和结论。使用中文。`
  }

  return `Analyze the following AI conversation and extract structured knowledge.

Conversation title: ${conv.title}
Source: ${conv.source}
Message count: ${conv.messageCount}

---CONVERSATION---
${messagesText}
---END CONVERSATION---

Extract the following:
1. category: Classify as one of: programming, project, career, language, ai-tools, life
2. tags: Extract 2-5 relevant tags (lowercase, hyphen-separated)
3. project: If related to a specific project, provide the name; otherwise null
4. confidence: Your confidence in the classification (0-1)
5. summary: Summarize the core content in 2-3 sentences
6. keyPoints: List 3-5 key takeaways
7. actionItems: List all actionable items (if any)
8. rewrittenNote: Rewrite the conversation as a structured knowledge note. Remove the back-and-forth Q&A format, keep only valuable information and conclusions.`
}

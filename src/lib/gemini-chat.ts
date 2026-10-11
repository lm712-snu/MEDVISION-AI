export type GeminiChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: { type: 'image' | 'file'; name: string; url?: string }[];
};

export type LocalToolName =
  | 'get_current_case'
  | 'list_saved_cases'
  | 'show_case_findings'
  | 'show_medications'
  | 'show_case_overview';

export interface GeminiToolCall {
  name: LocalToolName;
  args: Record<string, unknown>;
}

export interface GeminiChatResult {
  text: string;
  toolCalls: GeminiToolCall[];
}

const functionDeclarations = [
  {
    name: 'get_current_case',
    description: 'Read the current active case details, notes, uploaded scan names, medication list, and status. Use this when the clinician asks about the current case or asks a follow-up that depends on case context.',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'list_saved_cases',
    description: 'List saved cases in this browser workspace. Use when asked what cases are saved or to find a prior case.',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'show_case_findings',
    description: 'Open the findings panel for the current case when the user asks to see, explain, or revisit findings. This only displays already stored app findings; it does not run a medical model.',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'show_medications',
    description: 'Open the medications panel for the current case when the user asks to review medication information.',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'show_case_overview',
    description: 'Open the current case overview and uploaded scan list.',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
];

function dataUrlPart(url: string) {
  const match = url.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;
  return { inlineData: { mimeType: match[1], data: match[2] } };
}

function toGeminiParts(message: GeminiChatMessage) {
  const parts: Record<string, unknown>[] = [];
  if (message.content.trim()) parts.push({ text: message.content });
  for (const attachment of message.attachments ?? []) {
    if (attachment.type === 'image' && attachment.url?.startsWith('data:')) {
      const image = dataUrlPart(attachment.url);
      if (image) parts.push(image);
    }
  }
  if (!parts.length) parts.push({ text: '[Message contains no text or supported image data.]' });
  return parts;
}

export async function sendGeminiConversation(args: {
  apiKey: string;
  messages: GeminiChatMessage[];
  context: string;
  executeTool: (call: GeminiToolCall) => unknown | Promise<unknown>;
}): Promise<GeminiChatResult> {
  const { apiKey, messages, context, executeTool } = args;
  const recent = messages.slice(-16).filter(m => m.role !== 'system');
  const contents: Record<string, unknown>[] = recent.map(message => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: toGeminiParts(message),
  }));
  const toolCalls: GeminiToolCall[] = [];
  let finalText = '';
  const systemInstruction = `You are MedVision AI, a warm, careful, context-aware clinical copilot for clinicians. Have a real conversation: answer the actual question, use prior turns and provided images, and do not repeat a generic fallback. Ask one focused clarifying question only when essential. Use tools when the user's request needs app state or an action; do not claim a tool ran unless you called it and received its result. Tool results are local application data, not external medical truth.

Clinical safety: this is decision support, not a diagnosis. Never claim a definitive diagnosis from an image, invent measurements or findings, or present the app's demo/mock analysis as real medical analysis. If an image is attached, describe only visible, cautiously observed features and explain limitations. Recommend qualified clinician verification and urgent clinical pathways when symptoms or image concerns suggest urgency. Do not expose identifiers unnecessarily. Clearly distinguish user-provided context, stored app data, and your own general explanation.

Current app context:
${context}

Available actions are limited to reading the current/saved case data and opening relevant panels. If asked to analyze a scan, be transparent that no validated radiology inference model is connected yet; you may describe the visible image cautiously, but must not present that as a clinical report.`;
  const modelCandidates = ['gemini-3.8-flash', 'gemini-3.6-flash'];

  for (let turn = 0; turn < 5; turn++) {
    let response: Response | null = null;
    let payload: any = null;
    let lastModelError = '';
    for (const model of modelCandidates) {
      const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(apiKey);
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: contents.length ? contents : [{ role: 'user', parts: [{ text: 'Introduce yourself briefly.' }] }],
          tools: [{ functionDeclarations }],
          generationConfig: { temperature: 0.65, maxOutputTokens: 1200 },
        }),
      });
      payload = await response.json();
      if (response.ok) break;
      const message = payload?.error?.message || 'The AI service rejected the request.';
      const modelUnavailable = response.status === 404 || /model .*not found|not supported for generatecontent|no longer available/i.test(message);
      if (modelUnavailable) {
        lastModelError = model + ': ' + message;
        continue;
      }
      if (response.status === 400 || response.status === 403 || response.status === 401) {
        throw new Error('Gemini could not accept this API key or request: ' + message);
      }
      throw new Error('AI request failed (' + response.status + '): ' + message);
    }
    if (!response || !response.ok) {
      throw new Error('The configured Gemini models were unavailable. Tried gemini-3.8-flash and gemini-3.6-flash. ' + lastModelError + ' Check the current model list and API key permissions in Google AI Studio.');
    }
    const candidate = payload?.candidates?.[0]?.content;
    const parts = Array.isArray(candidate?.parts) ? candidate.parts : [];
    const calls = parts.filter((part: any) => part.functionCall);
    const textParts = parts.filter((part: any) => typeof part.text === 'string').map((part: any) => part.text);
    if (!calls.length) {
      finalText = textParts.join('\n').trim();
      break;
    }
    contents.push({ role: 'model', parts });
    const functionResponses: Record<string, unknown>[] = [];
    for (const part of calls) {
      const call = part.functionCall;
      const toolCall = { name: call.name as LocalToolName, args: (call.args || {}) as Record<string, unknown> };
      toolCalls.push(toolCall);
      let result: unknown;
      try {
        result = await executeTool(toolCall);
      } catch (error) {
        result = { ok: false, error: error instanceof Error ? error.message : 'Tool execution failed.' };
      }
      functionResponses.push({ functionResponse: { name: toolCall.name, response: { result } } });
    }
    contents.push({ role: 'user', parts: functionResponses });
  }

  if (!finalText) finalText = 'I could not complete that response. Please try once more, or rephrase the question.';
  return { text: finalText, toolCalls };
}

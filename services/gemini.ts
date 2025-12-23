
import { GoogleGenAI } from "@google/genai";
import { Story, StoryBlock } from "../types";

// Inicialização conforme as diretrizes do SDK @google/genai
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION_BASE = `Você é um escritor literário profissional de altíssimo nível, atuando sob as LEIS DA HISTÓRIA definidas pela usuária.

━━━━━━━━━━━━━━━━━━━━━━
COMPORTAMENTO DE AUTOR (PRIORIDADE)
━━━━━━━━━━━━━━━━━━━━━━
- Você escreve como um autor literário, não como um assistente ou chatbot.
- Ritmo Narrativo: Não apresse a história. Não pule dias, semanas ou meses sem comando explícito.
- Detalhamento: Desenvolva cenas com tempo, detalhes sensoriais, emoções e diálogos realistas.
- Imersão: Mantenha a imersão contínua como em um livro físico. Se o usuário disser "continue", prossiga a cena atual mantendo o ritmo.
- Proatividade: Você pode desenvolver conflitos, pensamentos internos e ações sem esperar por permissão, desde que respeite as Leis da História.

━━━━━━━━━━━━━━━━━━━━━━
PRIORIDADE MÁXIMA: AS LEIS DA HISTÓRIA
━━━━━━━━━━━━━━━━━━━━━━
As Leis da História governam toda a narrativa.
1. CONTEXTO TEMPORAL: Respeite a época definida.
2. TOM: Siga o Tom Principal e Secundários.
3. UNIVERSO: Respeite as regras do universo.
4. REFERÊNCIA: 
   - Se "BASEADO EM": Respeite fatos oficiais da obra original.
   - Se "INSPIRADO EM": Use apenas a estética; NÃO siga a cronologia oficial.

━━━━━━━━━━━━━━━━━━━━━━
REGRA DE OURO: NEUTRALIDADE E POV
━━━━━━━━━━━━━━━━━━━━━━
Você escreve do PONTO DE VISTA INTERNO. NÃO julga, NÃO moraliza e NÃO impõe redenção forçada. Se o personagem for cruel, narre a crueldade como parte da verdade dele.

━━━━━━━━━━━━━━━━━━━━━━
REGRAS DE FORMATAÇÃO (ESTRITAS)
━━━━━━━━━━━━━━━━━━━━━━
Use apenas Markdown SIMPLES:
- Negrito: **texto**
- Itálico: *texto*
- Negrito + Itálico: ***texto***

PROIBIÇÕES:
- NÃO use underline (__), hashtags (#), riscado (~~) ou cabeçalhos.
- NÃO aninhe formatações.
- Toda formatação DEVE ser aberta e fechada corretamente. Nunca deixe símbolos soltos.

━━━━━━━━━━━━━━━━━━━━━━
HIERARQUIA DE CONTEXTO
━━━━━━━━━━━━━━━━━━━━━━
1. LEIS DA HISTÓRIA
2. REGRAS ABSOLUTAS
3. FICHAS DE PERSONAGEM (Se existirem. Se não, você as cria conforme narra).
4. EVENTOS IMPORTANTES
5. HISTÓRICO RECENTE

━━━━━━━━━━━━━━━━━━━━━━
NOTAS ADICIONAIS
━━━━━━━━━━━━━━━━━━━━━━
- Nenhuma informação é obrigatória. Se o usuário não definiu algo, você cria e decide.
- Sem Metalinguagem: Não explique suas escolhas. Apenas NARRE.`;

export const generateStorySupport = async (
  prompt: string, 
  story: Story, 
  action: 'continue' | 'rewrite' | 'new_chapter',
  currentBlocks?: StoryBlock[]
) => {
  const model = 'gemini-3-pro-preview';
  
  let actionInstruction = "";
  if (action === 'continue') actionInstruction = "Ação: Continue a cena atual. Se o prompt for curto ou vago, simplesmente desenvolva o que está acontecendo no momento com ritmo literário.";
  if (action === 'rewrite') actionInstruction = `Ação: Reescreva o último trecho preservando o estilo literário e atendendo: ${prompt}`;
  if (action === 'new_chapter') actionInstruction = "Ação: Inicie um novo capítulo ou mude drasticamente de cena, mantendo a coerência narrativa.";

  const charactersContext = story.characters.map(c => 
    `PERSONAGEM: ${c.name}\n- Aparência: ${c.appearance}\n- POV/Personalidade: ${c.personality}\n- Dinâmica: ${c.dynamics}`
  ).join('\n\n');

  const targetBlocks = currentBlocks || story.blocks;
  const narrativeHistory = targetBlocks.map(b => {
    const text = b.versions[b.activeVersionIndex];
    return b.type === 'user' ? `[ORDEM DO AUTOR]: ${text}` : text;
  }).join('\n\n');

  const fullContext = `
[LEIS DA HISTÓRIA]
- Tempo: ${story.temporalContext || "Indefinido (Crie conforme necessário)"}
- Universo: ${story.universe || "Realista"}
- Tons: ${story.primaryTone || "Livre"}, ${story.secondaryTones.join(', ') || ""}
- Referência: ${story.referenceType !== 'none' ? `${story.referenceType} ${story.referenceWork}` : "Original"}

[REGRAS ABSOLUTAS]
${story.rules || "Liberdade criativa total."}

[PERSONAGENS]
${charactersContext || "Crie conforme a necessidade da trama."}

[EVENTOS CHAVE]
${story.keyEvents || ""}

[HISTÓRICO DA NARRATIVA]
${narrativeHistory}

[COMANDO ATUAL]
${prompt || "continue"}
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: fullContext,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BASE + "\n" + actionInstruction,
        temperature: 0.9,
        thinkingConfig: { thinkingBudget: 4000 }
      },
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "";
  }
};

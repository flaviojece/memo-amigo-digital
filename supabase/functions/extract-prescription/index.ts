import { corsHeaders, jsonResponse, serviceClient, getCallerUser, isGuardianOf } from "../_shared/auth.ts";

/**
 * Lê uma foto de receita e devolve os medicamentos encontrados.
 *
 * IMPORTANTE: esta função NÃO grava nada. Ela só propõe.
 * O resultado vai para a tela de revisão e, depois de conferido, vira
 * uma sugestão que o paciente ainda precisa aprovar. Erro de extração
 * aqui seria erro de medicação, então o humano decide sempre —
 * duas vezes, inclusive.
 */

interface Pedido {
  /** Imagem em base64, sem o prefixo data: */
  imageBase64: string;
  mediaType: string;
  /** Para quem é a receita (o próprio usuário ou um paciente de quem é anjo) */
  patientId: string;
}

const PROMPT = `Você está lendo a foto de uma receita médica brasileira.

Extraia APENAS os medicamentos que estiverem escritos de forma legível.

Responda SOMENTE com JSON válido, sem markdown, sem crases, neste formato:
{
  "medicamentos": [
    {
      "nome": "nome do medicamento",
      "dosagem": "ex: 50mg",
      "frequencia": "ex: 1x ao dia",
      "horarios_sugeridos": ["08:00"],
      "observacoes": "ex: tomar em jejum",
      "confianca": "alta" | "media" | "baixa"
    }
  ],
  "aviso": "texto curto se a foto estiver ruim, cortada ou ilegível, senão string vazia"
}

Regras obrigatórias:
- NUNCA invente um medicamento, dosagem ou frequência que não esteja escrito.
- Se não conseguir ler a dosagem, deixe o campo vazio e marque confianca como "baixa".
- Se a foto não for uma receita, devolva a lista vazia e explique no aviso.
- Prefira deixar de fora a marcar algo incerto como certo.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = serviceClient();

    const caller = await getCallerUser(req, supabase);
    if (!caller) return jsonResponse({ error: "Não autorizado" }, 401);

    const { imageBase64, mediaType, patientId }: Pedido = await req.json();

    if (!imageBase64) return jsonResponse({ error: "Imagem não enviada" }, 400);

    // Só o próprio paciente ou um anjo ativo dele pode ler a receita
    if (caller.id !== patientId && !(await isGuardianOf(supabase, caller.id, patientId))) {
      return jsonResponse({ error: "Sem permissão para este paciente" }, 403);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return jsonResponse(
        { error: "Leitura de receita não configurada. Falta o segredo LOVABLE_API_KEY." },
        503
      );
    }

    const resposta = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              {
                type: "image_url",
                image_url: { url: `data:${mediaType ?? "image/jpeg"};base64,${imageBase64}` },
              },
            ],
          },
        ],
      }),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      console.error("Falha na leitura da receita:", resposta.status, detalhe);
      if (resposta.status === 429) {
        return jsonResponse({ error: "Muitas leituras seguidas. Tente em um minuto." }, 429);
      }
      return jsonResponse({ error: "Não foi possível ler a receita agora." }, 502);
    }

    const dados = await resposta.json();
    const texto: string = dados.choices?.[0]?.message?.content ?? "";

    // O modelo às vezes devolve cercado por crases, mesmo instruído a não fazer
    const limpo = texto.replace(/```json|```/g, "").trim();

    let extraido: { medicamentos?: unknown[]; aviso?: string };
    try {
      extraido = JSON.parse(limpo);
    } catch {
      console.error("Resposta não era JSON:", limpo.slice(0, 300));
      return jsonResponse({ error: "Não consegui entender a receita. Tente outra foto." }, 422);
    }

    return jsonResponse({
      medicamentos: extraido.medicamentos ?? [],
      aviso: extraido.aviso ?? "",
      // Deixa explícito para a interface: isto é proposta, não cadastro
      requer_revisao: true,
    });
  } catch (erro) {
    console.error("Erro ao processar receita:", erro);
    return jsonResponse(
      { error: erro instanceof Error ? erro.message : "Erro desconhecido" },
      500
    );
  }
});

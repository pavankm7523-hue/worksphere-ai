const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { resumeUrl, jobTitle, requirements } = await req.json();

    if (!resumeUrl || !jobTitle) {
      return new Response(
        JSON.stringify({ error: "Missing resumeUrl or jobTitle" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY secret is not configured.");
    }

    // Step 1: Download the PDF from Supabase Storage
    console.log(`Downloading PDF from: ${resumeUrl}`);
    const pdfResp = await fetch(resumeUrl);
    if (!pdfResp.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResp.status} ${pdfResp.statusText}`);
    }
    const pdfBuffer = await pdfResp.arrayBuffer();
    console.log(`PDF downloaded: ${pdfBuffer.byteLength} bytes`);

    // Step 2: Convert to base64
    const bytes = new Uint8Array(pdfBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const pdfBase64 = btoa(binary);

    // Step 3: Call Gemini with inline PDF base64 (no Files API needed)
    console.log("Sending PDF to Gemini 1.5 Pro for analysis...");
    const prompt = `You are an expert HR recruiter. Analyze the attached resume PDF and score it against the job below.

Job Title: ${jobTitle}
Requirements: ${requirements || "Senior-level experience with strong technical and communication skills."}

Return ONLY a raw JSON object (no markdown, no code fences):
{
  "candidate_name": "Full Name from resume",
  "candidate_email": "email@example.com or null",
  "score": 85,
  "summary": "2-3 sentence fit summary",
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["gap1", "gap2"]
}`;

    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: "application/pdf",
                    data: pdfBase64,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: "application/json",
          },
        }),
      }
    );

    if (!geminiResp.ok) {
      const errText = await geminiResp.text();
      throw new Error(`Gemini API error: ${geminiResp.status} - ${errText}`);
    }

    const geminiData = await geminiResp.json();
    const rawContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawContent) {
      throw new Error(`Gemini returned empty content. Response: ${JSON.stringify(geminiData)}`);
    }

    // Step 4: Parse and validate JSON
    let parsed: Record<string, unknown>;
    try {
      const cleaned = rawContent.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error(`Gemini returned invalid JSON. Raw: ${rawContent.slice(0, 300)}`);
    }

    const required = ["candidate_name", "score", "summary", "matched_skills", "missing_skills"];
    const missing = required.filter((k) => !(k in parsed));
    if (missing.length > 0) {
      throw new Error(`Response missing keys: ${missing.join(", ")}. Got: ${JSON.stringify(parsed)}`);
    }

    console.log(`Analysis done. Candidate: ${parsed.candidate_name}, Score: ${parsed.score}`);
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("analyze-resume error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

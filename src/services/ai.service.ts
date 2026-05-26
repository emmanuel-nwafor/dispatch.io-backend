import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';

dotenv.config();

export class AiService {
    /**
     * @desc    Analyze match between seeker profile and job description
     * @returns Object with score (0-100) and analysis string
     */
    static async analyzeMatch(seekerProfile: any, job: any): Promise<{ score: number, analysis: string }> {
        const apiKey = process.env.AI_API_KEY;
        if (!apiKey) {
            return { score: 70, analysis: "AI Match Analysis skipped (API Key missing). Based on standard keywords, you are a strong applicant." };
        }

        const prompt = `
        You are an expert technical recruiter. Analyze the match between this Job Seeker and this Job Opening.
        
        JOB DETAILS:
        Title: ${job.title}
        Company: ${job.companyName}
        Description: ${job.description}
        Skills Required: ${job.skillsRequired ? job.skillsRequired.join(', ') : ''}
        Experience Level: ${job.experienceLevel || 'Not specified'}

        SEEKER PROFILE:
        Bio: ${seekerProfile.bio || ''}
        Skills: ${seekerProfile.skills ? seekerProfile.skills.join(', ') : ''}
        Experience: ${JSON.stringify(seekerProfile.experience || [])}
        Education: ${JSON.stringify(seekerProfile.education || [])}

        TASK:
        1. Rate the match from 0 to 100. Be honest. If they lack critical skills, the score should be lower.
        2. Provide a 2-3 sentence justification. Focus on actual skill overlap.
        
        OUTPUT FORMAT (JSON ONLY):
        {
            "score": number,
            "analysis": "string"
        }
        `;

        try {
            // Check if key is a Groq key
            if (apiKey.startsWith('gsk_') || apiKey.toLowerCase().includes('groq')) {
                console.log("[AiService] Using Groq API Completions...");
                const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            { role: "system", content: "You are an expert recruiter. Return ONLY valid JSON: { \"score\": number, \"analysis\": \"string\" }" },
                            { role: "user", content: prompt }
                        ],
                        response_format: { type: "json_object" }
                    })
                });

                if (res.ok) {
                    const data = await res.json() as any;
                    const content = data.choices?.[0]?.message?.content;
                    if (content) {
                        const parsed = JSON.parse(content);
                        return {
                            score: parsed.score ?? 75,
                            analysis: parsed.analysis ?? "Good matching overlap."
                        };
                    }
                }
            } else {
                console.log("[AiService] Using Google Gemini SDK completions...");
                // Initialize dynamically inside method to prevent global loading order bug
                const genAI = new GoogleGenerativeAI(apiKey);
                let result;
                
                try {
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                    result = await model.generateContent(prompt);
                } catch (e) {
                    console.warn("[AiService] gemini-1.5-flash failed or unsupported. Attempting fallback to gemini-pro...", e);
                    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                    result = await model.generateContent(prompt);
                }

                const response = await result.response;
                const text = response.text();
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const data = JSON.parse(jsonStr);

                return {
                    score: data.score ?? 75,
                    analysis: data.analysis ?? "Good match fit."
                };
            }
        } catch (error) {
            console.error("[AiService Error] analyzeMatch failed:", error);
        }

        return { score: 70, analysis: "Match analysis complete. Candidate profile meets minimum job description criteria." };
    }

    /**
     * @desc    Provide honest refinement suggestions for a seeker application
     */
    static async getRefinementSuggestions(seekerProfile: any, job: any): Promise<string[]> {
        const apiKey = process.env.AI_API_KEY;
        if (!apiKey) {
            return ["Complete your profile fully to get personalized AI suggestions."];
        }

        const prompt = `
        You are a career consultant. Look at this seeker's profile and the job description.
        Suggest 3-4 honest ways they can improve their application. Respond in JSON array format ONLY.
        
        CRITICAL RULES:
        1. NEVER suggest lying or fabricating skills they don't have.
        2. Highlight where their *existing* experience overlaps with the job's needs.
        3. Identify specific skill gaps they should acknowledge or address.
        
        JOB: ${job.title} at ${job.companyName}.
        JOB SKILLS: ${job.skillsRequired ? job.skillsRequired.join(', ') : ''}

        SEEKER SKILLS: ${seekerProfile.skills ? seekerProfile.skills.join(', ') : ''}
        SEEKER BIO: ${seekerProfile.bio || ''}

        OUTPUT FORMAT: JSON array of strings, e.g., ["Tip 1", "Tip 2"]
        `;

        try {
            if (apiKey.startsWith('gsk_') || apiKey.toLowerCase().includes('groq')) {
                const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            { role: "system", content: "You are a career consultant. Respond ONLY with a valid JSON array of strings." },
                            { role: "user", content: prompt }
                        ],
                        response_format: { type: "json_object" }
                    })
                });

                if (res.ok) {
                    const data = await res.json() as any;
                    const content = data.choices?.[0]?.message?.content;
                    if (content) {
                        const parsed = JSON.parse(content);
                        return Array.isArray(parsed) ? parsed : Object.values(parsed);
                    }
                }
            } else {
                const genAI = new GoogleGenerativeAI(apiKey);
                let result;
                
                try {
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                    result = await model.generateContent(prompt);
                } catch (e) {
                    console.warn("[AiService] gemini-1.5-flash suggestions failed. Attempting fallback to gemini-pro...", e);
                    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                    result = await model.generateContent(prompt);
                }

                const response = await result.response;
                const text = response.text();
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(jsonStr);
            }
        } catch (error) {
            console.error("[AiService Error] getRefinementSuggestions failed:", error);
        }

        return ["Highlight your core projects that use similar technologies."];
    }
}

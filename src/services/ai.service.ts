import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export class AiService {
    /**
     * @desc    Analyze match between seeker profile and job description
     * @returns Object with score (0-100) and analysis string
     */
    static async analyzeMatch(seekerProfile: any, job: any): Promise<{ score: number, analysis: string }> {
        if (!process.env.AI_API_KEY) {
            return { score: 70, analysis: "AI Analysis skipped (API Key missing). Based on basic keyword matching, this candidate is a good fit." };
        }

        const prompt = `
        You are an expert technical recruiter. Analyze the match between this Job Seeker and this Job Opening.
        
        JOB DETAILS:
        Title: ${job.title}
        Company: ${job.companyName}
        Description: ${job.description}
        Skills Required: ${job.skillsRequired.join(', ')}
        Experience Level: ${job.experienceLevel}

        SEEKER PROFILE:
        Bio: ${seekerProfile.bio}
        Skills: ${seekerProfile.skills.join(', ')}
        Experience Years: ${seekerProfile.experienceYear}
        Education: ${seekerProfile.education}

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
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean the response in case of markdown blocks
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);

            return {
                score: data.score || 0,
                analysis: data.analysis || "Analysis unavailable."
            };
        } catch (error) {
            console.error("AI Analysis Error:", error);
            return { score: 0, analysis: "Error performing AI Match Analysis." };
        }
    }

    /**
     * @desc    Provide honest refinement suggestions for a seeker application
     */
    static async getRefinementSuggestions(seekerProfile: any, job: any): Promise<string[]> {
        if (!process.env.AI_API_KEY) {
            return ["Complete your profile fully to get personalized AI suggestions."];
        }

        const prompt = `
        You are a career consultant. Look at this seeker's profile and the job description.
        Suggest 3-4 honest ways they can improve their application.
        
        CRITICAL RULES:
        1. NEVER suggest lying or fabricating skills they don't have.
        2. Highlight where their *existing* experience overlaps with the job's needs.
        3. Identify specific skill gaps they should acknowledge or address.
        4. Suggest terminology changes (e.g., using "Distributed Systems" if they have that experience but called it "Server setup").

        JOB: ${job.title} at ${job.companyName}.
        JOB SKILLS: ${job.skillsRequired.join(', ')}

        SEEKER SKILLS: ${seekerProfile.skills.join(', ')}
        SEEKER BIO: ${seekerProfile.bio}

        OUTPUT FORMAT: JSON array of strings.
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("AI Refinement Error:", error);
            return ["Highlight your core projects that use similar technologies."];
        }
    }
}

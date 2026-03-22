import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';
import { User } from '../src/models/Users.js';
import { Job } from '../src/models/Jobs.js';

// Load .env
dotenv.config({ path: path.join(process.cwd(), '.env') });

const MONGO_URI = process.env.MONGO_URI;
const PASSWORD = '@123456Bi';

async function seed() {
    try {
        if (!MONGO_URI) {
            throw new Error('MONGO_URI not found in .env');
        }

        console.log('Connecting to database...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected to database.');

        // Clear existing data (Optional, but good for fresh start)
        console.log('Clearing existing users and jobs...');
        await User.deleteMany({});
        await Job.deleteMany({});

        console.log('Hashing password...');
        const passwordHash = await bcrypt.hash(PASSWORD, 10);

        // Create Recruiters
        console.log('Creating recruiters...');
        const recruiters = await User.create([
            {
                email: 'janedoe@gmail.com',
                username: 'janedoe',
                passwordHash,
                role: 'recruiter',
                isVerified: true,
                isProfileCompleted: true,
                avatar: 'https://i.pravatar.cc/300?u=jane',
                coverImage: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=1000',
                recruiterProfile: {
                    companyName: 'TechCorp',
                    companyWebsite: 'https://techcorp.com',
                    industry: 'Software Development',
                    companySize: '100-500',
                    location: 'New York, NY',
                    accountabilityScore: 95,
                    verifiedCompany: true
                }
            },
            {
                email: 'johnsmith@company.com',
                username: 'johnsmith',
                passwordHash,
                role: 'recruiter',
                isVerified: true,
                isProfileCompleted: true,
                avatar: 'https://i.pravatar.cc/300?u=john',
                coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1000',
                recruiterProfile: {
                    companyName: 'InnovateAI',
                    companyWebsite: 'https://innovateai.io',
                    industry: 'Artificial Intelligence',
                    companySize: '10-50',
                    location: 'San Francisco, CA',
                    accountabilityScore: 100,
                    verifiedCompany: true
                }
            }
        ]);

        // Create Seekers
        console.log('Creating seekers...');
        await User.create([
            {
                email: 'seeker1@gmail.com',
                username: 'alicej',
                passwordHash,
                role: 'seeker',
                isVerified: true,
                isProfileCompleted: true,
                avatar: 'https://i.pravatar.cc/300?u=alice',
                coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000',
                profile: {
                    fullName: 'Alice Johnson',
                    headline: 'Frontend Developer',
                    phone: '+1234567890',
                    bio: 'Passionate Frontend Developer with 3 years of experience.',
                    location: 'Austin, TX',
                    resumeUrl: 'https://example.com/resumes/alice.pdf',
                    skills: ['React', 'TypeScript', 'CSS', 'Tailwind'],
                    experience: [],
                    education: [],
                    preferredJobTypes: ['Full-time', 'Remote']
                }
            },
            {
                email: 'seeker2@yahoo.com',
                username: 'bobw',
                passwordHash,
                role: 'seeker',
                isVerified: true,
                isProfileCompleted: true,
                avatar: 'https://i.pravatar.cc/300?u=bob',
                coverImage: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1000',
                profile: {
                    fullName: 'Bob Wilson',
                    headline: 'Backend Engineer',
                    phone: '+0987654321',
                    bio: 'Backend Engineer specializing in Node.js and Python.',
                    location: 'Seattle, WA',
                    resumeUrl: 'https://example.com/resumes/bob.pdf',
                    skills: ['Node.js', 'Express', 'MongoDB', 'Python'],
                    experience: [],
                    education: [],
                    preferredJobTypes: ['Contract', 'Remote']
                }
            }
        ]);

        // Create Jobs
        console.log('Creating jobs...');
        await Job.create([
            {
                recruiter: recruiters[0]._id,
                title: 'Senior Frontend Developer',
                companyName: 'TechCorp',
                description: 'We are looking for a senior frontend developer to lead our React team.',
                location: 'Remote',
                jobType: 'Full-time',
                salaryRange: { min: 120000, max: 180000, currency: 'USD' },
                skillsRequired: ['React', 'TypeScript', 'Redux'],
                experienceLevel: 'Senior',
                status: 'open'
            },
            {
                recruiter: recruiters[0]._id,
                title: 'Product Designer',
                companyName: 'TechCorp',
                description: 'Join our design team to create beautiful user experiences.',
                location: 'New York, NY',
                jobType: 'Full-time',
                salaryRange: { min: 90000, max: 140000, currency: 'USD' },
                skillsRequired: ['Figma', 'UI/UX', 'Prototyping'],
                experienceLevel: 'Mid',
                status: 'open'
            },
            {
                recruiter: recruiters[1]._id,
                title: 'AI Research Scientist',
                companyName: 'InnovateAI',
                description: 'Work on cutting edge LLM research and deployment.',
                location: 'San Francisco, CA',
                jobType: 'Full-time',
                salaryRange: { min: 200000, max: 350000, currency: 'USD' },
                skillsRequired: ['Python', 'PyTorch', 'LLMs'],
                experienceLevel: 'Lead',
                status: 'open'
            }
        ]);

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seed();

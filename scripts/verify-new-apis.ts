
const API_URL = 'http://localhost:5000/api/v1';
let token = '';

async function login() {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'janedoe@gmail.com',
                password: '@123456Bi'
            })
        });
        const data = await res.json();
        if (res.ok) {
            token = data.token;
            console.log('Logged in successfully');
        } else {
            console.error('Login failed:', data);
        }
    } catch (err: any) {
        console.error('Login error:', err.message);
    }
}

async function testSearch() {
    try {
        const res = await fetch(`${API_URL}/all-jobs?search=Developer`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log('Search Result Count:', data.count);
    } catch (err: any) {
        console.error('Search failed:', err.message);
    }
}

async function testDeleteJob() {
    try {
        // First get a job
        const jobsRes = await fetch(`${API_URL}/all-jobs`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const jobsData = await jobsRes.json();
        if (jobsData.jobs && jobsData.jobs.length > 0) {
            const jobId = jobsData.jobs[0]._id;
            console.log('Deleting job:', jobId);
            const delRes = await fetch(`${API_URL}/jobs/${jobId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const delData = await delRes.json();
            console.log('Delete result:', delData.message);
        }
    } catch (err: any) {
        console.error('Delete failed:', err.message);
    }
}

async function run() {
    await login();
    if (token) {
        await testSearch();
        await testDeleteJob();
    }
}

run();

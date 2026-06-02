const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file manually
const envPath = path.join(__dirname, '.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = match[2] ? match[2].trim() : '';
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            envConfig[match[1]] = value;
        }
    });
}

const supabaseUrl = envConfig['VITE_SUPABASE_URL'] || 'https://ycykvkhpyxxhgroqchhd.supabase.co';
const serviceRoleKey = envConfig['SUPABASE_SECRET_KEY'] || envConfig['VITE_SUPABASE_SECRET_KEY'];

if (!serviceRoleKey) {
    console.error("Error: SUPABASE_SECRET_KEY is missing from .env!");
    process.exit(1);
}

const PORT = 3001;

const CONFIG_FILE = path.join(__dirname, 'system_config.json');

function getDefaultConfig() {
    return {
        lowStockThreshold: 15,
        doubleApprovalThreshold: 5000,
        maintenanceMode: false,
        sessionTimeoutMinutes: 30,
        allowSignup: true
    };
}

function readConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            return { ...getDefaultConfig(), ...JSON.parse(data) };
        }
    } catch (e) {
        console.error("Error reading config file:", e);
    }
    return getDefaultConfig();
}

function writeConfig(config) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error("Error writing config file:", e);
        return false;
    }
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

// Helper function to make HTTPS requests to Supabase GoTrue API
function makeSupabaseRequest(path, method, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, supabaseUrl);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: { error: "Failed to parse JSON response", raw: data } });
                }
            });
        });

        req.on('error', (err) => reject(err));
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

const server = http.createServer(async (req, res) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    try {
        if (pathname === '/api/users' && req.method === 'GET') {
            const result = await makeSupabaseRequest('/auth/v1/admin/users', 'GET');
            res.writeHead(result.status, corsHeaders);
            res.end(JSON.stringify(result.data));
            return;
        }

        if (pathname === '/api/users/update-role' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                const parsed = JSON.parse(body);
                const { userId, newRole } = parsed;
                const result = await makeSupabaseRequest(`/auth/v1/admin/users/${userId}`, 'PUT', {
                    user_metadata: { role: newRole }
                });
                res.writeHead(result.status, corsHeaders);
                res.end(JSON.stringify(result.data));
            });
            return;
        }

        if (pathname === '/api/users/update-password' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                const parsed = JSON.parse(body);
                const { userId, newPassword } = parsed;
                const result = await makeSupabaseRequest(`/auth/v1/admin/users/${userId}`, 'PUT', {
                    password: newPassword
                });
                res.writeHead(result.status, corsHeaders);
                res.end(JSON.stringify(result.data));
            });
            return;
        }

        if (pathname === '/api/users/delete' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                const parsed = JSON.parse(body);
                const { userId } = parsed;
                const result = await makeSupabaseRequest(`/auth/v1/admin/users/${userId}`, 'DELETE');
                res.writeHead(result.status, corsHeaders);
                res.end(JSON.stringify(result.data));
            });
            return;
        }

        // Live System Configuration endpoints
        if (pathname === '/api/config' && req.method === 'GET') {
            const config = readConfig();
            res.writeHead(200, corsHeaders);
            res.end(JSON.stringify(config));
            return;
        }

        if (pathname === '/api/config' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    const currentConfig = readConfig();
                    
                    const newConfig = {
                        lowStockThreshold: typeof parsed.lowStockThreshold === 'number' ? parsed.lowStockThreshold : currentConfig.lowStockThreshold,
                        doubleApprovalThreshold: typeof parsed.doubleApprovalThreshold === 'number' ? parsed.doubleApprovalThreshold : currentConfig.doubleApprovalThreshold,
                        maintenanceMode: typeof parsed.maintenanceMode === 'boolean' ? parsed.maintenanceMode : currentConfig.maintenanceMode,
                        sessionTimeoutMinutes: typeof parsed.sessionTimeoutMinutes === 'number' ? parsed.sessionTimeoutMinutes : currentConfig.sessionTimeoutMinutes,
                        allowSignup: typeof parsed.allowSignup === 'boolean' ? parsed.allowSignup : currentConfig.allowSignup
                    };

                    if (writeConfig(newConfig)) {
                        res.writeHead(200, corsHeaders);
                        res.end(JSON.stringify({ success: true, config: newConfig }));
                    } else {
                        res.writeHead(500, corsHeaders);
                        res.end(JSON.stringify({ error: "Failed to write configuration file" }));
                    }
                } catch (e) {
                    res.writeHead(400, corsHeaders);
                    res.end(JSON.stringify({ error: "Invalid JSON format" }));
                }
            });
            return;
        }

        // Personnel endpoints
        if (pathname === '/api/personnel/add' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const parsed = JSON.parse(body);
                    const result = await makeSupabaseRequest('/rest/v1/personnel', 'POST', parsed);
                    res.writeHead(result.status, corsHeaders);
                    res.end(JSON.stringify(result.data));
                } catch (e) {
                    res.writeHead(400, corsHeaders);
                    res.end(JSON.stringify({ error: "Invalid JSON format or request failed" }));
                }
            });
            return;
        }

        if (pathname === '/api/personnel/update' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const parsed = JSON.parse(body);
                    const { editingId, updatePayload } = parsed;
                    const result = await makeSupabaseRequest(`/rest/v1/personnel?personnel_id=eq.${editingId}`, 'PATCH', updatePayload);
                    res.writeHead(result.status, corsHeaders);
                    res.end(JSON.stringify(result.data));
                } catch (e) {
                    res.writeHead(400, corsHeaders);
                    res.end(JSON.stringify({ error: "Invalid JSON format or request failed" }));
                }
            });
            return;
        }

        if (pathname === '/api/personnel/delete' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const parsed = JSON.parse(body);
                    const { id } = parsed;
                    const result = await makeSupabaseRequest(`/rest/v1/personnel?personnel_id=eq.${id}`, 'DELETE');
                    res.writeHead(result.status, corsHeaders);
                    res.end(JSON.stringify(result.data));
                } catch (e) {
                    res.writeHead(400, corsHeaders);
                    res.end(JSON.stringify({ error: "Invalid JSON format or request failed" }));
                }
            });
            return;
        }

        // Not Found
        res.writeHead(404, corsHeaders);
        res.end(JSON.stringify({ error: "Not Found" }));

    } catch (err) {
        console.error("Proxy Request error:", err);
        res.writeHead(500, corsHeaders);
        res.end(JSON.stringify({ error: err.message || "Internal Server Error" }));
    }
});

server.listen(PORT, () => {
    console.log(`Supabase Admin proxy backend is running securely on http://localhost:${PORT}`);
});

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

const supabaseUrl = process.env.VITE_SUPABASE_URL || envConfig['VITE_SUPABASE_URL'] || 'https://ycykvkhpyxxhgroqchhd.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || envConfig['SUPABASE_SECRET_KEY'] || process.env.VITE_SUPABASE_SECRET_KEY || envConfig['VITE_SUPABASE_SECRET_KEY'];

if (!serviceRoleKey) {
    console.error("Error: SUPABASE_SECRET_KEY is missing from environment variables and .env!");
    process.exit(1);
}

const PORT = process.env.PORT || 3001;

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
                    
                    if ((result.status === 200 || result.status === 204) && updatePayload.personnel_id && Number(updatePayload.personnel_id) !== Number(editingId)) {
                        // Primary key has changed. Update the corresponding Auth user email.
                        try {
                            const usersRes = await makeSupabaseRequest('/auth/v1/admin/users', 'GET');
                            if (usersRes.status === 200 && usersRes.data && usersRes.data.users) {
                                const formatId = (id) => {
                                    const str = String(id);
                                    if (str.length === 8) {
                                        return `${str.slice(0, 4)}-${str.slice(4)}`;
                                    }
                                    return str;
                                };
                                const oldEmail1 = `${editingId}@invtrack.local`.toLowerCase();
                                const oldEmail2 = `${formatId(editingId)}@invtrack.local`.toLowerCase();
                                const newEmail = `${formatId(updatePayload.personnel_id)}@invtrack.local`.toLowerCase();
                                
                                const matchedUser = usersRes.data.users.find(u => 
                                    u.email && (u.email.toLowerCase() === oldEmail1 || u.email.toLowerCase() === oldEmail2)
                                );
                                
                                if (matchedUser) {
                                    console.log(`Updating auth email for user ${matchedUser.id} from ${matchedUser.email} to ${newEmail}`);
                                    await makeSupabaseRequest(`/auth/v1/admin/users/${matchedUser.id}`, 'PUT', {
                                        email: newEmail
                                    });
                                }
                            }
                        } catch (authErr) {
                            console.error("Error updating corresponding auth user email:", authErr);
                        }
                    }

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

        // Department endpoints
        if (pathname === '/api/departments/add' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const parsed = JSON.parse(body);
                    const { dept } = parsed;
                    
                    if (!dept) {
                        res.writeHead(400, corsHeaders);
                        res.end(JSON.stringify({ error: "Missing department name" }));
                        return;
                    }

                    const result = await makeSupabaseRequest('/rest/v1/department', 'POST', { dept });
                    res.writeHead(result.status, corsHeaders);
                    res.end(JSON.stringify(result.data));
                } catch (e) {
                    res.writeHead(400, corsHeaders);
                    res.end(JSON.stringify({ error: "Invalid JSON format or request failed" }));
                }
            });
            return;
        }

        if (pathname === '/api/departments/update' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const parsed = JSON.parse(body);
                    const { oldDept, newDept } = parsed;
                    
                    if (!oldDept || !newDept) {
                        res.writeHead(400, corsHeaders);
                        res.end(JSON.stringify({ error: "Missing oldDept or newDept" }));
                        return;
                    }

                    // 1. Create the new department
                    const addRes = await makeSupabaseRequest('/rest/v1/department', 'POST', { dept: newDept });
                    if (addRes.status !== 201 && addRes.status !== 200) {
                        res.writeHead(addRes.status, corsHeaders);
                        res.end(JSON.stringify({ error: "Failed to create new department name", details: addRes.data }));
                        return;
                    }

                    // 2. Update personnel referencing oldDept
                    const updatePersRes = await makeSupabaseRequest(`/rest/v1/personnel?dept=eq.${encodeURIComponent(oldDept)}`, 'PATCH', { dept: newDept });
                    if (updatePersRes.status !== 200 && updatePersRes.status !== 204) {
                        // Rollback new department
                        await makeSupabaseRequest(`/rest/v1/department?dept=eq.${encodeURIComponent(newDept)}`, 'DELETE');
                        res.writeHead(updatePersRes.status, corsHeaders);
                        res.end(JSON.stringify({ error: "Failed to update personnel department reference", details: updatePersRes.data }));
                        return;
                    }

                    // 3. Update requisition_issuance referencing oldDept
                    await makeSupabaseRequest(`/rest/v1/requisition_issuance?dept=eq.${encodeURIComponent(oldDept)}`, 'PATCH', { dept: newDept });

                    // 4. Update ppmps referencing oldDept
                    await makeSupabaseRequest(`/rest/v1/ppmps?department=eq.${encodeURIComponent(oldDept)}`, 'PATCH', { department: newDept });

                    // 5. Delete the old department
                    await makeSupabaseRequest(`/rest/v1/department?dept=eq.${encodeURIComponent(oldDept)}`, 'DELETE');
                    
                    res.writeHead(200, corsHeaders);
                    res.end(JSON.stringify({ success: true }));
                } catch (e) {
                    res.writeHead(400, corsHeaders);
                    res.end(JSON.stringify({ error: "Invalid JSON format or request failed" }));
                }
            });
            return;
        }

        if (pathname === '/api/departments/delete' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const parsed = JSON.parse(body);
                    const { dept } = parsed;
                    
                    if (!dept) {
                        res.writeHead(400, corsHeaders);
                        res.end(JSON.stringify({ error: "Missing department name" }));
                        return;
                    }

                    const result = await makeSupabaseRequest(`/rest/v1/department?dept=eq.${encodeURIComponent(dept)}`, 'DELETE');
                    res.writeHead(result.status, corsHeaders);
                    res.end(JSON.stringify(result.data));
                } catch (e) {
                    res.writeHead(400, corsHeaders);
                    res.end(JSON.stringify({ error: "Invalid JSON format or request failed" }));
                }
            });
            return;
        }

        // Category endpoints
        if (pathname === '/api/categories/update' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const parsed = JSON.parse(body);
                    const { oldName, newName } = parsed;
                    
                    if (!oldName || !newName) {
                        res.writeHead(400, corsHeaders);
                        res.end(JSON.stringify({ error: "Missing oldName or newName" }));
                        return;
                    }

                    // 1. Create the new category
                    const addRes = await makeSupabaseRequest('/rest/v1/categories', 'POST', { category_name: newName });
                    if (addRes.status !== 201 && addRes.status !== 200) {
                        res.writeHead(addRes.status, corsHeaders);
                        res.end(JSON.stringify({ error: "Failed to create new category name", details: addRes.data }));
                        return;
                    }

                    // 2. Update items referencing oldName
                    const updateItemsRes = await makeSupabaseRequest(`/rest/v1/inventory_procurement?category_name=eq.${encodeURIComponent(oldName)}`, 'PATCH', { category_name: newName });
                    if (updateItemsRes.status !== 200 && updateItemsRes.status !== 204) {
                        // Rollback new category
                        await makeSupabaseRequest(`/rest/v1/categories?category_name=eq.${encodeURIComponent(newName)}`, 'DELETE');
                        res.writeHead(updateItemsRes.status, corsHeaders);
                        res.end(JSON.stringify({ error: "Failed to update inventory category reference", details: updateItemsRes.data }));
                        return;
                    }

                    // 3. Delete the old category
                    await makeSupabaseRequest(`/rest/v1/categories?category_name=eq.${encodeURIComponent(oldName)}`, 'DELETE');
                    
                    res.writeHead(200, corsHeaders);
                    res.end(JSON.stringify({ success: true }));
                } catch (e) {
                    res.writeHead(400, corsHeaders);
                    res.end(JSON.stringify({ error: "Invalid JSON format or request failed" }));
                }
            });
            return;
        }

        if (pathname === '/api/categories/delete' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const parsed = JSON.parse(body);
                    const { categoryToDelete } = parsed;
                    
                    if (!categoryToDelete) {
                        res.writeHead(400, corsHeaders);
                        res.end(JSON.stringify({ error: "Missing categoryToDelete" }));
                        return;
                    }

                    // 1. Update items in inventory to null category
                    await makeSupabaseRequest(`/rest/v1/inventory_procurement?category_name=eq.${encodeURIComponent(categoryToDelete)}`, 'PATCH', { category_name: null });

                    // 2. Delete from categories table
                    const result = await makeSupabaseRequest(`/rest/v1/categories?category_name=eq.${encodeURIComponent(categoryToDelete)}`, 'DELETE');
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

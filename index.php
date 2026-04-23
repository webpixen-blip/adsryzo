<?php
/**
 * Ad Management System - Dashboard
 * Core Logic: ImgBB Integration & Config Management
 */

session_start();

// --- CONFIGURATION ---
define('ADMIN_PASSWORD', 'admin123'); // Default password
$configFile = 'config.json';

// --- HELPER FUNCTIONS ---
function loadConfig() {
    global $configFile;
    if (!file_exists($configFile)) {
        return ['target_url' => '', 'image_url' => '', 'imgbb_api_key' => ''];
    }
    return json_decode(file_get_contents($configFile), true);
}

function saveConfig($data) {
    global $configFile;
    file_put_contents($configFile, json_encode($data, JSON_PRETTY_PRINT));
}

// --- AUTH LOGIC ---
if (isset($_POST['login'])) {
    if ($_POST['password'] === ADMIN_PASSWORD) {
        $_SESSION['logged_in'] = true;
    } else {
        $error = "Invalid password.";
    }
}

if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: index.php");
    exit;
}

$loggedIn = isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;

// --- DASHBOARD ACTIONS ---
$message = '';
$config = loadConfig();

if ($loggedIn && $_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_POST['login'])) {
    $updated = false;

    // Handle API Key update
    if (isset($_POST['api_key'])) {
        $config['imgbb_api_key'] = trim($_POST['api_key']);
        $updated = true;
    }

    // Handle Target URL update
    if (isset($_POST['target_url'])) {
        $config['target_url'] = trim($_POST['target_url']);
        $updated = true;
    }

    // Handle Image Upload
    if (isset($_FILES['ad_image']) && $_FILES['ad_image']['error'] === UPLOAD_ERR_OK) {
        if (empty($config['imgbb_api_key'])) {
            $message = "Error: Please set an ImgBB API Key first!";
        } else {
            $imageData = base64_encode(file_get_contents($_FILES['ad_image']['tmp_name']));
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://api.imgbb.com/1/upload');
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, [
                'key' => $config['imgbb_api_key'],
                'image' => $imageData
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            
            $response = curl_exec($ch);
            $result = json_decode($response, true);
            curl_close($ch);

            if (isset($result['data']['url'])) {
                $config['image_url'] = $result['data']['url'];
                $updated = true;
                $message = "Ad updated successfully!";
            } else {
                $message = "Upload failed: " . ($result['error']['message'] ?? 'Unknown error');
            }
        }
    } else if ($updated) {
        $message = "Settings updated successfully!";
    }

    if ($updated) {
        saveConfig($config);
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ad Management Dashboard</title>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: 'Outfit', sans-serif;
            background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #eff6ff 100%);
            min-height: 100-vh;
        }
        .glass {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body class="flex items-center justify-center p-4 min-h-screen">

    <?php if (!$loggedIn): ?>
        <!-- Login UI -->
        <div class="glass p-10 rounded-[32px] shadow-2xl w-full max-w-md animate-fade-in">
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-2xl shadow-lg mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Admin Portal</h1>
                <p class="text-slate-500 mt-2">Manage your ad campaigns securely</p>
            </div>

            <?php if (isset($error)): ?>
                <div class="bg-red-50 text-red-500 p-3 rounded-xl mb-4 text-sm text-center border border-red-100"><?php echo $error; ?></div>
            <?php endif; ?>

            <form method="POST" class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1 ml-1">Password</label>
                    <input type="password" name="password" required autofocus
                        class="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="••••••••">
                </div>
                <button type="submit" name="login"
                    class="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Unlock Dashboard
                </button>
            </form>
            <p class="text-center text-slate-400 text-xs mt-6">Powered by Lightweight AdCenter</p>
        </div>

    <?php else: ?>
        <!-- Dashboard UI -->
        <div class="w-full max-w-6xl animate-fade-in">
            <div class="flex flex-col lg:flex-row gap-8">
                <!-- Sidebar Tools -->
                <div class="lg:w-1/3 space-y-6">
                    <div class="glass p-8 rounded-[32px] shadow-xl">
                        <div class="flex items-center justify-between mb-8">
                            <h2 class="text-xl font-bold text-slate-800">Ad Settings</h2>
                            <a href="?logout" class="text-slate-400 hover:text-red-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </a>
                        </div>

                        <?php if ($message): ?>
                            <div class="bg-indigo-50 text-indigo-700 p-4 rounded-2xl mb-6 text-sm border border-indigo-100 flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <?php echo $message; ?>
                            </div>
                        <?php endif; ?>

                        <form method="POST" enctype="multipart/form-data" class="space-y-6">
                            <!-- API Key -->
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">ImgBB API Key</label>
                                <input type="text" name="api_key" value="<?php echo htmlspecialchars($config['imgbb_api_key'] ?? ''); ?>"
                                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                                    placeholder="Enter your API Key">
                            </div>

                            <!-- Target URL -->
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Target Redirect URL</label>
                                <input type="url" name="target_url" value="<?php echo htmlspecialchars($config['target_url'] ?? ''); ?>" required
                                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                                    placeholder="https://example.com">
                            </div>

                            <!-- Image Upload -->
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Ad Image Banner</label>
                                <div class="relative group">
                                    <input type="file" name="ad_image" id="fileInput" class="hidden" accept="image/*" onchange="updateFileName()">
                                    <label for="fileInput" class="flex flex-col items-center justify-center w-full h-32 px-4 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-slate-50 group-hover:border-indigo-400 group-hover:bg-indigo-50/30 transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-400 group-hover:text-indigo-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span id="fileName" class="text-xs text-slate-400 font-medium group-hover:text-indigo-600">Click to upload new image</span>
                                    </label>
                                </div>
                            </div>

                            <button type="submit"
                                class="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-indigo-200 hover:scale-[1.02] flex items-center justify-center gap-2 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                                </svg>
                                Update Campaign
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Main Content / Live Preview -->
                <div class="lg:w-2/3">
                    <div class="glass h-full p-8 rounded-[32px] shadow-xl flex flex-col">
                        <div class="flex items-center justify-between mb-8">
                            <h2 class="text-xl font-bold text-slate-800">Live Ad Preview</h2>
                            <span class="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-green-200">Active</span>
                        </div>
                        
                        <div class="flex-grow flex items-center justify-center bg-slate-900/5 rounded-3xl overflow-hidden border border-slate-200 relative">
                            <!-- Pattern Overlay -->
                            <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(#4f46e5 1px, transparent 1px); background-size: 20px 20px;"></div>
                            
                            <div class="p-8 z-10 w-full flex flex-col items-center">
                                <p class="text-[10px] uppercase font-bold text-slate-400 mb-4 tracking-tighter">— Content Area Preview —</p>
                                
                                <a href="<?php echo htmlspecialchars($config['target_url']); ?>" target="_blank" class="block w-full max-w-lg transition-transform hover:scale-[1.01] duration-300">
                                    <div class="rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                                        <img src="<?php echo htmlspecialchars($config['image_url']); ?>" alt="Ad Preview" class="w-full h-auto">
                                    </div>
                                </a>

                                <div class="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
                                    <div class="bg-white/50 p-4 rounded-2xl border border-white/50 text-center">
                                        <p class="text-[10px] text-slate-400 uppercase font-bold">Image URL</p>
                                        <p class="text-xs text-indigo-600 font-medium truncate mt-1"><?php echo htmlspecialchars($config['image_url']); ?></p>
                                    </div>
                                    <div class="bg-white/50 p-4 rounded-2xl border border-white/50 text-center">
                                        <p class="text-[10px] text-slate-400 uppercase font-bold">Target Domain</p>
                                        <p class="text-xs text-purple-600 font-medium truncate mt-1"><?php echo parse_url($config['target_url'], PHP_URL_HOST); ?></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mt-6 flex items-center gap-4 text-slate-400 text-sm">
                            <div class="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Real-time Visualization</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 003.112 6.11a9.96 9.96 0 0115.864 12.19c-.83 1.35-1.933 2.503-3.236 3.409" />
                                </svg>
                                <span>End-to-End Encryption</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            function updateFileName() {
                const input = document.getElementById('fileInput');
                const label = document.getElementById('fileName');
                if (input.files.length > 0) {
                    label.innerText = "Selected: " + input.files[0].name;
                    label.classList.remove('text-slate-400');
                    label.classList.add('text-indigo-600');
                }
            }
        </script>
    <?php endif; ?>

</body>
</html>
